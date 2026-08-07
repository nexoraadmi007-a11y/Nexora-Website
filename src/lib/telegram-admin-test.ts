import { createRecord, escapeFormula, listRecords, type AirtableRecord } from './airtable'
import { sendAdminBusinessLeadTest } from './business-lead-discovery'
import { findGrowthLead } from './growth-actions'
import { formatConversationCopilotResult, runConversationCopilot } from './growth-copilot'
import { sendTelegramMessage, type TelegramMessage } from './telegram'

type Fields = Record<string, any>

type AdminIdentity = {
  adminUserId: string
  telegramUserId: string
  telegramChatId: string
  sourceOfIdentity: 'DATABASE' | 'ENVIRONMENT' | 'APPLICATION_SETTINGS' | 'TELEGRAM_REGISTRATION' | 'AIRTABLE' | 'MANUAL_VERIFICATION'
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'DISABLED'
}

type TestSession = {
  state: 'AWAITING_SALES_CONVERSATION'
  expiresAt: number
}

const sessions = new Map<string, TestSession>()
const individualTypes = new Set(['INDIVIDUAL', 'NYSC_MEMBER', 'FINAL_YEAR_STUDENT', 'RECENT_GRADUATE', 'CAREER_ACCELERATOR'])

function bool(name: string, fallback: boolean) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

function int(name: string, fallback: number, min: number, max: number) {
  const parsed = Number(process.env[name])
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.round(parsed), min), max)
}

function text(value: unknown, max = 2000) {
  if (typeof value === 'number') return String(value).slice(0, max)
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function value(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  return typeof raw === 'string' ? raw.trim() : ''
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, item]) => item !== '' && item !== undefined && item !== null))
}

function allowedIds() {
  return text(process.env.TELEGRAM_TEST_ALLOWED_USER_IDS || process.env.TELEGRAM_ADMIN_USER_ID || process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID, 1000)
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function adminTelegramTestConfig() {
  return {
    enabled: bool('ENABLE_ADMIN_TELEGRAM_TEST_MODE', true),
    leadPreviewEnabled: bool('ENABLE_TELEGRAM_LEAD_PREVIEW', true),
    aiResponseEnabled: bool('ENABLE_TELEGRAM_AI_RESPONSE_TEST', true),
    adminOnly: bool('TELEGRAM_TEST_ADMIN_ONLY', true),
    associateDeliveryEnabled: bool('ENABLE_ASSOCIATE_TELEGRAM_LEAD_DELIVERY', false),
    businessLeadDiscoveryEnabled: bool('ENABLE_BUSINESS_LEAD_DISCOVERY', true),
    individualLeadDiscoveryEnabled: bool('ENABLE_INDIVIDUAL_LEAD_DISCOVERY', false),
    associateLeadDeliveryEnabled: bool('ENABLE_ASSOCIATE_LEAD_DELIVERY', false),
    adminLeadTestDeliveryEnabled: bool('ENABLE_ADMIN_LEAD_TEST_DELIVERY', true),
    allowLiveLeadTest: bool('ALLOW_ADMIN_LIVE_LEAD_TEST', false),
    maxPreviewCount: int('TELEGRAM_TEST_MAX_LEADS', 10, 1, 10),
    defaultPreviewCount: int('TELEGRAM_TEST_DEFAULT_LEADS', 5, 1, 10),
    sessionTtlMs: int('TELEGRAM_TEST_SESSION_TTL_MINUTES', 10, 1, 60) * 60 * 1000,
  }
}

export async function resolveCurrentAdminTelegramIdentity(input: { telegramUserId?: string; telegramChatId?: string } = {}): Promise<AdminIdentity> {
  const envUserId = text(
    process.env.TELEGRAM_ADMIN_USER_ID ||
    process.env.ADMIN_TELEGRAM_ID ||
    process.env.TELEGRAM_OWNER_ID ||
    process.env.SUPER_ADMIN_TELEGRAM_ID ||
    process.env.TELEGRAM_ADMIN_CHAT_ID,
    120,
  )
  const envChatId = text(process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.ADMIN_CHAT_ID, 120) || envUserId
  const ids = new Set(allowedIds())
  if (envUserId) ids.add(envUserId)
  if (envChatId) ids.add(envChatId)

  if (input.telegramUserId && ids.has(input.telegramUserId)) {
    return {
      adminUserId: input.telegramUserId,
      telegramUserId: input.telegramUserId,
      telegramChatId: input.telegramChatId || envChatId || input.telegramUserId,
      sourceOfIdentity: 'ENVIRONMENT',
      verificationStatus: 'VERIFIED',
    }
  }

  if (input.telegramChatId && ids.has(input.telegramChatId)) {
    return {
      adminUserId: input.telegramChatId,
      telegramUserId: input.telegramUserId || input.telegramChatId,
      telegramChatId: input.telegramChatId,
      sourceOfIdentity: 'ENVIRONMENT',
      verificationStatus: 'VERIFIED',
    }
  }

  return {
    adminUserId: '',
    telegramUserId: input.telegramUserId || '',
    telegramChatId: input.telegramChatId || '',
    sourceOfIdentity: envUserId || envChatId ? 'ENVIRONMENT' : 'APPLICATION_SETTINGS',
    verificationStatus: 'UNVERIFIED',
  }
}

export async function isAllowedAdminTestUser(telegramUserId: string, telegramChatId: string) {
  const config = adminTelegramTestConfig()
  if (!config.enabled) return false
  const identity = await resolveCurrentAdminTelegramIdentity({ telegramUserId, telegramChatId })
  return identity.verificationStatus === 'VERIFIED'
}

export async function logTelegramTestEvent(input: {
  telegramUserId: string
  adminUserId?: string
  eventType: string
  leadId?: string
  payload?: Record<string, unknown>
}) {
  const now = new Date().toISOString()
  await createRecord('Growth Audit Logs', compact({
    'Audit ID': `TGTEST-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    'User ID': input.adminUserId || input.telegramUserId,
    Action: `TELEGRAM_TEST_${input.eventType}`,
    'Entity Type': input.leadId ? 'Growth Leads' : 'Telegram Test',
    'Entity ID': input.leadId || input.telegramUserId,
    'Previous Value': '',
    'New Value': JSON.stringify({ is_test: true, mode: 'TEST', ...(input.payload || {}) }),
    Reason: 'Admin-only Telegram test mode. No production lead state was changed.',
    'Created At': now,
  })).catch((error) => {
    console.error('Telegram test audit log failed', error instanceof Error ? error.message : error)
  })
}

function isIndividualLead(fields: Fields) {
  const type = value(fields, 'Lead Type').toUpperCase().replace(/[^A-Z0-9]+/g, '_')
  const status = value(fields, 'Status').toLowerCase()
  const signal = `${value(fields, 'Business Name')} ${value(fields, 'Persona')} ${value(fields, 'Observable Signal')}`.toLowerCase()
  if (!individualTypes.has(type)) return false
  if (['invalid', 'opted out', 'closed lost'].includes(status)) return false
  if (['restaurant', 'business owner', 'corporate', 'sme'].some((term) => signal.includes(term))) return false
  return true
}

function lagosDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function recordDateKey(fields: Fields) {
  const raw = value(fields, 'Discovery Timestamp') || value(fields, 'Created At') || value(fields, 'Updated At')
  const date = raw ? new Date(raw) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return lagosDateKey(date)
}

export async function getAdminPreviewLeads(count: number) {
  const limit = Math.min(Math.max(count || adminTelegramTestConfig().defaultPreviewCount, 1), adminTelegramTestConfig().maxPreviewCount)
  const records = await listRecords<Fields>('Growth Leads', {
    formula: "OR({Status}='Qualified',{Status}='New',{Status}='Assigned')",
    maxRecords: 100,
    sortField: 'Created At',
    direction: 'desc',
  }).catch(async () => listRecords<Fields>('Growth Leads', { maxRecords: 100 }))

  const qualifying = records.filter((record) => isIndividualLead(record.fields))
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = lagosDateKey(yesterday)
  const yesterdayLeads = qualifying.filter((record) => recordDateKey(record.fields) === yesterdayKey)
  const selected = (yesterdayLeads.length ? yesterdayLeads : qualifying).slice(0, limit)

  return {
    sourcePeriod: yesterdayLeads.length ? 'Yesterday' : qualifying.length ? 'Most recent available' : 'Demo fallback',
    noYesterdayFound: !yesterdayLeads.length,
    leads: selected,
    requestedCount: limit,
  }
}

function leadReference(record: AirtableRecord<Fields>) {
  return value(record.fields, 'Growth Lead ID') || `NX-LD-${record.id.slice(-6).toUpperCase()}`
}

function priority(score: string) {
  const value = Number(score)
  if (!Number.isFinite(value)) return ''
  if (value >= 80) return 'High Priority'
  if (value >= 60) return 'Qualified'
  return 'Review'
}

export function formatAdminLeadPreviewCard(record: AirtableRecord<Fields>, index: number, total: number) {
  const fields = record.fields
  const score = value(fields, 'Score')
  const lines = [
    'CAREER ACCELERATOR LEAD',
    '',
    `Name: ${value(fields, 'Name') || 'Unnamed lead'}`,
    `Category: ${value(fields, 'Lead Type').replaceAll('_', ' ')}`,
    value(fields, 'School') ? `Institution: ${value(fields, 'School')}` : '',
    value(fields, 'Department') ? `Course: ${value(fields, 'Department')}` : '',
    value(fields, 'Academic Level') ? `Level: ${value(fields, 'Academic Level')}` : '',
    value(fields, 'NYSC Status') ? `NYSC Status: ${value(fields, 'NYSC Status')}` : '',
    value(fields, 'State') || value(fields, 'City') ? `Location: ${[value(fields, 'City'), value(fields, 'State')].filter(Boolean).join(', ')}` : '',
    value(fields, 'Career Interest') ? `Career Interest: ${value(fields, 'Career Interest')}` : '',
    '',
    value(fields, 'Programme Match') ? `Best Programme Match:\n${value(fields, 'Programme Match')}` : '',
    score ? `Qualification Score:\n${score}/100${priority(score) ? ` - ${priority(score)}` : ''}` : '',
    value(fields, 'Qualification Reason') ? `Why This Lead Was Selected:\n${value(fields, 'Qualification Reason')}` : '',
    value(fields, 'Observable Signal') ? `Public Signal:\n${value(fields, 'Observable Signal')}` : '',
    value(fields, 'Source Platform') ? `Source:\n${value(fields, 'Source Platform')}` : '',
    '',
    'Status:\nPreview Only - production lead record not modified.',
    `Lead Reference: ${leadReference(record)}`,
    `Lead ${index} of ${total}`,
  ]
  return lines.filter(Boolean).join('\n')
}

function validUrl(url: string) {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : ''
  } catch {
    return ''
  }
}

export function leadPreviewKeyboard(record: AirtableRecord<Fields>, index: number, total: number) {
  const source = validUrl(value(record.fields, 'Source URL') || value(record.fields, 'Public Profile URL'))
  const buttons: Array<Array<Record<string, string>>> = []
  if (source) buttons.push([{ text: 'View Source', url: source }])
  buttons.push([{ text: 'View Full Details', callback_data: `tgtest:details:${record.id}` }])
  buttons.push([
    { text: 'Test Contacted', callback_data: `tgtest:contacted:${record.id}` },
    { text: 'Test Interested', callback_data: `tgtest:interested:${record.id}` },
  ])
  buttons.push([
    { text: 'Test Follow-Up', callback_data: `tgtest:followup:${record.id}` },
    { text: 'Test AI Reply', callback_data: `tgtest:aireply:${record.id}` },
  ])
  if (total > 1) buttons.push([
    { text: index > 1 ? 'Previous' : 'Previous', callback_data: `tgtest:noop:${record.id}` },
    { text: index < total ? 'Next Lead' : 'Close Preview', callback_data: `tgtest:noop:${record.id}` },
  ])
  return { inline_keyboard: buttons }
}

export function adminTestHelp() {
  return [
    'NEXORA TELEGRAM TEST MODE',
    '',
    '/testleads',
    'Preview five existing individual leads.',
    '',
    '/testleads 10',
    'Preview ten existing individual leads.',
    '',
    '/runbusinessdiscovery',
    'Discover and preview five qualified business leads for admin testing only.',
    '',
    '/testbusinessleads 5',
    'Run a business-only lead test. Maximum ten leads.',
    '',
    '/respond',
    'Paste a prospect conversation and receive a recommended reply.',
    '',
    '/cancel',
    'Cancel the current test action.',
    '',
    '/teststatus',
    'View your Telegram connection and enabled test features.',
  ].join('\n')
}

export async function adminTestStatus(telegramUserId: string, telegramChatId: string) {
  const config = adminTelegramTestConfig()
  const identity = await resolveCurrentAdminTelegramIdentity({ telegramUserId, telegramChatId })
  return [
    'NEXORA ADMIN TEST STATUS',
    '',
    `Admin account: ${identity.verificationStatus === 'VERIFIED' ? 'Connected' : 'Not verified'}`,
    `Telegram User ID: ${identity.verificationStatus === 'VERIFIED' ? 'Verified' : 'Unverified'}`,
    `Telegram Chat ID: ${identity.telegramChatId ? 'Verified' : 'Unverified'}`,
    `Role: ${identity.verificationStatus === 'VERIFIED' ? 'Super Admin' : 'Unverified'}`,
    `Lead preview: ${config.leadPreviewEnabled ? 'Enabled' : 'Disabled'}`,
    `Business discovery: ${config.businessLeadDiscoveryEnabled ? 'Enabled' : 'Disabled'}`,
    `Individual discovery: ${config.individualLeadDiscoveryEnabled ? 'Enabled' : 'Disabled'}`,
    `AI response testing: ${config.aiResponseEnabled ? 'Enabled' : 'Disabled'}`,
    `Production associate delivery: ${config.associateDeliveryEnabled || config.associateLeadDeliveryEnabled ? 'Enabled' : 'Disabled'}`,
    `Admin lead test delivery: ${config.adminLeadTestDeliveryEnabled ? 'Enabled' : 'Disabled'}`,
    `Test mode: ${config.enabled ? 'Active' : 'Disabled'}`,
  ].join('\n')
}

export async function sendAdminBusinessLeadPreview(input: { chatId: string; telegramUserId: string; count?: number }) {
  const config = adminTelegramTestConfig()
  if (!config.businessLeadDiscoveryEnabled) {
    await sendTelegramMessage(input.chatId, 'Business lead discovery is currently disabled.')
    return { sent: 0 }
  }
  if (!config.adminLeadTestDeliveryEnabled) {
    await sendTelegramMessage(input.chatId, 'Admin business lead test delivery is currently disabled.')
    return { sent: 0 }
  }
  if (config.associateLeadDeliveryEnabled || config.associateDeliveryEnabled) {
    await sendTelegramMessage(input.chatId, 'Business lead test blocked because associate lead delivery is enabled. Disable associate delivery before testing.')
    return { sent: 0 }
  }
  await logTelegramTestEvent({
    telegramUserId: input.telegramUserId,
    eventType: 'BUSINESS_LEAD_TEST_REQUESTED',
    payload: { requestedCount: input.count || config.defaultPreviewCount },
  })
  try {
    const result = await sendAdminBusinessLeadTest(input)
    await logTelegramTestEvent({
      telegramUserId: input.telegramUserId,
      eventType: 'BUSINESS_LEAD_TEST_COMPLETED',
      payload: {
        sent: result.sent,
        rawBusinessesDiscovered: result.result.rawBusinessesDiscovered,
        qualifiedAboveThreshold: result.result.qualifiedAboveThreshold,
        mode: result.result.mode,
      },
    })
    return { sent: result.sent }
  } catch (error) {
    await logTelegramTestEvent({
      telegramUserId: input.telegramUserId,
      eventType: 'BUSINESS_LEAD_TEST_FAILED',
      payload: { error: error instanceof Error ? error.message : 'unknown' },
    })
    throw error
  }
}

export function beginRespondSession(telegramUserId: string) {
  sessions.set(telegramUserId, {
    state: 'AWAITING_SALES_CONVERSATION',
    expiresAt: Date.now() + adminTelegramTestConfig().sessionTtlMs,
  })
}

export function clearRespondSession(telegramUserId: string) {
  sessions.delete(telegramUserId)
}

export function hasActiveRespondSession(telegramUserId: string) {
  const session = sessions.get(telegramUserId)
  if (!session) return false
  if (session.expiresAt < Date.now()) {
    sessions.delete(telegramUserId)
    return false
  }
  return session.state === 'AWAITING_SALES_CONVERSATION'
}

export async function runAdminSalesAssistant(conversation: string) {
  const input = text(conversation, 7000)
  if (input.length < 25) throw new Error('Please paste enough of the conversation for the assistant to understand the prospect concern.')
  const result = runConversationCopilot({ mode: 'conversation', text: input })
  return formatConversationCopilotResult(result)
}

export async function handleAdminTestCallback(input: { action: string; leadId: string; telegramUserId: string; chatId: string }) {
  const lead = await findGrowthLead(input.leadId)
  const leadName = lead ? value(lead.fields, 'Name') || leadReference(lead) : input.leadId
  await logTelegramTestEvent({
    telegramUserId: input.telegramUserId,
    eventType: `BUTTON_${input.action.toUpperCase()}`,
    leadId: lead?.id || input.leadId,
    payload: { action: input.action, leadName },
  })

  if (input.action === 'details' && lead) {
    await sendTelegramMessage(input.chatId, formatAdminLeadPreviewCard(lead, 1, 1))
    return 'Full details opened.'
  }
  if (input.action === 'aireply' && lead) {
    const signal = value(lead.fields, 'Observable Signal') || value(lead.fields, 'Qualification Reason') || `Prospect: I am interested in ${value(lead.fields, 'Programme Match') || 'NEXORA'}.`
    const response = await runAdminSalesAssistant(signal)
    await sendTelegramMessage(input.chatId, response)
    return 'AI reply test generated.'
  }
  if (input.action === 'noop') return 'Preview navigation is sequential in this test.'

  const map: Record<string, string> = {
    contacted: 'QUALIFIED -> CONTACTED',
    interested: 'QUALIFIED -> INTERESTED',
    followup: 'QUALIFIED -> FOLLOW_UP',
  }
  await sendTelegramMessage(input.chatId, [
    'Test successful.',
    '',
    `Lead: ${leadName}`,
    `Simulated transition: ${map[input.action] || input.action}`,
    '',
    'In production, this action would update the lead stage. In test mode, no production lead record was changed.',
  ].join('\n'))
  return 'Test action recorded.'
}

export async function sendAdminLeadPreview(input: { chatId: string; telegramUserId: string; count: number }) {
  const config = adminTelegramTestConfig()
  if (!config.leadPreviewEnabled) {
    await sendTelegramMessage(input.chatId, 'Lead preview testing is currently disabled.')
    return { sent: 0 }
  }
  const result = await getAdminPreviewLeads(input.count)
  await logTelegramTestEvent({
    telegramUserId: input.telegramUserId,
    eventType: 'LEAD_PREVIEW_REQUESTED',
    payload: { requestedCount: result.requestedCount, sourcePeriod: result.sourcePeriod, leadCount: result.leads.length },
  })
  if (!result.leads.length) {
    await sendTelegramMessage(input.chatId, 'No qualified individual leads were found for the selected period.')
    return { sent: 0 }
  }

  await sendTelegramMessage(input.chatId, [
    'INDIVIDUAL LEAD PREVIEW',
    '',
    result.noYesterdayFound ? 'No qualified individual leads from yesterday were found. Showing the most recent available records instead.' : '',
    `Source period: ${result.sourcePeriod}`,
    'Lead type: Career Accelerator Individuals',
    `Number of leads: ${result.leads.length}`,
    'Mode: Preview Only',
    '',
    'These leads have not been assigned or modified.',
  ].filter(Boolean).join('\n'))

  for (let index = 0; index < result.leads.length; index += 1) {
    const lead = result.leads[index]
    await sendTelegramMessage(input.chatId, formatAdminLeadPreviewCard(lead, index + 1, result.leads.length), {
      reply_markup: leadPreviewKeyboard(lead, index + 1, result.leads.length),
    })
    await logTelegramTestEvent({
      telegramUserId: input.telegramUserId,
      eventType: 'LEAD_PREVIEW_SHOWN',
      leadId: lead.id,
      payload: { index: index + 1, reference: leadReference(lead) },
    })
  }
  return { sent: result.leads.length }
}

export function startMessageForUnverified(message: TelegramMessage, chatId: string) {
  const fromId = message.from?.id ? String(message.from.id) : ''
  return [
    'Your Telegram account is not yet linked to the Nexora admin account.',
    '',
    `Telegram User ID: ${fromId || 'Unknown'}`,
    `Telegram Chat ID: ${chatId || 'Unknown'}`,
    '',
    'Please complete the verification process from the Nexora admin dashboard.',
  ].join('\n')
}
