import { createRecord, escapeFormula, listRecords, updateRecord } from './airtable'
import type { ProspectSegment } from './commercial-knowledge'

export type SalesSession = {
  id: string
  associateId: string
  telegramChatId: string
  prospectReference: string
  prospectType: ProspectSegment
  selectedProgramme: string
  selectedTrack: string
  knownBusinessType: string
  knownBusinessGap: string
  currentObjective: string
  currentSalesStage: string
  lastProspectMessage: string
  lastCopilotReply: string
  lastQuestionAsked: string
  commitmentsMade: string[]
  applicationSent: boolean
  paymentLinkSent: boolean
  meetingStatus: string
  followUpDate: string
  updatedAt: string
  expiresAt: string
}

type SessionFields = Record<string, any>

const memory = new Map<string, SalesSession>()
const tableName = 'Telegram Sales Sessions'
const ttlMs = 24 * 60 * 60 * 1000

function key(input: { associateId?: string; telegramChatId?: string; prospectReference?: string; leadId?: string }) {
  return [input.associateId || 'unknown-associate', input.telegramChatId || 'unknown-chat', input.prospectReference || input.leadId || 'active-prospect'].join(':')
}

function expiry() {
  return new Date(Date.now() + ttlMs).toISOString()
}

function blankSession(input: { associateId?: string; telegramChatId?: string; prospectReference?: string; leadId?: string }): SalesSession {
  const now = new Date().toISOString()
  return {
    id: key(input),
    associateId: input.associateId || '',
    telegramChatId: input.telegramChatId || '',
    prospectReference: input.prospectReference || input.leadId || '',
    prospectType: 'UNKNOWN',
    selectedProgramme: '',
    selectedTrack: '',
    knownBusinessType: '',
    knownBusinessGap: '',
    currentObjective: '',
    currentSalesStage: 'NEW_CONVERSATION',
    lastProspectMessage: '',
    lastCopilotReply: '',
    lastQuestionAsked: '',
    commitmentsMade: [],
    applicationSent: false,
    paymentLinkSent: false,
    meetingStatus: '',
    followUpDate: '',
    updatedAt: now,
    expiresAt: expiry(),
  }
}

function fromFields(id: string, fields: SessionFields): SalesSession {
  return {
    id,
    associateId: fields['Associate ID'] || '',
    telegramChatId: fields['Telegram Chat ID'] || '',
    prospectReference: fields['Prospect Reference'] || '',
    prospectType: fields['Prospect Type'] || 'UNKNOWN',
    selectedProgramme: fields['Selected Programme'] || '',
    selectedTrack: fields['Selected Track'] || '',
    knownBusinessType: fields['Known Business Type'] || '',
    knownBusinessGap: fields['Known Business Gap'] || '',
    currentObjective: fields['Current Objective'] || '',
    currentSalesStage: fields['Current Sales Stage'] || 'NEW_CONVERSATION',
    lastProspectMessage: fields['Last Prospect Message'] || '',
    lastCopilotReply: fields['Last Copilot Reply'] || '',
    lastQuestionAsked: fields['Last Question Asked'] || '',
    commitmentsMade: String(fields['Commitments Made'] || '').split('\n').filter(Boolean),
    applicationSent: Boolean(fields['Application Sent']),
    paymentLinkSent: Boolean(fields['Payment Link Sent']),
    meetingStatus: fields['Meeting Status'] || '',
    followUpDate: fields['Follow Up Date'] || '',
    updatedAt: fields['Updated At'] || '',
    expiresAt: fields['Expires At'] || '',
  }
}

function toFields(session: SalesSession): SessionFields {
  return {
    'Associate ID': session.associateId,
    'Telegram Chat ID': session.telegramChatId,
    'Prospect Reference': session.prospectReference,
    'Prospect Type': session.prospectType,
    'Selected Programme': session.selectedProgramme,
    'Selected Track': session.selectedTrack,
    'Known Business Type': session.knownBusinessType,
    'Known Business Gap': session.knownBusinessGap,
    'Current Objective': session.currentObjective,
    'Current Sales Stage': session.currentSalesStage,
    'Last Prospect Message': session.lastProspectMessage,
    'Last Copilot Reply': session.lastCopilotReply,
    'Last Question Asked': session.lastQuestionAsked,
    'Commitments Made': session.commitmentsMade.join('\n'),
    'Application Sent': session.applicationSent,
    'Payment Link Sent': session.paymentLinkSent,
    'Meeting Status': session.meetingStatus,
    'Follow Up Date': session.followUpDate,
    'Updated At': session.updatedAt,
    'Expires At': session.expiresAt,
  }
}

function expired(session: SalesSession) {
  return Boolean(session.expiresAt && Date.parse(session.expiresAt) < Date.now())
}

export async function getSalesSession(input: { associateId?: string; telegramChatId?: string; prospectReference?: string; leadId?: string }) {
  const localKey = key(input)
  const cached = memory.get(localKey)
  if (cached && !expired(cached)) return cached
  const formula = `AND({Associate ID}='${escapeFormula(input.associateId || '')}',{Telegram Chat ID}='${escapeFormula(input.telegramChatId || '')}',{Prospect Reference}='${escapeFormula(input.prospectReference || input.leadId || '')}')`
  const record = await listRecords<SessionFields>(tableName, { formula, maxRecords: 1 }).then((records) => records[0]).catch(() => null)
  if (record) {
    const session = fromFields(record.id, record.fields)
    if (!expired(session)) {
      memory.set(localKey, session)
      return session
    }
  }
  const created = blankSession(input)
  memory.set(localKey, created)
  return created
}

export async function saveSalesSession(input: { key?: string; recordId?: string; session: SalesSession }) {
  const session = { ...input.session, updatedAt: new Date().toISOString(), expiresAt: expiry() }
  const localKey = input.key || [session.associateId || 'unknown-associate', session.telegramChatId || 'unknown-chat', session.prospectReference || 'active-prospect'].join(':')
  memory.set(localKey, session)
  if (session.id.startsWith('rec')) {
    await updateRecord(tableName, session.id, toFields(session)).catch(() => undefined)
  } else {
    const created = await createRecord<{ id: string }>(tableName, toFields(session)).catch(() => null)
    if (created?.id) {
      session.id = created.id
      memory.set(localKey, session)
    }
  }
  return session
}

export async function resetSalesSession(input: { associateId?: string; telegramChatId?: string; prospectReference?: string; leadId?: string }) {
  const session = blankSession(input)
  memory.set(key(input), session)
  return session
}

export function describeSalesSession(session: SalesSession) {
  return [
    'NEXORA Conversation Status',
    '',
    `Prospect Type: ${session.prospectType}`,
    `Selected Programme: ${session.selectedProgramme || 'Not selected'}`,
    `Selected Track: ${session.selectedTrack || 'Not selected'}`,
    `Business Type: ${session.knownBusinessType || 'Not captured'}`,
    `Business Gap: ${session.knownBusinessGap || 'Not captured'}`,
    `Current Stage: ${session.currentSalesStage}`,
    `Current Objective: ${session.currentObjective || 'Not set'}`,
    `Expires At: ${session.expiresAt}`,
  ].join('\n')
}
