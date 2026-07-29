import { createRecord, escapeFormula, listRecords, type AirtableRecord } from './airtable'
import { compact } from './growth-associate'

type Fields = Record<string, any>

export type CopilotMode = 'conversation' | 'analyze' | 'outreach' | 'followup' | 'opportunity'
export type ProspectType = 'INDIVIDUAL' | 'BUSINESS'

export type GrowthCopilotInput = {
  mode: CopilotMode
  text: string
  prospectType?: ProspectType
  associateId?: string
  leadId?: string
  sourceUrl?: string
}

export type GrowthCopilotResult = {
  prospectType: ProspectType
  intent: string
  issueDetected: string
  conversationObjective: string
  replyToSend: string
  nextBestAction: string
  likelyResponses: Array<{ prospectResponse: string; recommendedReply: string }>
  followUpGuidance: string
  programmeMatch: string
  businessSolutionMatch: string
  escalationRequired: boolean
  confidence: number
}

const individualTerms = ['nysc', 'corper', 'corp member', 'student', 'final year', 'final-year', '500 level', 'graduate', 'internship', 'entry level', 'job', 'portfolio', 'career']
const businessTerms = ['instagram', 'facebook', 'vendor', 'whatsapp', 'business', 'store', 'brand', 'orders', 'customers', 'skincare', 'fashion', 'wig', 'beauty', 'cake', 'delivery']
const excludedBusinessTerms = ['university', 'government', 'hospital', 'major pharmacy', 'large corporation', 'manufacturing company', 'law firm', 'engineering firm']
const genericArticleTerms = ['blog', 'article', 'news', 'guide', 'portal', 'wikipedia', 'newspaper', 'how to', 'latest update']

function text(value: unknown, max = 8000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function lower(value: string) {
  return value.toLowerCase()
}

function includesAny(value: string, terms: string[]) {
  const raw = lower(value)
  return terms.some((term) => raw.includes(term))
}

function firstUrl(raw: string) {
  const match = raw.match(/https?:\/\/[^\s)]+/i)
  return match ? match[0].replace(/[.,;]+$/, '') : ''
}

function socialHandle(raw: string) {
  const match = raw.match(/(^|\s)@([a-zA-Z0-9_.]{3,40})/)
  return match ? `@${match[2]}` : ''
}

export function hasValidContactPath(input: string) {
  const raw = lower(input)
  return Boolean(firstUrl(input) || socialHandle(input) || raw.includes('facebook') || raw.includes('instagram') || raw.includes('linkedin') || raw.includes('whatsapp') || raw.includes('wa.me') || /[\w.+-]+@[\w.-]+\.\w+/.test(input) || /\+?\d[\d\s-]{8,}/.test(input))
}

export function isGenericArticleLead(input: string) {
  const raw = lower(input)
  return includesAny(raw, genericArticleTerms) && !includesAny(raw, ['facebook.com/', 'instagram.com/', 'linkedin.com/in', 'x.com/', 'twitter.com/', 'wa.me/', '@'])
}

function inferProspectType(input: string, explicit?: ProspectType): ProspectType {
  if (explicit) return explicit
  const raw = lower(input)
  const businessScore = businessTerms.filter((term) => raw.includes(term)).length
  const individualScore = individualTerms.filter((term) => raw.includes(term)).length
  return businessScore > individualScore ? 'BUSINESS' : 'INDIVIDUAL'
}

function inferProgramme(input: string) {
  const raw = lower(input)
  if (['ui', 'ux', 'design', 'figma', 'product design', 'graphics'].some((term) => raw.includes(term))) return 'Certified UI/UX Designer'
  if (['finance', 'financial', 'accounting', 'banking', 'economics', 'data', 'analysis'].some((term) => raw.includes(term))) return 'AI Financial Analyst'
  if (['content', 'creator', 'video', 'social media', 'marketing', 'personal brand'].some((term) => raw.includes(term))) return 'AI Content Creation'
  return 'Career Accelerator'
}

function inferBusinessSolution(input: string) {
  const raw = lower(input)
  if (['whatsapp', 'orders', 'manual order', 'dm to order'].some((term) => raw.includes(term))) return 'WhatsApp Order and Customer Follow-Up System'
  if (['no website', 'website not found', 'online storefront', 'catalogue'].some((term) => raw.includes(term))) return 'Website or Online Storefront'
  if (['booking', 'appointments', 'schedule'].some((term) => raw.includes(term))) return 'Booking System'
  if (['customer database', 'crm', 'follow up', 'repeat customer'].some((term) => raw.includes(term))) return 'Simple CRM and Customer Follow-Up System'
  if (['payment', 'paystack', 'transfer'].some((term) => raw.includes(term))) return 'Payment Workflow'
  return 'WhatsApp Order and Customer Follow-Up System'
}

function detectIntent(input: string) {
  const raw = lower(input)
  if (raw.includes('not interested') || raw.includes('stop messaging') || raw.includes('do not contact')) return 'Opt-out'
  if (['price', 'cost', 'fee', 'expensive', 'money'].some((term) => raw.includes(term))) return 'Price question'
  if (['scam', 'legit', 'trust', 'proof'].some((term) => raw.includes(term))) return 'Trust concern'
  if (['busy', 'time', 'schedule', 'next month', 'later'].some((term) => raw.includes(term))) return 'Timing concern'
  if (['job', 'income', 'employment'].some((term) => raw.includes(term))) return 'Job concern'
  if (['paid', 'paystack', 'payment'].some((term) => raw.includes(term))) return 'Payment intent'
  if (['interested', 'details', 'how'].some((term) => raw.includes(term))) return 'General enquiry'
  return 'Needs clarification'
}

function objectiveFor(mode: CopilotMode, intent: string) {
  if (intent === 'Opt-out') return 'CLOSE_LOST'
  if (mode === 'outreach') return 'START_CONVERSATION'
  if (mode === 'followup') return 'REOPEN_CONVERSATION'
  if (intent === 'Payment intent') return 'MOVE_TO_PAYMENT'
  if (intent.includes('concern') || intent.includes('question')) return 'HANDLE_OBJECTION'
  return 'QUALIFY_NEED'
}

function openingFor(input: string, type: ProspectType, programme: string, solution: string) {
  if (type === 'BUSINESS') {
    return `Hi, I came across your page and noticed how actively you promote your products. One practical thing Nexora can help with is a ${solution.toLowerCase()}, so customer enquiries and follow-ups are easier to manage. Would it be okay if I share a simple idea based on what I noticed?`
  }
  return `Hi, I came across your profile and noticed your interest around career growth and practical digital skills. Nexora has a ${programme} pathway that may fit what you are working toward. Would you like me to send a short breakdown so you can see if it matches your goal?`
}

function responseFor(input: string, type: ProspectType, intent: string, programme: string, solution: string) {
  if (intent === 'Opt-out') return 'Thank you for letting me know. I will not continue the conversation.'
  if (intent === 'Price question') return type === 'BUSINESS'
    ? `I understand. Before discussing cost, it may help to first identify the one operational issue costing you the most time right now. Is it orders, follow-up, payment confirmation, or customer records?`
    : `I understand. Before you decide, let us connect the fee to the outcome you want. Which result matters most to you right now: getting a practical skill, building a portfolio, or preparing for better opportunities?`
  if (intent === 'Trust concern') return 'That is fair. Please verify through Nexora official channels before making any decision. I can send the official website and programme page so you can confirm the details yourself.'
  if (intent === 'Timing concern') return 'No problem. Let us keep it simple: I can send the details now, then we agree on a realistic follow-up time that works for you.'
  if (intent === 'Job concern') return 'The programme does not guarantee a job, but it is designed to help you build practical work you can show. What kind of role or skill path are you targeting?'
  if (type === 'BUSINESS') return `Based on what you shared, I would start with ${solution}. The first step is to understand how customers currently place orders and how follow-up is handled.`
  return `Based on what you shared, ${programme} looks like the best starting point. The next step is to confirm your current goal so I do not recommend the wrong path.`
}

function followUpFor(input: string, type: ProspectType) {
  const raw = lower(input)
  if (raw.includes('seen') || raw.includes('no reply') || raw.includes('stopped replying')) {
    return type === 'BUSINESS'
      ? 'Follow up after 24-48 hours with one helpful observation, not another pitch.'
      : 'Follow up after 24 hours with one clear question about their current goal.'
  }
  return 'Follow up within 24 hours unless the prospect requested a different time.'
}

function likelyBranches(type: ProspectType, programme: string, solution: string) {
  if (type === 'BUSINESS') {
    return [
      { prospectResponse: 'How much will it cost?', recommendedReply: 'First, let us confirm the exact workflow you need. That way Nexora recommends only the smallest useful solution, not everything at once.' },
      { prospectResponse: 'We already use WhatsApp.', recommendedReply: 'That is good. The opportunity is not to replace WhatsApp, but to make orders, reminders and follow-up easier to manage.' },
    ]
  }
  return [
    { prospectResponse: 'How much is it?', recommendedReply: 'The current programme fee should be confirmed from the official Nexora page before you promise it. I can send the programme link and help you compare it with your goal.' },
    { prospectResponse: 'Will it help me get a job?', recommendedReply: `${programme} can help you build practical work, but Nexora should not promise a job. The strongest next step is to build a portfolio/capstone you can show.` },
  ]
}

export function runGrowthCopilot(input: GrowthCopilotInput): GrowthCopilotResult {
  const body = text(input.text)
  if (!body || body.length < 8) throw new Error('Please provide enough prospect context for the Growth Copilot.')
  const prospectType = inferProspectType(body, input.prospectType)
  const intent = detectIntent(body)
  const programmeMatch = prospectType === 'INDIVIDUAL' ? inferProgramme(body) : ''
  const businessSolutionMatch = prospectType === 'BUSINESS' ? inferBusinessSolution(body) : ''
  const contactable = hasValidContactPath(body)
  const generic = isGenericArticleLead(body)
  const excluded = prospectType === 'BUSINESS' && includesAny(body, excludedBusinessTerms)
  const issueDetected = generic
    ? 'Generic article or non-actionable source'
    : !contactable
      ? 'Missing valid contact path'
      : excluded
        ? 'Large or bureaucratic organisation is low priority'
        : intent
  const confidence = Math.max(0.35, Math.min(0.92,
    (contactable ? 0.25 : 0) +
    (generic ? -0.2 : 0) +
    (prospectType === 'BUSINESS' && !excluded ? 0.2 : 0.15) +
    (intent !== 'Needs clarification' ? 0.2 : 0.1) +
    (programmeMatch || businessSolutionMatch ? 0.2 : 0.1),
  ))
  const replyToSend = input.mode === 'outreach'
    ? openingFor(body, prospectType, programmeMatch, businessSolutionMatch)
    : responseFor(body, prospectType, intent, programmeMatch, businessSolutionMatch)

  return {
    prospectType,
    intent,
    issueDetected,
    conversationObjective: objectiveFor(input.mode, intent),
    replyToSend,
    nextBestAction: generic
      ? 'Do not assign this as a lead. Find the actual person or business profile first.'
      : !contactable
        ? 'Ask for or locate a valid public contact route before outreach.'
        : input.mode === 'opportunity'
          ? 'Introduce only the recommended first solution, then ask one diagnostic question.'
          : 'Send one concise message and wait for the prospect response.',
    likelyResponses: likelyBranches(prospectType, programmeMatch, businessSolutionMatch),
    followUpGuidance: followUpFor(body, prospectType),
    programmeMatch,
    businessSolutionMatch,
    escalationRequired: generic || !contactable || intent === 'Opt-out',
    confidence,
  }
}

export function formatGrowthCopilotResult(result: GrowthCopilotResult) {
  return [
    'NEXORA AI GROWTH COPILOT',
    '',
    `Prospect Type: ${result.prospectType}`,
    `Intent: ${result.intent}`,
    `Issue Detected: ${result.issueDetected}`,
    `Objective: ${result.conversationObjective}`,
    result.programmeMatch ? `Programme Match: ${result.programmeMatch}` : '',
    result.businessSolutionMatch ? `Business Entry Solution: ${result.businessSolutionMatch}` : '',
    '',
    `Reply to Send:\n${result.replyToSend}`,
    '',
    `Next Best Action:\n${result.nextBestAction}`,
    '',
    `Follow-Up Guidance:\n${result.followUpGuidance}`,
    '',
    result.likelyResponses.length ? `Likely Response Branch:\nIf they say "${result.likelyResponses[0].prospectResponse}", reply: ${result.likelyResponses[0].recommendedReply}` : '',
    result.escalationRequired ? '\nEscalation: Confirm with admin before taking production action.' : '',
  ].filter(Boolean).join('\n')
}

function fieldFromLine(input: string, names: string[]) {
  const lines = input.split(/\r?\n/)
  for (const line of lines) {
    const index = line.indexOf(':')
    if (index === -1) continue
    const key = lower(line.slice(0, index)).replace(/[^a-z0-9]+/g, ' ').trim()
    if (names.some((name) => key.includes(name))) return text(line.slice(index + 1), 500)
  }
  return ''
}

async function findDuplicateBySource(sourceUrl: string, email: string, phone: string) {
  const checks = [
    sourceUrl ? `{Source URL}='${escapeFormula(sourceUrl)}'` : '',
    sourceUrl ? `{Public Profile URL}='${escapeFormula(sourceUrl)}'` : '',
    email ? `LOWER({Email})='${escapeFormula(email.toLowerCase())}'` : '',
    phone ? `{Phone}='${escapeFormula(phone)}'` : '',
  ].filter(Boolean)
  for (const formula of checks) {
    const records = await listRecords<Fields>('Growth Leads', { formula, maxRecords: 1 }).catch(() => [])
    if (records[0]) return records[0]
  }
  return null
}

export async function createAssociateSubmittedLead(input: {
  prospectType: ProspectType
  description: string
  associateId?: string
  submittedBy?: string
}) {
  const description = text(input.description, 5000)
  if (!description) throw new Error('Lead description is required.')
  const analysis = runGrowthCopilot({ mode: 'analyze', text: description, prospectType: input.prospectType })
  const sourceUrl = firstUrl(description)
  const email = (description.match(/[\w.+-]+@[\w.-]+\.\w+/) || [''])[0].toLowerCase()
  const phone = (description.match(/\+?\d[\d\s-]{8,}/) || [''])[0]
  const name = fieldFromLine(description, ['name', 'business name']) || (input.prospectType === 'BUSINESS' ? 'Associate Submitted Business' : 'Associate Submitted Individual')
  const duplicate = await findDuplicateBySource(sourceUrl, email, phone)
  if (duplicate) return { skipped: true, reason: 'duplicate', id: duplicate.id, analysis }
  const assignable = hasValidContactPath(description) && !isGenericArticleLead(description) && !analysis.escalationRequired
  const now = new Date().toISOString()
  const created = await createRecord<{ id: string; fields: Fields }>('Growth Leads', compact({
    'Growth Lead ID': `${input.prospectType === 'BUSINESS' ? 'BL' : 'IL'}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    'Lead Type': input.prospectType === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL',
    Name: input.prospectType === 'INDIVIDUAL' ? name : '',
    'Business Name': input.prospectType === 'BUSINESS' ? name : '',
    'Public Profile URL': sourceUrl,
    'Source URL': sourceUrl,
    'Discovery Source': 'Associate Submitted',
    'Final Contact Source': sourceUrl || socialHandle(description) || email || phone,
    'Contactability Status': hasValidContactPath(description) ? 'CONTACTABLE' : 'NEEDS_CONTACT_PATH',
    'Prospect Category': input.prospectType,
    'Submitted By Associate': input.associateId ? [input.associateId] : undefined,
    'Source Platform': includesAny(description, ['instagram']) ? 'Instagram' : includesAny(description, ['facebook']) ? 'Facebook' : includesAny(description, ['whatsapp']) ? 'WhatsApp' : 'Associate Submitted',
    'Source Group': 'Associate Submitted',
    Email: email,
    Phone: phone,
    'Observable Signal': description,
    'Qualification Reason': analysis.issueDetected,
    'Score Components JSON': JSON.stringify({ contactable: hasValidContactPath(description), genericArticle: isGenericArticleLead(description), confidence: analysis.confidence }),
    'Copilot Analysis JSON': JSON.stringify(analysis),
    'Recommended Opening Message': analysis.replyToSend,
    'Recommended Follow Up': analysis.followUpGuidance,
    'Recommended Entry Solution': analysis.businessSolutionMatch,
    'Source Quality Status': isGenericArticleLead(description) ? 'GENERIC_ARTICLE' : hasValidContactPath(description) ? 'PUBLIC_PROFILE' : 'MISSING_CONTACT_PATH',
    'Career Interest': input.prospectType === 'INDIVIDUAL' ? analysis.programmeMatch : '',
    Persona: input.prospectType,
    'Programme Match': analysis.programmeMatch || analysis.businessSolutionMatch,
    Score: Math.round(analysis.confidence * 100),
    Confidence: analysis.confidence,
    Status: assignable ? 'Qualified' : hasValidContactPath(description) ? 'Unverified' : 'Needs Contact Path',
    'Assigned Associate': input.associateId ? [input.associateId] : undefined,
    'Assigned At': input.associateId ? now : '',
    'Discovery Timestamp': now,
    'Created At': now,
    'Updated At': now,
  }))
  return { imported: true, id: created.id, analysis }
}
