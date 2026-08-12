import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from '@/lib/airtable'
import { compact, text } from '@/lib/growth-associate'
import { ensureAssociateReferral } from '@/lib/referral-repair'

type Fields = Record<string, any>

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

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink').replace(/\/$/, '')
}

function partnerIdFromRecord(recordId: string) {
  const suffix = recordId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || Date.now().toString().slice(-6)
  return `NXP-${suffix}`
}

function fallbackReferralUrl(code: string) {
  return `${baseUrl()}/?ref=${encodeURIComponent(code)}`
}

async function findAmbassadorByEmail(email: string) {
  if (!email) return null
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `LOWER({Email})='${escapeFormula(email.toLowerCase())}'`,
    maxRecords: 1,
  }).catch(() => [])
  return records[0] || null
}

async function findAmbassadorByReferralCode(code: string) {
  if (!code) return null
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `LOWER({Referral Code})='${escapeFormula(code.toLowerCase())}'`,
    maxRecords: 1,
  }).catch(() => [])
  return records[0] || null
}

async function listForAssociate(table: string, field: string, associateId: string, sortField?: string) {
  const records = await listRecords<Fields>(table, {
    maxRecords: 100,
    sortField,
    direction: 'desc',
  }).catch(() => [])
  return records.filter((record) => Array.isArray(record.fields[field]) && record.fields[field].includes(associateId))
}

async function persistMissingPartnerId(record: AirtableRecord<Fields>) {
  const existing = value(record.fields, 'Partner ID') || value(record.fields, 'Ambassador ID')
  if (existing) return existing
  const partnerId = partnerIdFromRecord(record.id)
  await updateRecord('Ambassadors', record.id, compact({
    'Ambassador ID': partnerId,
    'Updated At': new Date().toISOString(),
  })).catch(() => undefined)
  return partnerId
}

export async function activatePartner(input: {
  fullName: string
  email: string
  whatsapp: string
  location?: string
  bankName?: string
  accountNumber?: string
}) {
  const email = text(input.email, 254).toLowerCase()
  const fullName = text(input.fullName, 180)
  const whatsapp = text(input.whatsapp, 80)
  if (!fullName || !email || !whatsapp) throw new Error('Full name, email and WhatsApp number are required.')

  let record = await findAmbassadorByEmail(email)
  if (!record) {
    record = await createRecord<AirtableRecord<Fields>>('Ambassadors', compact({
      'Ambassador ID': `NXP-${Date.now().toString().slice(-6)}`,
      'Ambassador Name': fullName,
      'Full Name': fullName,
      Email: email,
      'Phone Number': whatsapp,
      Contact: whatsapp,
      Location: text(input.location, 120),
      'Ambassador Status': 'Active',
      Active: true,
      'Referral Status': 'Active',
      'Commission Rate Percent': 15,
      'Total Referral Leads': 0,
      'Paid Referral Count': 0,
      'Total Commission Earned': 0,
      'Commission Paid': 0,
      'Commission Balance': 0,
      'Created At': new Date().toISOString(),
      'Updated At': new Date().toISOString(),
      Notes: 'Partner activated from Nexora Institute V2 partner portal.',
    }))
  } else {
    await updateRecord('Ambassadors', record.id, compact({
      'Ambassador Name': value(record.fields, 'Ambassador Name') || fullName,
      'Full Name': value(record.fields, 'Full Name') || fullName,
      'Phone Number': value(record.fields, 'Phone Number') || whatsapp,
      Contact: value(record.fields, 'Contact') || whatsapp,
      Location: value(record.fields, 'Location') || text(input.location, 120),
      'Ambassador Status': 'Active',
      Active: true,
      'Referral Status': 'Active',
      'Commission Rate Percent': number(record.fields['Commission Rate Percent']) || 15,
      'Updated At': new Date().toISOString(),
    })).catch(() => undefined)
    record = await findAmbassadorByEmail(email) || record
  }

  const ensured = await ensureAssociateReferral(record, {
    actor: 'partner-portal',
    reason: 'Partner portal activation requires referral identity.',
  })
  const refreshed = await findAmbassadorByEmail(email) || record
  const partnerId = await persistMissingPartnerId(refreshed)
  const referralCode = value(refreshed.fields, 'Referral Code') || (ensured as any).referralCode || ''
  const referralUrl = value(refreshed.fields, 'Referral Link') || value(refreshed.fields, 'Ambassador Referral Link') || (referralCode ? fallbackReferralUrl(referralCode) : '')

  return partnerDashboardFromRecord(refreshed, { partnerId, referralCode, referralUrl })
}

export async function getPartnerDashboard(input: { email?: string; referralCode?: string }) {
  const record = input.referralCode
    ? await findAmbassadorByReferralCode(text(input.referralCode, 120))
    : await findAmbassadorByEmail(text(input.email, 254).toLowerCase())
  if (!record) return null
  await ensureAssociateReferral(record, { actor: 'partner-portal', reason: 'Partner dashboard loaded missing referral identity.' }).catch(() => undefined)
  const refreshed = input.referralCode
    ? await findAmbassadorByReferralCode(text(input.referralCode, 120))
    : await findAmbassadorByEmail(text(input.email, 254).toLowerCase())
  return partnerDashboardFromRecord(refreshed || record)
}

export async function partnerDashboardFromRecord(record: AirtableRecord<Fields>, override?: { partnerId?: string; referralCode?: string; referralUrl?: string }) {
  const partnerId = override?.partnerId || value(record.fields, 'Partner ID') || value(record.fields, 'Ambassador ID') || partnerIdFromRecord(record.id)
  const referralCode = override?.referralCode || value(record.fields, 'Referral Code')
  const referralUrl = override?.referralUrl || value(record.fields, 'Referral Link') || value(record.fields, 'Ambassador Referral Link') || (referralCode ? fallbackReferralUrl(referralCode) : '')
  const [events, referrals, attributions] = await Promise.all([
    listForAssociate('Referral Events', 'Associate', record.id, 'Occurred At'),
    listForAssociate('Ambassador Referrals', 'Ambassador', record.id, 'Referral Date'),
    listForAssociate('Conversion Attribution', 'Associate', record.id, 'Updated At'),
  ])

  const clicks = events.filter((item) => value(item.fields, 'Event Type') === 'LINK_CLICKED').length
  const registrations = events.filter((item) => ['APPLICATION_STARTED', 'APPLICATION_COMPLETED', 'REGISTRATION_COMPLETED'].includes(value(item.fields, 'Event Type'))).length
  const paidRegistrations = referrals.filter((item) => ['Payment Confirmed', 'Qualified', 'Earned'].some((status) => value(item.fields, 'Referral Status').includes(status) || value(item.fields, 'Commission Status').includes(status))).length
  const qualifiedSales = attributions.filter((item) => ['APPROVED', 'REPAIRED'].includes(value(item.fields, 'Attribution Status'))).length
  const estimatedEarnings = number(record.fields['Commission Balance']) || referrals.reduce((sum, item) => sum + number(item.fields['Commission Amount']), 0)
  const conversionRate = clicks > 0 ? Math.round((qualifiedSales / clicks) * 1000) / 10 : null

  return {
    partner: {
      recordId: record.id,
      partnerId,
      name: value(record.fields, 'Ambassador Name') || value(record.fields, 'Full Name') || 'Nexora Partner',
      email: value(record.fields, 'Email'),
      status: value(record.fields, 'Ambassador Status') || 'Active',
      referralCode,
      referralUrl,
      commissionRate: number(record.fields['Commission Rate Percent']) || 15,
    },
    metrics: {
      clicks,
      registrations,
      paidRegistrations,
      qualifiedSales,
      conversionRate,
      directQualifiedSales: qualifiedSales,
      l2QualifiedSales: 0,
      l3QualifiedSales: 0,
      estimatedEarnings,
      nextMilestone: qualifiedSales >= 50 ? 'All current milestones reached' : qualifiedSales >= 20 ? '50 direct sales unlock +NGN 15,000' : qualifiedSales >= 10 ? '20 direct sales unlock +NGN 7,000' : '10 direct sales unlock NGN 3,000',
      nextPayout: '30th monthly payout cycle',
    },
    referrals: referrals.slice(0, 25).map((item) => ({
      name: value(item.fields, 'Referred Name') || value(item.fields, 'Customer Name') || 'Referred learner',
      programme: value(item.fields, 'Programme Name') || value(item.fields, 'Program') || 'Nexora Programme',
      track: value(item.fields, 'Track') || '-',
      registrationDate: value(item.fields, 'Referral Date') || '-',
      payment: value(item.fields, 'Referral Status') || '-',
      qualification: value(item.fields, 'Commission Status') || '-',
      commission: number(item.fields['Commission Amount']),
    })),
  }
}
