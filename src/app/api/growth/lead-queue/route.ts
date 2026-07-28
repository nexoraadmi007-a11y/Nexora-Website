import { NextRequest, NextResponse } from 'next/server'
import { assignDailyIndividualLeadBatch, getActiveEligibleAssociates, getAvailableIndividualLeads } from '@/lib/individual-growth-engine'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

type Fields = Record<string, any>

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected
}

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function value(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  return typeof raw === 'string' ? raw.trim() : ''
}

function sector(fields: Fields) {
  return value(fields, 'Industry') || value(fields, 'Lead Type') || value(fields, 'Pipeline') || 'Other'
}

function summarizeLeads(records: Array<{ id: string; fields: Fields }>) {
  const sectorCounts = records.reduce<Record<string, number>>((acc, record) => {
    const key = sector(record.fields)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return {
    totalAvailable: records.length,
    sectors: Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
    sample: records.slice(0, 20).map((record) => ({
      id: record.id,
      name: value(record.fields, 'Business Name') || value(record.fields, 'Organization Name') || value(record.fields, 'Name') || 'Unnamed lead',
      sector: sector(record.fields),
      status: value(record.fields, 'Status') || 'New',
      location: value(record.fields, 'City') || value(record.fields, 'State') || value(record.fields, 'Location'),
      score: value(record.fields, 'Score') || value(record.fields, 'Strategic Score'),
    })),
  }
}

async function notify(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Lead queue Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const [available, associates] = await Promise.all([
      getAvailableIndividualLeads(500),
      getActiveEligibleAssociates(100),
    ])

    return NextResponse.json({
      ok: true,
      associateCount: associates.length,
      ...summarizeLeads(available),
    })
  } catch (error) {
    console.error('Lead queue preview failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Lead queue preview failed.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const countPerAssociate = Math.min(Math.max(Number(body.countPerAssociate || 5), 1), 25)
    const dryRun = Boolean(body.dryRun)

    if (dryRun) {
      const [available, associates] = await Promise.all([
        getAvailableIndividualLeads(500),
        getActiveEligibleAssociates(100),
      ])
      return NextResponse.json({
        ok: true,
        dryRun: true,
        countPerAssociate,
        associateCount: associates.length,
        estimatedAssignable: Math.min(available.length, associates.length * countPerAssociate),
        ...summarizeLeads(available),
      })
    }

    const result = await assignDailyIndividualLeadBatch({ countPerAssociate, actor: text(body.adminUserId, 120) || 'web-admin', force: Boolean(body.force) })
    await notify([
      'NEXORA daily lead queue assigned',
      `Associates: ${result.associateCount}`,
      `Available before assignment: ${result.availableBeforeAssignment}`,
      `Total assigned: ${result.totalAssigned}`,
      `Per associate target: ${countPerAssociate}`,
    ].join('\n'))

    return NextResponse.json({ ok: true, countPerAssociate, ...result })
  } catch (error) {
    console.error('Lead queue assignment failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Lead queue assignment failed.' }, { status: 500 })
  }
}
