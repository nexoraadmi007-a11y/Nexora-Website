import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from './airtable'
import { compact } from './growth-associate'
import { growthConfig } from './growth-config'
import { hasValidContactPath, isGenericArticleLead } from './growth-copilot'
import { canonicalAssociateState } from './referral-repair'
import { recordLeadActivity } from './growth-actions'

type Fields = Record<string, any>

const individualTypes = new Set(['INDIVIDUAL', 'CAREER_ACCELERATOR', 'NYSC_MEMBER', 'FINAL_YEAR_STUDENT', 'RECENT_GRADUATE'])
const processedStatuses = new Set(['CONTACTED', 'REPLIED', 'INTERESTED', 'FOLLOW_UP_SCHEDULED', 'NOT_INTERESTED', 'INVALID', 'OPTED_OUT', 'APPLICATION_STARTED', 'PAYMENT_PENDING', 'CONVERTED', 'CLOSED_LOST'])
const terminalStatuses = new Set(['CONVERTED', 'CLOSED_LOST', 'INVALID', 'OPTED_OUT', 'NOT_INTERESTED'])
const assignableStatuses = new Set(['NEW', 'QUALIFIED', 'APPROVED_FOR_ASSIGNMENT', 'ACTIVE', 'RESEARCHING'])

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
  if (typeof raw === 'boolean') return raw ? 'true' : 'false'
  return typeof raw === 'string' ? raw.trim() : ''
}

function normalizedStatus(fields: Fields) {
  return (value(fields, 'Status') || 'NEW').toUpperCase().replaceAll(' ', '_')
}

function linkedIds(fields: Fields, name: string) {
  const raw = fields[name]
  return Array.isArray(raw) ? raw.filter((item) => typeof item === 'string') : []
}

export function isIndividualGrowthLead(fields: Fields) {
  const leadType = value(fields, 'Lead Type').toUpperCase().replaceAll(' ', '_')
  const programme = value(fields, 'Programme Match').toLowerCase()
  const signal = `${value(fields, 'Observable Signal')} ${value(fields, 'Persona')} ${value(fields, 'School')} ${value(fields, 'NYSC Status')}`.toLowerCase()
  const businessTerms = ['business', 'restaurant', 'corporate', 'company', 'sme', 'batp', 'transformation']
  if (businessTerms.some((term) => leadType.toLowerCase().includes(term) || programme.includes(term))) return false
  return individualTypes.has(leadType)
    || programme.includes('career accelerator')
    || programme.includes('content creation')
    || programme.includes('ui/ux')
    || programme.includes('financial analyst')
    || ['nysc', 'final-year', 'final year', 'graduate', 'internship', 'entry-level'].some((term) => signal.includes(term))
}

export function isProcessedLead(fields: Fields) {
  return processedStatuses.has(normalizedStatus(fields))
}

export function isOpenAssignedLead(fields: Fields) {
  const status = normalizedStatus(fields)
  return linkedIds(fields, 'Assigned Associate').length > 0 && !terminalStatuses.has(status)
}

export function isAssignableIndividualLead(fields: Fields) {
  if (!growthConfig.enableIndividualGrowthEngine) return false
  if (!isIndividualGrowthLead(fields)) return false
  if (value(fields, 'Opted Out').toLowerCase() === 'true') return false
  if (linkedIds(fields, 'Assigned Associate').length) return false
  const contactEvidence = `${value(fields, 'Public Profile URL')} ${value(fields, 'Source URL')} ${value(fields, 'Email')} ${value(fields, 'Phone')}`
  const sourceEvidence = `${contactEvidence} ${value(fields, 'Observable Signal')} ${value(fields, 'Qualification Reason')}`
  if (growthConfig.requireValidContactPath && !hasValidContactPath(contactEvidence)) return false
  if (!growthConfig.enableGenericBlogLeads && isGenericArticleLead(sourceEvidence)) return false
  return assignableStatuses.has(normalizedStatus(fields))
}

export type IndividualLeadInput = {
  fullName: string
  subtype?: string
  email?: string
  phone?: string
  publicProfileUrl?: string
  sourceUrl?: string
  sourcePlatform?: string
  sourceGroup?: string
  observableSignal: string
  institution?: string
  courseOfStudy?: string
  academicLevel?: string
  nyscStatus?: string
  nyscState?: string
  state?: string
  city?: string
  careerInterest?: string
  programmeMatch?: string
}

function normalizeLeadType(value: string) {
  const raw = value.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
  if (raw.includes('NYSC')) return 'NYSC_MEMBER'
  if (raw.includes('FINAL')) return 'FINAL_YEAR_STUDENT'
  if (raw.includes('GRAD')) return 'RECENT_GRADUATE'
  return 'INDIVIDUAL'
}

function lower(input: string) {
  return input.toLowerCase()
}

function scoreIndividualLead(input: IndividualLeadInput) {
  const evidence = lower(`${input.subtype || ''} ${input.observableSignal || ''} ${input.nyscStatus || ''} ${input.academicLevel || ''}`)
  let audienceMatch = 0
  if (['nysc', 'serving', 'corper', 'corp member'].some((term) => evidence.includes(term))) audienceMatch = 30
  else if (['final year', 'final-year', '400', '500 level'].some((term) => evidence.includes(term))) audienceMatch = 30
  else if (['recent graduate', 'graduate', 'graduated'].some((term) => evidence.includes(term))) audienceMatch = 22

  let careerIntent = 0
  if (['internship', 'entry-level', 'job', 'employment', 'remote work', 'career', 'skill', 'portfolio'].some((term) => evidence.includes(term))) careerIntent = 25
  else if (input.careerInterest) careerIntent = 15

  let programmeMatch = 0
  if (['content', 'ui/ux', 'design', 'finance', 'financial', 'analysis', 'data'].some((term) => evidence.includes(term) || lower(input.programmeMatch || '').includes(term))) programmeMatch = 20
  else if (input.programmeMatch) programmeMatch = 12

  const recency = ['today', 'yesterday', '2026', 'recent', 'currently', 'now'].some((term) => evidence.includes(term)) ? 15 : 8
  const contactability = input.email || input.phone ? 10 : input.publicProfileUrl || input.sourceUrl ? 7 : 0
  const total = Math.min(audienceMatch + careerIntent + programmeMatch + recency + contactability, 100)
  const confidence = total >= 75 ? 0.82 : total >= 60 ? 0.68 : 0.52
  return {
    total,
    confidence,
    components: { audienceMatch, careerIntent, programmeMatch, recency, contactability },
  }
}

async function findIndividualDuplicate(input: IndividualLeadInput) {
  const checks = [
    input.publicProfileUrl ? `{Public Profile URL}='${escapeFormula(input.publicProfileUrl)}'` : '',
    input.sourceUrl ? `{Source URL}='${escapeFormula(input.sourceUrl)}'` : '',
    input.email ? `LOWER({Email})='${escapeFormula(input.email.toLowerCase())}'` : '',
    input.phone ? `{Phone}='${escapeFormula(input.phone)}'` : '',
  ].filter(Boolean)

  for (const formula of checks) {
    const records = await listRecords<Fields>('Growth Leads', { formula, maxRecords: 1 }).catch(() => [])
    if (records[0]) return records[0]
  }
  return null
}

function programmeFor(input: IndividualLeadInput) {
  const raw = lower(`${input.programmeMatch || ''} ${input.careerInterest || ''} ${input.observableSignal || ''}`)
  if (raw.includes('ui') || raw.includes('design')) return 'Certified UI/UX Designer'
  if (raw.includes('finance') || raw.includes('financial') || raw.includes('data') || raw.includes('analysis')) return 'AI Financial Analyst'
  if (raw.includes('content') || raw.includes('creator') || raw.includes('social media')) return 'AI Content Creation'
  return input.programmeMatch || 'Career Accelerator'
}

export async function createIndividualLead(input: IndividualLeadInput) {
  const fullName = text(input.fullName, 180)
  const signal = text(input.observableSignal, 2000)
  if (!fullName) throw new Error('Full name is required.')
  if (!signal) throw new Error('Observable evidence is required.')
  if (!input.publicProfileUrl && !input.sourceUrl && !input.email && !input.phone) throw new Error('At least one source/profile/contact field is required.')

  const duplicate = await findIndividualDuplicate(input)
  if (duplicate) return { skipped: true, reason: 'duplicate', id: duplicate.id, name: fullName }

  const score = scoreIndividualLead(input)
  const leadType = normalizeLeadType(input.subtype || signal)
  const programmeMatch = programmeFor(input)
  const created = await createRecord<{ id: string; fields: Fields }>('Growth Leads', compact({
    'Growth Lead ID': `IL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    'Lead Type': leadType,
    Name: fullName,
    School: text(input.institution, 180),
    Department: text(input.courseOfStudy, 180),
    'Academic Level': text(input.academicLevel, 80),
    'NYSC Status': text(input.nyscStatus, 120),
    'NYSC State': text(input.nyscState, 120),
    City: text(input.city, 120),
    State: text(input.state, 120),
    Email: text(input.email, 254).toLowerCase(),
    Phone: text(input.phone, 80),
    'Public Profile URL': text(input.publicProfileUrl, 500),
    'Source URL': text(input.sourceUrl || input.publicProfileUrl, 500),
    'Discovery Source': text(input.sourceGroup || input.sourcePlatform, 120),
    'Final Contact Source': text(input.publicProfileUrl || input.sourceUrl || input.email || input.phone, 500),
    'Contactability Status': hasValidContactPath(`${input.publicProfileUrl || ''} ${input.sourceUrl || ''} ${input.email || ''} ${input.phone || ''}`) ? 'CONTACTABLE' : 'NEEDS_CONTACT_PATH',
    'Prospect Category': 'INDIVIDUAL',
    'Source Quality Status': isGenericArticleLead(`${input.sourceUrl || ''} ${input.publicProfileUrl || ''} ${signal}`) ? 'GENERIC_ARTICLE' : 'PUBLIC_PROFILE',
    'Source Platform': text(input.sourcePlatform, 120),
    'Source Group': text(input.sourceGroup, 180),
    'Observable Signal': signal,
    'Qualification Reason': `Public evidence supports ${leadType.replaceAll('_', ' ').toLowerCase()} fit for Career Accelerator.`,
    'Score Components JSON': JSON.stringify(score.components),
    'Education Stage': leadType.replaceAll('_', ' '),
    'Career Interest': text(input.careerInterest, 180),
    Persona: leadType.replaceAll('_', ' '),
    'Programme Match': programmeMatch,
    Score: score.total,
    Confidence: score.confidence,
    Status: score.total >= 60 ? 'Qualified' : 'New',
    'Discovery Timestamp': new Date().toISOString(),
    'Created At': new Date().toISOString(),
    'Updated At': new Date().toISOString(),
  }))
  return { imported: true, id: created.id, name: fullName, leadType, score: score.total, programmeMatch }
}

export async function getAvailableIndividualLeads(maxRecords = 500) {
  const records = await listRecords<Fields>('Growth Leads', { maxRecords, sortField: 'Score', direction: 'desc' }).catch(() => [])
  return records.filter((record) => isAssignableIndividualLead(record.fields))
}

export async function getActiveEligibleAssociates(maxRecords = 100) {
  const records = await listRecords<Fields>('Ambassadors', {
    formula: "OR({Ambassador Status}='Active',{Ambassador Status}='Approved',{Active}=TRUE())",
    maxRecords,
  }).catch(() => [])
  return records.filter((record) => {
    const state = canonicalAssociateState(record.fields)
    if (!['ACTIVE', 'APPROVED', 'ONBOARDING'].includes(state)) return false
    if (value(record.fields, 'Lead Access Status').toLowerCase().includes('paused')) return false
    if (value(record.fields, 'Operational Restriction')) return false
    return true
  })
}

export async function getAssociateIndividualLeads(associateId: string, maxRecords = 100) {
  const leads = await listRecords<Fields>('Growth Leads', {
    formula: `FIND('${escapeFormula(associateId)}',ARRAYJOIN({Assigned Associate}))`,
    maxRecords,
    sortField: 'Assigned At',
    direction: 'desc',
  }).catch(() => [])
  return leads.filter((lead) => isIndividualGrowthLead(lead.fields))
}

export async function getAssociateAllocationStatus(associate: AirtableRecord<Fields>) {
  const quota = Math.min(Math.max(number(associate.fields['Daily Lead Quota']) || growthConfig.defaultDailyIndividualLeadQuota, 1), 25)
  const threshold = Math.min(growthConfig.individualBatchProcessedThreshold, quota)
  const leads = await getAssociateIndividualLeads(associate.id, 100)
  const open = leads.filter((lead) => isOpenAssignedLead(lead.fields))
  const processed = open.filter((lead) => isProcessedLead(lead.fields))
  const remainingToEligibility = Math.max(threshold - processed.length, 0)
  const eligibleForNewBatch = open.length === 0 || processed.length >= threshold
  const reason = eligibleForNewBatch ? 'ELIGIBLE' : 'CURRENT_BATCH_NOT_PROCESSED'
  return {
    associateId: associate.id,
    associateName: value(associate.fields, 'Ambassador Name') || value(associate.fields, 'Full Name') || 'Unnamed associate',
    quota,
    threshold,
    currentBatch: Math.min(open.length, quota),
    processed: processed.length,
    unprocessed: Math.max(open.length - processed.length, 0),
    remainingToEligibility,
    eligibleForNewBatch,
    reason,
  }
}

async function audit(input: { actor: string; action: string; entityId: string; previousValue?: unknown; newValue?: unknown; reason: string }) {
  await createRecord('Growth Audit Logs', compact({
    'Audit ID': `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    'User ID': input.actor,
    Action: input.action,
    'Entity Type': 'Growth Leads',
    'Entity ID': input.entityId,
    'Previous Value': input.previousValue ? JSON.stringify(input.previousValue).slice(0, 9000) : '',
    'New Value': input.newValue ? JSON.stringify(input.newValue).slice(0, 9000) : '',
    Reason: input.reason,
    'Created At': new Date().toISOString(),
  })).catch(() => undefined)
}

async function assignLeads(input: { associateId: string; leads: Array<AirtableRecord<Fields>>; actor: string; method: string }) {
  const assigned = []
  for (const lead of input.leads) {
    if (linkedIds(lead.fields, 'Assigned Associate').length || !isAssignableIndividualLead(lead.fields)) continue
    await updateRecord('Growth Leads', lead.id, compact({
      'Assigned Associate': [input.associateId],
      Status: 'Assigned',
      'Assigned At': new Date().toISOString(),
      'Updated At': new Date().toISOString(),
    }))
    await recordLeadActivity({
      leadId: lead.id,
      associateId: input.associateId,
      action: 'assign',
      channel: 'Admin',
      verificationType: 'ADMIN_CONFIRMED',
      note: `Assigned by ${input.actor}. Method: ${input.method}.`,
    })
    await audit({
      actor: input.actor,
      action: 'INDIVIDUAL_LEAD_ASSIGNED',
      entityId: lead.id,
      previousValue: { status: value(lead.fields, 'Status'), assignedAssociate: linkedIds(lead.fields, 'Assigned Associate') },
      newValue: { status: 'Assigned', assignedAssociate: input.associateId },
      reason: input.method,
    })
    assigned.push(lead)
  }
  return assigned
}

export async function assignIndividualLeadsToAssociate(input: { associateId: string; count?: number; actor?: string; force?: boolean }) {
  const associate = (await listRecords<Fields>('Ambassadors', {
    formula: `RECORD_ID()='${escapeFormula(input.associateId)}'`,
    maxRecords: 1,
  }).catch(() => []))[0]
  if (!associate) throw new Error('Associate was not found.')
  const status = await getAssociateAllocationStatus(associate)
  const count = Math.min(Math.max(input.count || status.quota, 1), status.quota)
  if (!input.force && !status.eligibleForNewBatch) {
    return { assigned: [], status, skipped: true, reason: status.reason }
  }
  const available = (await getAvailableIndividualLeads(500)).slice(0, count)
  const assigned = await assignLeads({ associateId: associate.id, leads: available, actor: input.actor || 'web-admin', method: input.force ? 'ADMIN_FORCE' : 'HYBRID' })
  return { assigned, status, skipped: false, reason: assigned.length ? 'ASSIGNED' : 'NO_QUALIFIED_LEADS_AVAILABLE' }
}

export async function assignDailyIndividualLeadBatch(input: { countPerAssociate?: number; actor?: string; dryRun?: boolean; force?: boolean }) {
  if (!growthConfig.enableAutomaticLeadAllocation && !input.force) {
    return { associateCount: 0, availableBeforeAssignment: 0, totalAssigned: 0, assignments: [], skipped: true, reason: 'AUTOMATIC_LEAD_ALLOCATION_DISABLED' }
  }
  const associates = await getActiveEligibleAssociates(100)
  const available = await getAvailableIndividualLeads(500)
  const assignments = []
  let queue = [...available]
  for (const associate of associates) {
    const status = await getAssociateAllocationStatus(associate)
    const quota = Math.min(Math.max(input.countPerAssociate || status.quota, 1), status.quota)
    if (!input.force && !status.eligibleForNewBatch) {
      assignments.push({ associateId: associate.id, associateName: status.associateName, assignedCount: 0, reason: status.reason, status })
      continue
    }
    const batch = queue.slice(0, quota)
    queue = queue.slice(batch.length)
    if (input.dryRun) {
      assignments.push({ associateId: associate.id, associateName: status.associateName, assignedCount: batch.length, reason: batch.length ? 'DRY_RUN' : 'NO_QUALIFIED_LEADS_AVAILABLE', status })
      continue
    }
    const assigned = await assignLeads({ associateId: associate.id, leads: batch, actor: input.actor || 'daily-individual-allocation', method: input.force ? 'ADMIN_FORCE' : growthConfig.allocationMode })
    assignments.push({ associateId: associate.id, associateName: status.associateName, assignedCount: assigned.length, reason: assigned.length ? 'ASSIGNED' : 'NO_QUALIFIED_LEADS_AVAILABLE', status })
  }

  return {
    associateCount: associates.length,
    availableBeforeAssignment: available.length,
    totalAssigned: assignments.reduce((sum, item) => sum + item.assignedCount, 0),
    assignments,
  }
}
