import { NextRequest, NextResponse } from 'next/server'
import { runApifyLeadImport } from '@/lib/apify-leads'
import { assignDailyIndividualLeadBatch, getActiveEligibleAssociates, getAvailableIndividualLeads } from '@/lib/individual-growth-engine'
import { sendTelegramMessage } from '@/lib/telegram'
import { growthConfig } from '@/lib/growth-config'

export const runtime = 'nodejs'

type Fields = Record<string, any>

function automationSecret() {
  return process.env.CRON_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.GROWTH_ADMIN_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = automationSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-secret') === expected || request.headers.get('x-nexora-admin-secret') === expected
}

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function number(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function csv(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) return value.map((item) => text(item, 120)).filter(Boolean)
  const raw = text(value, 1000)
  if (!raw) return fallback
  return raw.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
}

function fieldValue(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  return typeof raw === 'string' ? raw.trim() : ''
}

function sector(fields: Fields) {
  return fieldValue(fields, 'Industry') || fieldValue(fields, 'Lead Type') || fieldValue(fields, 'Pipeline') || 'Other'
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
    sample: records.slice(0, 10).map((record) => ({
      id: record.id,
      name: fieldValue(record.fields, 'Business Name') || fieldValue(record.fields, 'Organization Name') || fieldValue(record.fields, 'Name') || 'Unnamed lead',
      sector: sector(record.fields),
      status: fieldValue(record.fields, 'Status') || 'New',
      location: fieldValue(record.fields, 'City') || fieldValue(record.fields, 'State') || fieldValue(record.fields, 'Location'),
      score: fieldValue(record.fields, 'Score') || fieldValue(record.fields, 'Strategic Score'),
    })),
  }
}

async function notify(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Daily automation Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const dryRun = Boolean(body.dryRun)
    const skipImport = Boolean(body.skipImport)
    const skipAssignment = Boolean(body.skipAssignment)
    const sectors = csv(body.sectors || process.env.GROWTH_AUTOMATION_SECTORS, ['NYSC members', 'final-year students', 'recent graduates'])
    const locations = csv(body.locations || process.env.GROWTH_AUTOMATION_LOCATIONS, ['Nigeria'])
    const importLimit = number(body.importLimit || process.env.GROWTH_AUTOMATION_IMPORT_LIMIT, 10, 1, 50)
    const countPerAssociate = number(body.countPerAssociate || process.env.GROWTH_AUTOMATION_ASSIGN_COUNT, 5, 1, 25)
    const importPlan = locations.flatMap((location) => sectors.map((sectorName) => ({ sector: sectorName, location })))

    const availableBeforeImport = await getAvailableIndividualLeads(500)
    const associates = await getActiveEligibleAssociates(100)

    const imports = []
    const businessDiscoveryDisabled = !growthConfig.enableSmeGrowthEngine && !growthConfig.enableCorporateGrowthEngine
    if (!dryRun && !skipImport && !businessDiscoveryDisabled) {
      for (const item of importPlan) {
        try {
          const result = await runApifyLeadImport({
            sector: item.sector,
            query: item.sector,
            location: item.location,
            limit: importLimit,
          })
          imports.push({
            ...item,
            received: result.received,
            normalized: result.normalized,
            imported: result.imported.length,
            skipped: result.skipped.length,
          })
        } catch (error) {
          imports.push({
            ...item,
            received: 0,
            normalized: 0,
            imported: 0,
            skipped: 0,
            error: error instanceof Error ? error.message : 'Import failed.',
          })
        }
      }
    }

    const availableBeforeAssignment = dryRun ? availableBeforeImport : await getAvailableIndividualLeads(500)
    const assignment = !dryRun && !skipAssignment
      ? await assignDailyIndividualLeadBatch({ countPerAssociate, actor: 'daily-automation', force: Boolean(body.force) })
      : null
    const availableAfterAssignment = dryRun ? availableBeforeAssignment : await getAvailableIndividualLeads(500)

    const response = {
      ok: true,
      dryRun,
      skipImport,
      businessDiscoveryDisabled,
      skipAssignment,
      importLimit,
      countPerAssociate,
      importPlan,
      imports,
      associateCount: associates.length,
      estimatedAssignable: Math.min(availableBeforeAssignment.length, associates.length * countPerAssociate),
      queueBeforeImport: summarizeLeads(availableBeforeImport),
      queueBeforeAssignment: summarizeLeads(availableBeforeAssignment),
      queueAfterAssignment: summarizeLeads(availableAfterAssignment),
      assignment,
    }

    await notify([
      dryRun ? 'NEXORA daily automation dry run' : 'NEXORA daily automation completed',
      `Import plan: ${importPlan.length} search${importPlan.length === 1 ? '' : 'es'}`,
      `Imported: ${imports.reduce((sum, item) => sum + item.imported, 0)}`,
      `Available before assignment: ${availableBeforeAssignment.length}`,
      `Associates: ${associates.length}`,
      `Assigned: ${assignment?.totalAssigned || 0}`,
      `Queue after assignment: ${availableAfterAssignment.length}`,
    ].join('\n'))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Daily growth automation failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Daily growth automation failed.' }, { status: 500 })
  }
}
