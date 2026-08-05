import { NextRequest, NextResponse } from 'next/server'
import { escapeFormula, listRecords } from '@/lib/airtable'

export const runtime = 'nodejs'

type Fields = Record<string, any>

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function value(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  return typeof raw === 'string' ? raw.trim() : ''
}

function hasLinkedRecord(fields: Fields, field: string, recordId: string) {
  const linked = fields[field]
  return Array.isArray(linked) && linked.includes(recordId)
}

async function listForAssociate(table: string, field: string, associateId: string, sortField: string) {
  const records = await listRecords<Fields>(table, {
    maxRecords: 100,
    sortField,
    direction: 'desc',
  })
  return records.filter((record) => hasLinkedRecord(record.fields, field, associateId))
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

function withinCurrentMonth(raw: unknown) {
  const date = text(raw, 40)
  return date.startsWith(monthKey())
}

function referralLink(fields: Fields) {
  const existing = value(fields, 'Referral Link') || value(fields, 'Ambassador Referral Link')
  if (existing) return existing
  const code = value(fields, 'Referral Code')
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink'
  return code ? `${base}/career-accelerator?ref=${encodeURIComponent(code)}` : ''
}

async function findAssociate(referralCode: string) {
  const code = text(referralCode, 120)
  if (!code) return null
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `LOWER({Referral Code})='${escapeFormula(code.toLowerCase())}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = text(searchParams.get('code'), 120)
    if (!code) return NextResponse.json({ error: 'Referral code is required.' }, { status: 400 })

    const associate = await findAssociate(code)
    if (!associate) return NextResponse.json({ error: 'Referral code was not found.' }, { status: 404 })

    const [attributions, referrals, events] = await Promise.all([
      listForAssociate('Conversion Attribution', 'Associate', associate.id, 'Updated At').catch(() => []),
      listForAssociate('Ambassador Referrals', 'Ambassador', associate.id, 'Referral Date').catch(() => []),
      listForAssociate('Referral Events', 'Associate', associate.id, 'Occurred At').catch(() => []),
    ])

    const approved = attributions.filter((record) => ['APPROVED', 'REPAIRED'].includes(value(record.fields, 'Attribution Status')))
    const conflicts = attributions.filter((record) => ['CONFLICT', 'PENDING'].includes(value(record.fields, 'Attribution Status')))
    const monthApproved = approved.filter((record) => withinCurrentMonth(record.fields['Created At'] || record.fields['Updated At']))
    const target = number(associate.fields['Monthly Intake Target']) || 30
    const confirmedIntake = monthApproved.length
    const grossRevenue = monthApproved.reduce((sum, record) => sum + number(record.fields['Attributed Amount']), 0)
    const netRevenue = monthApproved.reduce((sum, record) => sum + (number(record.fields['Net Amount']) || number(record.fields['Attributed Amount'])), 0)
    const totalClicks = events.filter((record) => value(record.fields, 'Event Type') === 'LINK_CLICKED').length
    const checkoutStarted = events.filter((record) => value(record.fields, 'Event Type') === 'CHECKOUT_STARTED').length
    const progress = target > 0 ? confirmedIntake / target : 0
    const commissionRate = number(associate.fields['Commission Rate Percent']) || 5

    return NextResponse.json({
      ok: true,
      associate: {
        id: associate.id,
        name: value(associate.fields, 'Ambassador Name') || value(associate.fields, 'Full Name') || 'Growth Associate',
        email: value(associate.fields, 'Email'),
        status: value(associate.fields, 'Ambassador Status'),
        referralCode: value(associate.fields, 'Referral Code'),
        referralLink: referralLink(associate.fields),
        monthlyTarget: target,
        commissionRate,
        paidReferralCount: number(associate.fields['Paid Referral Count']),
        totalCommissionEarned: number(associate.fields['Total Commission Earned']),
        commissionPaid: number(associate.fields['Commission Paid']),
        commissionBalance: number(associate.fields['Commission Balance']),
      },
      metrics: {
        month: monthKey(),
        confirmedIntake,
        remainingTarget: Math.max(target - confirmedIntake, 0),
        progress,
        grossRevenue,
        netRevenue,
        totalClicks,
        checkoutStarted,
        totalReferralRecords: referrals.length,
        conflictCount: conflicts.length,
      },
      attributions: attributions.slice(0, 25).map((record) => ({
        id: record.id,
        paymentReference: value(record.fields, 'Payment Reference'),
        source: value(record.fields, 'Attribution Source'),
        status: value(record.fields, 'Attribution Status'),
        amount: number(record.fields['Attributed Amount']),
        netAmount: number(record.fields['Net Amount']),
        updatedAt: value(record.fields, 'Updated At') || value(record.fields, 'Created At'),
        conflictReason: value(record.fields, 'Conflict Reason'),
      })),
      referrals: referrals.slice(0, 25).map((record) => ({
        id: record.id,
        referralId: value(record.fields, 'Referral ID'),
        status: value(record.fields, 'Referral Status'),
        commissionStatus: value(record.fields, 'Commission Status'),
        commissionAmount: number(record.fields['Commission Amount']),
        programmeFee: number(record.fields['Programme Fee']),
        paymentReference: value(record.fields, 'Payment Reference'),
        referralDate: value(record.fields, 'Referral Date'),
      })),
      events: events.slice(0, 25).map((record) => ({
        id: record.id,
        eventType: value(record.fields, 'Event Type'),
        occurredAt: value(record.fields, 'Occurred At'),
        pageUrl: value(record.fields, 'Page URL'),
      })),
    })
  } catch (error) {
    console.error('Associate portal load failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Associate dashboard could not be loaded.' }, { status: 500 })
  }
}
