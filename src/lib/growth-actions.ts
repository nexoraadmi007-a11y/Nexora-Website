import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from './airtable'
import { sendTelegramMessage } from './telegram'

type Fields = Record<string, any>

export type GrowthRole = 'ADMIN' | 'ASSOCIATE' | 'UNKNOWN'

const activityStageMap: Record<string, { type: string; stage: string; status?: string }> = {
  assign: { type: 'ASSIGNED', stage: 'ASSIGNED', status: 'Assigned' },
  view: { type: 'VIEWED', stage: 'ASSIGNED' },
  contacted: { type: 'CONTACTED', stage: 'CONTACTED', status: 'Contacted' },
  replied: { type: 'REPLIED', stage: 'REPLIED', status: 'Replied' },
  interested: { type: 'INTERESTED', stage: 'INTERESTED', status: 'Interested' },
  application_started: { type: 'APPLICATION_STARTED', stage: 'APPLICATION_STARTED', status: 'Application Started' },
  payment_pending: { type: 'PAYMENT_PENDING', stage: 'PAYMENT_PENDING', status: 'Payment Pending' },
  converted: { type: 'CONVERTED', stage: 'PAID', status: 'Converted' },
  not_interested: { type: 'NOT_INTERESTED', stage: 'CLOSED_LOST', status: 'Closed Lost' },
  invalid: { type: 'INVALID', stage: 'INVALID', status: 'Invalid' },
  skipped: { type: 'SKIPPED', stage: 'ASSIGNED' },
  call_answered: { type: 'CALL_REPORTED', stage: 'CONTACTED', status: 'Contacted' },
  follow_up_scheduled: { type: 'FOLLOW_UP_SCHEDULED', stage: 'FOLLOW_UP', status: 'Interested' },
  follow_up_completed: { type: 'FOLLOW_UP_COMPLETED', stage: 'FOLLOW_UP', status: 'Contacted' },
  sales_assistant_used: { type: 'REPLIED', stage: 'FOLLOW_UP' },
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

function value(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  return typeof raw === 'string' ? raw.trim() : ''
}

function linkedId(fields: Fields, name: string) {
  const raw = fields[name]
  return Array.isArray(raw) ? text(raw[0], 120) : ''
}

export async function findAssociateByTelegramUserId(telegramUserId: string) {
  if (!telegramUserId) return null
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `{Telegram User ID}='${escapeFormula(telegramUserId)}'`,
    maxRecords: 1,
  }).catch(() => [])
  if (records[0]) return records[0]

  const testId = process.env.GROWTH_TEST_ASSOCIATE_TELEGRAM_ID
  if (testId && testId === telegramUserId) {
    const active = await listRecords<Fields>('Ambassadors', {
      formula: "OR({Ambassador Status}='Active',{Active}=TRUE())",
      maxRecords: 1,
    }).catch(() => [])
    return active[0] || null
  }

  return null
}

export async function resolveGrowthTelegramRole(telegramUserId: string): Promise<{ role: GrowthRole; associate?: AirtableRecord<Fields> | null }> {
  if (telegramUserId && telegramUserId === process.env.TELEGRAM_ADMIN_CHAT_ID) return { role: 'ADMIN', associate: null }
  const associate = await findAssociateByTelegramUserId(telegramUserId)
  if (associate) return { role: 'ASSOCIATE', associate }
  return { role: 'UNKNOWN', associate: null }
}

export function formatLeadCard(record: AirtableRecord<Fields>, index = 1) {
  const fields = record.fields
  const title = value(fields, 'Business Name') || value(fields, 'Organization Name') || value(fields, 'Name') || 'Unnamed lead'
  const leadType = value(fields, 'Lead Type') || value(fields, 'Pipeline') || 'Growth Lead'
  const location = value(fields, 'City') || value(fields, 'State') || value(fields, 'Location') || 'Location unknown'
  const programme = value(fields, 'Programme Match') || value(fields, 'Pipeline') || 'Programme match not set'
  const signal = value(fields, 'Observable Signal') || value(fields, 'Next Action') || 'Review and qualify before outreach.'
  const phone = value(fields, 'Phone')
  const email = value(fields, 'Email')
  const score = value(fields, 'Score') || value(fields, 'Strategic Score')

  return [
    `${index}. ${title}`,
    `Lead ID: ${record.id}`,
    `Type: ${leadType}${score ? ` | Score: ${score}` : ''}`,
    `Location: ${location}`,
    `Programme: ${programme}`,
    phone || email ? `Contact: ${[phone, email].filter(Boolean).join(' | ')}` : '',
    `Signal: ${signal}`,
  ].filter(Boolean).join('\n')
}

export async function getAssociateLeads(associateId: string, maxRecords = 10) {
  return listRecords<Fields>('Growth Leads', {
    formula: `FIND('${escapeFormula(associateId)}',ARRAYJOIN({Assigned Associate}))`,
    maxRecords,
    sortField: 'Assigned At',
    direction: 'asc',
  }).catch(() => [])
}

export async function getAvailableGrowthLeads(maxRecords = 100) {
  const candidates = await listRecords<Fields>('Growth Leads', {
    formula: "OR({Status}='New',{Status}='Researching',{Status}='Active',{Status}='Qualified')",
    maxRecords,
    sortField: 'Score',
    direction: 'desc',
  }).catch(async () => listRecords<Fields>('Growth Leads', { maxRecords }))

  return candidates.filter((lead) => !linkedId(lead.fields, 'Assigned Associate'))
}

function sector(fields: Fields) {
  return value(fields, 'Industry') || value(fields, 'Lead Type') || value(fields, 'Pipeline') || 'Other'
}

function pickLeadBatch(records: Array<AirtableRecord<Fields>>, count: number) {
  const selected: Array<AirtableRecord<Fields>> = []
  const usedSectors = new Set<string>()

  for (const record of records) {
    const key = sector(record.fields)
    if (usedSectors.has(key)) continue
    selected.push(record)
    usedSectors.add(key)
    if (selected.length >= count) return selected
  }

  for (const record of records) {
    if (selected.some((item) => item.id === record.id)) continue
    selected.push(record)
    if (selected.length >= count) return selected
  }

  return selected
}

async function assignSpecificLeads(input: { associateId: string; leads: Array<AirtableRecord<Fields>>; adminUserId?: string }) {
  const assigned = []
  for (const lead of input.leads) {
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
      note: `Assigned by ${input.adminUserId || 'admin'}.`,
    })
    assigned.push(lead)
  }
  return assigned
}

export async function assignLeadsToAssociate(input: { associateId: string; count?: number; adminUserId?: string }) {
  const count = Math.min(Math.max(input.count || 5, 1), 25)
  const leads = pickLeadBatch(await getAvailableGrowthLeads(100), count)
  return assignSpecificLeads({ associateId: input.associateId, leads, adminUserId: input.adminUserId })
}

export async function getActiveAssociates(maxRecords = 100) {
  return listRecords<Fields>('Ambassadors', {
    formula: "OR({Ambassador Status}='Active',{Active}=TRUE())",
    maxRecords,
  }).catch(async () => listRecords<Fields>('Ambassadors', { maxRecords }))
}

export async function assignDailyLeadBatch(input: { countPerAssociate?: number; adminUserId?: string }) {
  const countPerAssociate = Math.min(Math.max(input.countPerAssociate || 5, 1), 25)
  const associates = await getActiveAssociates(100)
  let available = await getAvailableGrowthLeads(500)
  const availableBeforeAssignment = available.length
  const assignments: Array<{ associateId: string; associateName: string; assignedCount: number }> = []

  for (const associate of associates) {
    const batch = pickLeadBatch(available, countPerAssociate)
    const assignedIds = new Set(batch.map((lead) => lead.id))
    available = available.filter((lead) => !assignedIds.has(lead.id))
    if (!batch.length) {
      assignments.push({
        associateId: associate.id,
        associateName: value(associate.fields, 'Ambassador Name') || value(associate.fields, 'Full Name') || 'Unnamed associate',
        assignedCount: 0,
      })
      continue
    }
    const assigned = await assignSpecificLeads({ associateId: associate.id, leads: batch, adminUserId: input.adminUserId || 'daily-queue' })
    assignments.push({
      associateId: associate.id,
      associateName: value(associate.fields, 'Ambassador Name') || value(associate.fields, 'Full Name') || 'Unnamed associate',
      assignedCount: assigned.length,
    })
  }

  return {
    associateCount: associates.length,
    availableBeforeAssignment,
    totalAssigned: assignments.reduce((sum, item) => sum + item.assignedCount, 0),
    assignments,
  }
}

export async function findGrowthLead(idOrLeadId: string) {
  const id = text(idOrLeadId, 120)
  if (!id) return null
  const byRecord = await listRecords<Fields>('Growth Leads', {
    formula: `RECORD_ID()='${escapeFormula(id)}'`,
    maxRecords: 1,
  }).catch(() => [])
  if (byRecord[0]) return byRecord[0]

  const byLeadId = await listRecords<Fields>('Growth Leads', {
    formula: `{Growth Lead ID}='${escapeFormula(id)}'`,
    maxRecords: 1,
  }).catch(() => [])
  return byLeadId[0] || null
}

export async function recordLeadActivity(input: {
  leadId: string
  associateId: string
  action: string
  channel?: string
  verificationType?: 'SYSTEM_VERIFIED' | 'ASSOCIATE_REPORTED' | 'ADMIN_CONFIRMED'
  note?: string
  nextFollowUpAt?: string
}) {
  const lead = await findGrowthLead(input.leadId)
  if (!lead) throw new Error('Growth lead was not found.')
  const mapping = activityStageMap[input.action] || { type: input.action.toUpperCase(), stage: value(lead.fields, 'Status') || 'ASSIGNED' }
  const before = value(lead.fields, 'Status') || 'New'
  const now = new Date().toISOString()

  await createRecord('Lead Activities', compact({
    'Activity ID': `ACT-${Date.now()}`,
    Lead: [lead.id],
    Associate: [input.associateId],
    'Activity Type': mapping.type,
    'Funnel Stage Before': before.toUpperCase().replaceAll(' ', '_'),
    'Funnel Stage After': mapping.stage,
    Channel: input.channel || 'Telegram',
    'Verification Type': input.verificationType || 'ASSOCIATE_REPORTED',
    Note: text(input.note),
    'Occurred At': now,
    'Created At': now,
    'Updated At': now,
  }))

  await updateRecord('Growth Leads', lead.id, compact({
    ...(mapping.status ? { Status: mapping.status } : {}),
    ...(input.action === 'contacted' || input.action === 'call_answered' ? { 'Last Contacted At': now } : {}),
    ...(input.nextFollowUpAt ? { 'Next Follow Up At': input.nextFollowUpAt } : {}),
    'Updated At': now,
  }))

  return { ok: true, leadId: lead.id, stage: mapping.stage, status: mapping.status || before }
}

const objectionRules: Array<[string, string[]]> = [
  ['PRICE', ['price', 'cost', 'expensive', 'money', 'pay', 'fee', 'amount']],
  ['TIME', ['time', 'busy', 'schedule', 'work', 'available']],
  ['TRUST', ['real', 'legit', 'trust', 'scam', 'proof']],
  ['NEED_TO_THINK', ['think', 'later', 'consider']],
  ['NEED_TO_ASK_SOMEONE', ['ask', 'parent', 'boss', 'friend', 'husband', 'wife']],
  ['COURSE_RELEVANCE', ['relevant', 'need it', 'useful', 'benefit']],
  ['CERTIFICATE', ['certificate', 'certification']],
  ['PAYMENT_METHOD', ['transfer', 'installment', 'payment link', 'paystack']],
  ['NO_RESPONSE', ['no reply', 'seen', 'ignored']],
  ['NOT_READY', ['not ready', 'next month', 'maybe later']],
]

function detectObjection(conversation: string) {
  const lower = conversation.toLowerCase()
  for (const [category, terms] of objectionRules) {
    if (terms.some((term) => lower.includes(term))) return category
  }
  return 'OTHER'
}

function detectStage(conversation: string, objection: string) {
  const lower = conversation.toLowerCase()
  if (lower.includes('paid') || lower.includes('payment successful')) return 'CLOSED_WON'
  if (lower.includes('payment') || lower.includes('paystack')) return 'PAYMENT_PENDING'
  if (lower.includes('apply') || lower.includes('register')) return 'APPLICATION_STARTED'
  if (objection !== 'OTHER') return 'OBJECTION_HANDLING'
  if (lower.includes('interested') || lower.includes('send details')) return 'PROGRAMME_MATCH'
  if (lower.includes('what is') || lower.includes('how does')) return 'DISCOVERY'
  return 'RAPPORT'
}

function replyFor(objection: string, programme: string) {
  const offer = programme || 'the NEXORA programme'
  const replies: Record<string, string> = {
    PRICE: `I understand. The goal is not just to attend a class, but to leave with practical work you can show. ${offer} is structured to help you build a real portfolio/capstone, so the fee is tied to an outcome, not just lessons. If you want, I can send the breakdown so you see exactly what you will build.`,
    TIME: `I understand your schedule may be tight. The programme is designed to be practical and focused, so you can follow the structure without wasting time. What I suggest is that you choose the path that matches your current goal, then we help you stay consistent through the sessions and assignments.`,
    TRUST: `That is fair. NEXORA is building a structured AI training ecosystem, and the process is transparent: programme page, payment confirmation, learning structure, assignments, and certification after capstone review. I can send the official website link so you verify before making any decision.`,
    NEED_TO_THINK: `No problem. As you think about it, focus on this question: which skill would create the most immediate advantage for you right now? I can send the programme options and help you choose the best fit.`,
    NEED_TO_ASK_SOMEONE: `That is completely fine. You can share the official programme link with them. The key points are the skill path, the practical assignments, the capstone, and the certificate after completion.`,
    COURSE_RELEVANCE: `The best way to decide is to connect it to your goal. If your goal is content, choose AI Content Creation. If design, choose Certified UI/UX Designer. If finance and analysis, choose AI Financial Analyst. Tell me your current goal and I will recommend the best fit.`,
    CERTIFICATE: `Yes, certification is included after you complete the required assignments and capstone review. The certificate matters more when it is backed by real work you can show.`,
    PAYMENT_METHOD: `Payment is handled through the official checkout link for proper confirmation and enrollment tracking. Once payment is confirmed, your enrollment record is updated automatically.`,
    NO_RESPONSE: `Hello, just checking in. I wanted to know if you still want the NEXORA programme details. If yes, I can help you pick the option that best fits your career or business goal.`,
    NOT_READY: `That is okay. You do not have to rush. I can send the details now so you understand the options, then you can decide when you are ready.`,
    OTHER: `Thanks for explaining. Based on what you said, the next best step is to clarify your goal and match you with the right NEXORA programme. What skill or outcome matters most to you right now?`,
  }
  return replies[objection] || replies.OTHER
}

export async function generateSalesAssistant(input: {
  conversation: string
  associateId?: string
  leadId?: string
  programme?: string
}) {
  const conversation = text(input.conversation, 6000)
  if (!conversation) throw new Error('Conversation text is required.')
  const objection = detectObjection(conversation)
  const salesStage = detectStage(conversation, objection)
  const recommendedReply = replyFor(objection, text(input.programme, 120))
  const nextAction = salesStage === 'PAYMENT_PENDING'
    ? 'Send official checkout link and ask them to confirm after payment.'
    : objection === 'PRICE'
      ? 'Send programme breakdown and ask which outcome matters most.'
      : salesStage === 'APPLICATION_STARTED'
        ? 'Guide them to complete the application and payment.'
        : 'Ask one clear qualifying question and keep the conversation moving.'
  const followUpHours = ['PAYMENT_PENDING', 'APPLICATION_STARTED'].includes(salesStage) ? 6 : 24
  const suggestedFollowUpAt = new Date(Date.now() + followUpHours * 60 * 60 * 1000).toISOString()
  const reasoning = `Detected stage ${salesStage} and objection ${objection}. The reply keeps control with the associate, answers the concern, and moves to one next action.`

  if (input.associateId && input.leadId) {
    await recordLeadActivity({
      leadId: input.leadId,
      associateId: input.associateId,
      action: 'sales_assistant_used',
      channel: 'Telegram',
      verificationType: 'SYSTEM_VERIFIED',
      note: `Sales assistant used.\nStage: ${salesStage}\nObjection: ${objection}\nSuggested reply: ${recommendedReply}`,
      nextFollowUpAt: suggestedFollowUpAt,
    }).catch(() => undefined)
  }

  return {
    salesStage,
    objection,
    recommendedReply,
    reasoning,
    nextAction,
    suggestedFollowUpAt,
  }
}

export async function sendAssociateLeadDigest(associate: AirtableRecord<Fields>) {
  const chatId = value(associate.fields, 'Telegram User ID')
  if (!chatId) throw new Error('Associate Telegram User ID is not configured.')
  const leads = await getAssociateLeads(associate.id, 10)
  const body = leads.length
    ? leads.map((lead, index) => formatLeadCard(lead, index + 1)).join('\n\n')
    : 'No assigned leads yet.'
  await sendTelegramMessage(chatId, `NEXORA assigned leads\n\n${body}\n\nQuick actions: reply with /contacted LEAD_ID, /interested LEAD_ID, /pending LEAD_ID, /converted LEAD_ID, /invalid LEAD_ID, or /reply LEAD_ID then paste the conversation.`)
  return leads
}

export function actionFromTelegramCommand(command: string) {
  const normalized = command.replace(/^\//, '').toLowerCase()
  const map: Record<string, string> = {
    contacted: 'contacted',
    replied: 'replied',
    interested: 'interested',
    apply: 'application_started',
    pending: 'payment_pending',
    converted: 'converted',
    lost: 'not_interested',
    invalid: 'invalid',
    skip: 'skipped',
    call: 'call_answered',
  }
  return map[normalized] || ''
}

export function parseLeadCommand(message: string) {
  const [command = '', leadId = '', ...rest] = text(message, 6000).split(/\s+/)
  return {
    command: command.toLowerCase(),
    leadId,
    note: rest.join(' '),
  }
}
