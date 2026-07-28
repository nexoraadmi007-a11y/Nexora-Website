import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from './airtable'
import { codeFromName, compact, text } from './growth-associate'
import { growthConfig } from './growth-config'

type Fields = Record<string, any>

export type AssociateState = 'APPLICANT' | 'INTERVIEW_PENDING' | 'INTERVIEWED' | 'APPROVED' | 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'REJECTED'

function value(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'true' : 'false'
  return typeof raw === 'string' ? raw.trim() : ''
}

function boolField(fields: Fields, name: string) {
  const raw = fields[name]
  return raw === true || value(fields, name).toLowerCase() === 'true' || value(fields, name).toLowerCase() === 'yes'
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink'
}

function referralLink(code: string) {
  return `${baseUrl()}/career-accelerator?ref=${encodeURIComponent(code)}`
}

export function canonicalAssociateState(fields: Fields): AssociateState {
  const status = value(fields, 'Ambassador Status').toLowerCase()
  const onboarding = value(fields, 'Onboarding Status').toLowerCase()
  const active = boolField(fields, 'Active')
  if (status.includes('suspend') || onboarding.includes('suspend')) return 'SUSPENDED'
  if (status.includes('reject')) return 'REJECTED'
  if (status.includes('inactive') || onboarding.includes('paused')) return 'INACTIVE'
  if (active || status === 'active') return 'ACTIVE'
  if (status.includes('approved')) return 'APPROVED'
  if (onboarding.includes('invited') || onboarding.includes('pending')) return 'ONBOARDING'
  return 'APPLICANT'
}

export function associateReferralEligible(fields: Fields) {
  return ['APPROVED', 'ONBOARDING', 'ACTIVE'].includes(canonicalAssociateState(fields))
}

async function codeExists(code: string, exceptRecordId?: string) {
  if (!code) return false
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `{Referral Code}='${escapeFormula(code)}'`,
    maxRecords: 5,
  }).catch(() => [])
  return records.some((record) => record.id !== exceptRecordId)
}

async function uniqueReferralCode(record: AirtableRecord<Fields>) {
  const name = value(record.fields, 'Ambassador Name') || value(record.fields, 'Full Name') || value(record.fields, 'Email') || 'NEXORA'
  let candidate = codeFromName(name, record.id)
  let attempt = 0
  while (await codeExists(candidate, record.id)) {
    attempt += 1
    candidate = codeFromName(name, `${record.id}${attempt}${Math.random().toString(36).slice(2, 5)}`)
    if (attempt > 10) throw new Error('Could not generate a unique referral code.')
  }
  return candidate
}

async function audit(input: {
  actor: string
  action: string
  entityId: string
  previousValue?: unknown
  newValue?: unknown
  reason: string
}) {
  await createRecord('Growth Audit Logs', compact({
    'Audit ID': `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    'User ID': input.actor,
    Action: input.action,
    'Entity Type': 'Ambassadors',
    'Entity ID': input.entityId,
    'Previous Value': input.previousValue ? JSON.stringify(input.previousValue).slice(0, 9000) : '',
    'New Value': input.newValue ? JSON.stringify(input.newValue).slice(0, 9000) : '',
    Reason: input.reason,
    'Created At': new Date().toISOString(),
  })).catch(() => undefined)
}

export async function ensureAssociateReferral(record: AirtableRecord<Fields>, options?: { dryRun?: boolean; actor?: string; reason?: string }) {
  if (!growthConfig.enableReferralRepair) return { id: record.id, skipped: true, reason: 'Referral repair is disabled.' }
  if (!associateReferralEligible(record.fields)) return { id: record.id, skipped: true, reason: 'Associate is not approved/onboarding/active.' }

  const existingCode = value(record.fields, 'Referral Code')
  const existingLink = value(record.fields, 'Referral Link') || value(record.fields, 'Ambassador Referral Link')
  const nextCode = existingCode || await uniqueReferralCode(record)
  const nextLink = existingLink || referralLink(nextCode)
  const fields = compact({
    ...(!existingCode ? { 'Referral Code': nextCode } : {}),
    ...(!value(record.fields, 'Referral Link') ? { 'Referral Link': nextLink } : {}),
    ...(!value(record.fields, 'Ambassador Referral Link') ? { 'Ambassador Referral Link': nextLink } : {}),
    ...(!value(record.fields, 'Referral Status') ? { 'Referral Status': 'Active' } : {}),
    'Updated At': new Date().toISOString(),
  })

  if (!Object.keys(fields).length || (Object.keys(fields).length === 1 && fields['Updated At'])) {
    return { id: record.id, skipped: true, valid: true, referralCode: existingCode, referralLink: existingLink, reason: 'Referral already complete.' }
  }

  if (options?.dryRun) {
    return { id: record.id, dryRun: true, referralCode: nextCode, referralLink: nextLink, fields }
  }

  await updateRecord('Ambassadors', record.id, fields)
  await audit({
    actor: options?.actor || 'system',
    action: 'GENERATE_MISSING_REFERRAL',
    entityId: record.id,
    previousValue: { referralCode: existingCode, referralLink: existingLink },
    newValue: { referralCode: nextCode, referralLink: nextLink },
    reason: options?.reason || 'Approved/active associate missing referral data.',
  })
  return { id: record.id, repaired: true, referralCode: nextCode, referralLink: nextLink, fields }
}

export async function repairMissingAssociateReferrals(options?: { dryRun?: boolean; associateId?: string; actor?: string }) {
  const formula = options?.associateId
    ? `RECORD_ID()='${escapeFormula(options.associateId)}'`
    : "OR({Ambassador Status}='Active',{Ambassador Status}='Approved',{Active}=TRUE())"
  const associates = await listRecords<Fields>('Ambassadors', { formula, maxRecords: 100 }).catch(() => [])
  const results = []
  for (const associate of associates) {
    try {
      results.push(await ensureAssociateReferral(associate, {
        dryRun: options?.dryRun,
        actor: options?.actor || 'admin',
        reason: options?.dryRun ? 'Referral repair dry run.' : 'Referral repair apply.',
      }))
    } catch (error) {
      results.push({ id: associate.id, failed: true, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return {
    ok: true,
    dryRun: Boolean(options?.dryRun),
    scanned: associates.length,
    valid: results.filter((item: any) => item.valid).length,
    repaired: results.filter((item: any) => item.repaired).length,
    wouldRepair: results.filter((item: any) => item.dryRun).length,
    skipped: results.filter((item: any) => item.skipped).length,
    failed: results.filter((item: any) => item.failed).length,
    results,
  }
}

function issue(record: AirtableRecord<Fields>, code: string, severity: 'HIGH' | 'MEDIUM' | 'LOW', message: string) {
  return {
    id: `${record.id}-${code}`,
    recordId: record.id,
    entity: 'Ambassadors',
    code,
    severity,
    name: value(record.fields, 'Ambassador Name') || value(record.fields, 'Full Name') || value(record.fields, 'Email') || record.id,
    message,
  }
}

export async function getGrowthSystemHealth() {
  const [associates, registrations, leads] = await Promise.all([
    listRecords<Fields>('Ambassadors', { maxRecords: 100 }).catch(() => []),
    listRecords<Fields>('Ambassador Registrations', { maxRecords: 100 }).catch(() => []),
    listRecords<Fields>('Growth Leads', { maxRecords: 500 }).catch(() => []),
  ])
  const registrationAssociateIds = new Set(registrations.flatMap((record) => Array.isArray(record.fields['Created Ambassador']) ? record.fields['Created Ambassador'] : []))
  const issues: ReturnType<typeof issue>[] = []
  const referralCodes = new Map<string, string[]>()
  const emails = new Map<string, string[]>()
  const phones = new Map<string, string[]>()

  for (const associate of associates) {
    const fields = associate.fields
    const state = canonicalAssociateState(fields)
    const eligible = associateReferralEligible(fields)
    const code = value(fields, 'Referral Code')
    const link = value(fields, 'Referral Link') || value(fields, 'Ambassador Referral Link')
    const email = value(fields, 'Email').toLowerCase()
    const phone = value(fields, 'Phone Number') || value(fields, 'Contact')
    if (code) referralCodes.set(code.toLowerCase(), [...(referralCodes.get(code.toLowerCase()) || []), associate.id])
    if (email) emails.set(email, [...(emails.get(email) || []), associate.id])
    if (phone) phones.set(phone.replace(/\D/g, ''), [...(phones.get(phone.replace(/\D/g, '')) || []), associate.id])

    if (eligible && !code) issues.push(issue(associate, 'MISSING_REFERRAL_CODE', 'HIGH', 'Approved/active associate is missing a referral code.'))
    if (eligible && !link) issues.push(issue(associate, 'MISSING_REFERRAL_LINK', 'HIGH', 'Approved/active associate is missing a referral link.'))
    if (state === 'ACTIVE' && !value(fields, 'Telegram User ID')) issues.push(issue(associate, 'MISSING_TELEGRAM_ID', 'MEDIUM', 'Active associate does not have Telegram User ID linked.'))
    if (state === 'ACTIVE' && !email) issues.push(issue(associate, 'MISSING_EMAIL', 'MEDIUM', 'Active associate is missing email.'))
    if (state === 'ACTIVE' && !phone) issues.push(issue(associate, 'MISSING_PHONE', 'MEDIUM', 'Active associate is missing phone number.'))
    if (eligible && !registrationAssociateIds.has(associate.id)) issues.push(issue(associate, 'MISSING_INTERVIEW_RECORD', 'LOW', 'Associate has no linked registration/interview record. Referral repair should still work.'))
  }

  for (const [code, ids] of referralCodes) if (code && ids.length > 1) {
    ids.forEach((id) => issues.push({ id: `${id}-DUPLICATE_REFERRAL_CODE`, recordId: id, entity: 'Ambassadors', code: 'DUPLICATE_REFERRAL_CODE', severity: 'HIGH', name: id, message: `Referral code is duplicated across ${ids.length} associates.` }))
  }
  for (const [email, ids] of emails) if (email && ids.length > 1) {
    ids.forEach((id) => issues.push({ id: `${id}-DUPLICATE_EMAIL`, recordId: id, entity: 'Ambassadors', code: 'DUPLICATE_EMAIL', severity: 'MEDIUM', name: id, message: `Email is duplicated across ${ids.length} associates.` }))
  }
  for (const [phone, ids] of phones) if (phone && ids.length > 1) {
    ids.forEach((id) => issues.push({ id: `${id}-DUPLICATE_PHONE`, recordId: id, entity: 'Ambassadors', code: 'DUPLICATE_PHONE', severity: 'MEDIUM', name: id, message: `Phone is duplicated across ${ids.length} associates.` }))
  }

  const leadIssues = leads.filter((lead) => {
    const leadType = value(lead.fields, 'Lead Type').toUpperCase()
    const assigned = Array.isArray(lead.fields['Assigned Associate']) ? lead.fields['Assigned Associate'] : []
    return assigned.length > 1 || (leadType.includes('INDIVIDUAL') && !value(lead.fields, 'Observable Signal'))
  }).map((lead) => ({
    id: `${lead.id}-LEAD_HEALTH`,
    recordId: lead.id,
    entity: 'Growth Leads',
    code: Array.isArray(lead.fields['Assigned Associate']) && lead.fields['Assigned Associate'].length > 1 ? 'LEAD_ASSIGNED_TO_MULTIPLE_ASSOCIATES' : 'LEAD_MISSING_SOURCE_EVIDENCE',
    severity: 'MEDIUM' as const,
    name: value(lead.fields, 'Name') || value(lead.fields, 'Business Name') || lead.id,
    message: 'Lead needs admin review.',
  }))

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    associatesScanned: associates.length,
    registrationsScanned: registrations.length,
    leadsScanned: leads.length,
    issueCount: issues.length + leadIssues.length,
    issues: [...issues, ...leadIssues],
  }
}

