import { NextRequest, NextResponse } from 'next/server'
import { listRecords, type AirtableRecord } from '@/lib/airtable'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

type GrowthLeadFields = Record<string, any>

function isAuthorized(request: NextRequest) {
  const expected = process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-secret') === expected
}

function value(fields: GrowthLeadFields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  return typeof raw === 'string' || typeof raw === 'number' ? String(raw).trim() : ''
}

function pickAcrossSectors(records: Array<AirtableRecord<GrowthLeadFields>>, count: number) {
  const selected: Array<AirtableRecord<GrowthLeadFields>> = []
  const usedIndustries = new Set<string>()

  for (const record of records) {
    const industry = value(record.fields, 'Industry') || 'Other'
    if (usedIndustries.has(industry)) continue
    selected.push(record)
    usedIndustries.add(industry)
    if (selected.length >= count) return selected
  }

  for (const record of records) {
    if (selected.some((item) => item.id === record.id)) continue
    selected.push(record)
    if (selected.length >= count) return selected
  }

  return selected
}

function leadLine(record: AirtableRecord<GrowthLeadFields>, index: number) {
  const fields = record.fields
  const name = value(fields, 'Organization Name') || 'Unnamed business'
  const industry = value(fields, 'Industry') || 'Unknown sector'
  const location = value(fields, 'Location') || value(fields, 'State') || 'Location unknown'
  const type = value(fields, 'Organization Type') || 'Business'
  const pipeline = value(fields, 'Pipeline') || 'Corporate AI Training'
  const contact = value(fields, 'Contact Person')
  const position = value(fields, 'Position')
  const phone = value(fields, 'Phone')
  const email = value(fields, 'Email')
  const website = value(fields, 'Website')
  const nextAction = value(fields, 'Next Action') || 'Research decision maker and send BATP/corporate AI offer.'
  const score = value(fields, 'Strategic Score')
  const priority = value(fields, 'Priority')

  return [
    `${index}. ${name}`,
    `Sector: ${industry} | Type: ${type}`,
    `Location: ${location}`,
    `Pipeline: ${pipeline}${priority ? ` | Priority: ${priority}` : ''}${score ? ` | Score: ${score}` : ''}`,
    contact ? `Contact: ${contact}${position ? `, ${position}` : ''}` : '',
    phone || email ? `Reach: ${[phone, email].filter(Boolean).join(' | ')}` : '',
    website ? `Website: ${website}` : '',
    `Next: ${nextAction}`,
  ].filter(Boolean).join('\n')
}

function buildDigest(records: Array<AirtableRecord<GrowthLeadFields>>, requestedCount: number) {
  const date = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Lagos',
  })
  const sectors = Array.from(new Set(records.map((record) => value(record.fields, 'Industry') || 'Other')))

  return [
    `NEXORA Daily Business Lead Digest`,
    date,
    '',
    `Leads sent: ${records.length}/${requestedCount}`,
    `Sectors: ${sectors.join(', ') || 'None'}`,
    '',
    records.length
      ? records.map((record, index) => leadLine(record, index + 1)).join('\n\n')
      : 'No Growth Leads are available yet. Add leads to Airtable or connect a lead discovery provider.',
    '',
    records.length < requestedCount
      ? `Note: The CRM currently has fewer than ${requestedCount} available leads. Add more Growth Leads or connect a discovery API to reach the daily target.`
      : 'Review these leads, prioritize Tier A opportunities, and move qualified businesses into outreach.',
  ].join('\n')
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized daily lead digest.' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({})) as { count?: number; dryRun?: boolean }
    const requestedCount = Math.min(Math.max(Number(body.count || 10), 1), 25)
    const records = await listRecords<GrowthLeadFields>('Growth Leads', {
      formula: "OR({Status}='New',{Status}='Researching',{Status}='Active',{Status}='Qualified')",
      maxRecords: 100,
      sortField: 'Strategic Score',
      direction: 'desc',
    }).catch(async () => listRecords<GrowthLeadFields>('Growth Leads', { maxRecords: 100 }))

    const selected = pickAcrossSectors(records, requestedCount)
    const message = buildDigest(selected, requestedCount)

    if (!body.dryRun) {
      const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
      if (!chatId) throw new Error('TELEGRAM_ADMIN_CHAT_ID is not configured')
      await sendTelegramMessage(chatId, message)
    }

    return NextResponse.json({
      ok: true,
      sent: !body.dryRun,
      requestedCount,
      leadCount: selected.length,
      message,
    })
  } catch (error) {
    console.error('Daily lead digest failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Daily lead digest failed.' }, { status: 500 })
  }
}
