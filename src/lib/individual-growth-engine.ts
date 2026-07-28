import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from './airtable'
import { compact } from './growth-associate'
import { growthConfig } from './growth-config'
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
  return assignableStatuses.has(normalizedStatus(fields))
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

