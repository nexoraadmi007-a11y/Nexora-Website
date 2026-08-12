import { NextRequest, NextResponse } from 'next/server'
import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from '@/lib/airtable'
import { getGrowthOverview, upsertMonthlyPerformance } from '@/lib/growth-operations'
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

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

function linkedId(fields: Fields, name: string) {
  const raw = fields[name]
  return Array.isArray(raw) ? text(raw[0], 120) : ''
}

function value(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  return typeof raw === 'string' ? raw.trim() : ''
}

async function notify(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Attribution review Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

async function findAttribution(id: string) {
  const records = await listRecords<Fields>('Conversion Attribution', {
    formula: `RECORD_ID()='${escapeFormula(id)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

async function findByReference<T extends Fields>(table: string, field: string, reference: string) {
  if (!reference) return null
  const records = await listRecords<T>(table, {
    formula: `{${field}}='${escapeFormula(reference)}'`,
    maxRecords: 1,
  }).catch(() => [])
  return records[0] || null
}

async function getAssociates() {
  return listRecords<Fields>('Ambassadors', {
    formula: "OR({Ambassador Status}='Active',{Active}=TRUE())",
    maxRecords: 100,
  }).catch(async () => listRecords<Fields>('Ambassadors', { maxRecords: 100 }))
}

async function incrementAssociateStats(associateId: string, amount: number) {
  if (!associateId || amount <= 0) return
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `RECORD_ID()='${escapeFormula(associateId)}'`,
    maxRecords: 1,
  }).catch(() => [])
  const associate = records[0]
  if (!associate) return
  const rate = number(associate.fields['Commission Rate Percent']) || 15
  const earned = Math.round(amount * (rate / 100))
  const totalEarned = number(associate.fields['Total Commission Earned']) + earned
  const paid = number(associate.fields['Commission Paid'])
  await updateRecord('Ambassadors', associateId, compact({
    'Paid Referral Count': number(associate.fields['Paid Referral Count']) + 1,
    'Total Commission Earned': totalEarned,
    'Commission Balance': Math.max(totalEarned - paid, 0),
    'Updated At': new Date().toISOString(),
  })).catch(() => undefined)
}

async function writeAudit(input: {
  action: string
  entityId: string
  previousValue: unknown
  newValue: unknown
  reason: string
}) {
  await createRecord('Growth Audit Logs', compact({
    'Audit ID': `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    'User ID': 'web-admin',
    Action: input.action,
    'Entity Type': 'Conversion Attribution',
    'Entity ID': input.entityId,
    'Previous Value': JSON.stringify(input.previousValue).slice(0, 9000),
    'New Value': JSON.stringify(input.newValue).slice(0, 9000),
    Reason: input.reason,
    'Created At': new Date().toISOString(),
  })).catch(() => undefined)
}

async function refreshPerformance() {
  const overview = await getGrowthOverview()
  await upsertMonthlyPerformance(overview)
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const status = text(searchParams.get('status'), 80)
    const formula = status
      ? `{Attribution Status}='${escapeFormula(status)}'`
      : "OR({Attribution Status}='CONFLICT',{Attribution Status}='PENDING')"
    const [records, associates] = await Promise.all([
      listRecords<Fields>('Conversion Attribution', {
        formula,
        maxRecords: 100,
        sortField: 'Updated At',
        direction: 'desc',
      }).catch(() => []),
      getAssociates(),
    ])

    return NextResponse.json({
      ok: true,
      attributions: records.map((record) => ({ id: record.id, fields: record.fields })),
      associates: associates.map((associate) => ({
        id: associate.id,
        name: value(associate.fields, 'Ambassador Name') || value(associate.fields, 'Full Name') || 'Unnamed associate',
        referralCode: value(associate.fields, 'Referral Code'),
      })),
    })
  } catch (error) {
    console.error('Attribution review load failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Attribution review records could not be loaded.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await request.json()
    const id = text(body.id, 120)
    const action = text(body.action, 80)
    const associateId = text(body.associateId, 120)
    const note = text(body.note, 1200)
    if (!id || !['approve', 'reject', 'assign'].includes(action)) {
      return NextResponse.json({ error: 'A valid attribution id and action are required.' }, { status: 400 })
    }

    const attribution = await findAttribution(id)
    if (!attribution) return NextResponse.json({ error: 'Attribution record not found.' }, { status: 404 })

    const previous = attribution.fields
    const previousStatus = value(previous, 'Attribution Status')
    const previousAssociateId = linkedId(previous, 'Associate')
    const selectedAssociateId = associateId || previousAssociateId
    const amount = number(previous['Attributed Amount'])
    const paymentReference = value(previous, 'Payment Reference')

    if ((action === 'approve' || action === 'assign') && !selectedAssociateId) {
      return NextResponse.json({ error: 'Select the associate that should receive this attribution.' }, { status: 400 })
    }

    const fields = action === 'reject'
      ? compact({
        'Attribution Status': 'REJECTED',
        'Attribution Source': 'CONFLICT_REVIEW',
        'Conflict Reason': note || value(previous, 'Conflict Reason') || 'Rejected by admin review.',
        'Approved By': 'web-admin',
        'Updated At': new Date().toISOString(),
      })
      : compact({
        Associate: [selectedAssociateId],
        'Attribution Status': 'APPROVED',
        'Attribution Source': action === 'assign' || previousStatus === 'CONFLICT' ? 'ADMIN_CONFIRMED' : value(previous, 'Attribution Source') || 'ADMIN_CONFIRMED',
        'Conflict Reason': note ? `Resolved by admin: ${note}` : 'Resolved by admin.',
        'Approved By': 'web-admin',
        'Updated At': new Date().toISOString(),
      })

    const updated = await updateRecord<AirtableRecord<Fields>>('Conversion Attribution', id, fields)
    const referral = await findByReference<Fields>('Ambassador Referrals', 'Payment Reference', paymentReference)

    if (referral) {
      if (action === 'reject') {
        await updateRecord('Ambassador Referrals', referral.id, compact({
          'Referral Status': 'Rejected',
          'Commission Status': 'Rejected',
          'Qualifying Referral': false,
          Notes: note ? `Attribution rejected by admin. ${note}` : 'Attribution rejected by admin.',
        })).catch(() => undefined)
      } else {
        await updateRecord('Ambassador Referrals', referral.id, compact({
          Ambassador: [selectedAssociateId],
          'Referral Status': 'Payment Confirmed',
          'Commission Status': 'Earned',
          'Qualifying Referral': true,
          'Qualification Date': new Date().toISOString().slice(0, 10),
          Notes: note ? `Attribution approved by admin. ${note}` : 'Attribution approved by admin.',
        })).catch(() => undefined)
      }
    }

    if (action !== 'reject' && previousStatus !== 'APPROVED') {
      await incrementAssociateStats(selectedAssociateId, amount)
    }
    await writeAudit({
      action: `attribution_${action}`,
      entityId: id,
      previousValue: previous,
      newValue: updated.fields,
      reason: note || `${action} from admin review dashboard`,
    })
    await refreshPerformance().catch((error) => console.error('Performance refresh after attribution review failed', error instanceof Error ? error.message : error))

    await notify([
      'Growth attribution review update',
      `Action: ${action}`,
      `Payment reference: ${paymentReference || 'No reference'}`,
      `Status: ${updated.fields['Attribution Status'] || fields['Attribution Status']}`,
      selectedAssociateId ? `Associate: ${selectedAssociateId}` : '',
      note ? `Note: ${note.slice(0, 400)}` : '',
    ].filter(Boolean).join('\n'))

    return NextResponse.json({ ok: true, attribution: { id: updated.id, fields: updated.fields } })
  } catch (error) {
    console.error('Attribution review update failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Attribution review update failed.' }, { status: 500 })
  }
}
