import { createRecord, listRecords, updateRecord, type AirtableRecord } from '@/lib/airtable'
import { captureLead, phone, text } from '@/lib/lead-capture'

type ConversationInput = Record<string, unknown>
type Fields = Record<string, any>

const requiredFields = [
  { label: 'Full Name', key: 'fullName', prompt: 'Please share your full name so we can create your NEXORA profile.' },
  { label: 'WhatsApp Number', key: 'whatsAppNumber', prompt: 'What WhatsApp number should NEXORA use to reach you?' },
  { label: 'Current Status', key: 'currentStatus', prompt: 'Which best describes you: NYSC currently serving, NYSC completed, young professional, working professional, student, or business owner?' },
  { label: 'Location', key: 'location', prompt: 'What city or state are you currently based in?' },
  { label: 'Interest Areas', key: 'interestAreas', prompt: 'What are you interested in: community, webinars, career accelerator, three-month professional programme, corporate training, or ambassador programme?' },
  { label: 'Primary Goal', key: 'primaryGoal', prompt: 'What is the main career or business goal you want NEXORA to help you achieve?' },
  { label: 'Biggest Challenge', key: 'biggestChallenge', prompt: 'What is the biggest challenge stopping you from reaching that goal right now?' },
]

const businessFields = [
  { label: 'Business Name', key: 'businessName', prompt: 'What is the name of your business or organization?' },
  { label: 'Business Challenges', key: 'businessChallenges', prompt: 'What business challenge do you most want AI to help you solve?' },
  { label: 'Learning Goals', key: 'learningGoals', prompt: 'What do you want to be able to do with AI after BATP?' },
  { label: 'Current AI Usage', key: 'currentAIUsage', prompt: 'How are you currently using AI: none, basic, intermediate, advanced, or team adoption?' },
]

function arrayValues(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => text(item, 80)).filter(Boolean)
  const raw = text(value)
  if (!raw) return []
  return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

function hasValue(input: ConversationInput, key: string) {
  if (key === 'whatsAppNumber') return Boolean(phone(input.whatsAppNumber || input.phone))
  if (key === 'interestAreas') return arrayValues(input.interestAreas || input.interests).length > 0
  return Boolean(text(input[key]))
}

function knownFields(input: ConversationInput) {
  return activeFields(input).filter((field) => hasValue(input, field.key)).map((field) => field.label)
}

function missingFields(input: ConversationInput) {
  return activeFields(input).filter((field) => !hasValue(input, field.key)).map((field) => field.label)
}

function nextField(input: ConversationInput) {
  return activeFields(input).find((field) => !hasValue(input, field.key))
}

function isBusinessIntent(input: ConversationInput) {
  const raw = [
    text(input.programCode),
    text(input.program),
    text(input.message),
    text(input.currentStatus || input.customerCategory),
    text(input.businessName),
    text(input.businessChallenges),
    arrayValues(input.interestAreas || input.interests).join(' '),
  ].join(' ').toLowerCase()
  return raw.includes('batp') || raw.includes('business') || raw.includes('sme') || raw.includes('startup') || raw.includes('entrepreneur') || raw.includes('corporate')
}

function activeFields(input: ConversationInput) {
  return isBusinessIntent(input) ? [...requiredFields, ...businessFields] : requiredFields
}

function currentStepFor(label?: string) {
  const map: Record<string, string> = {
    'Full Name': 'Ask Name',
    'WhatsApp Number': 'Ask Contact',
    'Current Status': 'Ask Status',
    Location: 'Ask Location',
    'Interest Areas': 'Ask Interest',
    'Primary Goal': 'Ask Goal',
    'Biggest Challenge': 'Ask Challenge',
    'Business Name': 'Ask Goal',
    'Business Challenges': 'Ask Challenge',
    'Learning Goals': 'Ask Goal',
    'Current AI Usage': 'Ask Interest',
  }
  return label ? map[label] || 'Greeting' : 'Qualified'
}

function primaryInterest(input: ConversationInput) {
  const interests = arrayValues(input.interestAreas || input.interests).map((item) => item.toLowerCase())
  if (interests.some((item) => item.includes('batp') || item.includes('business ai transformation')) || isBusinessIntent(input)) return 'BATP'
  if (interests.some((item) => item.includes('corporate'))) return 'Corporate Training'
  if (interests.some((item) => item.includes('ambassador'))) return 'Ambassador Programme'
  if (interests.some((item) => item.includes('three') || item.includes('professional programme'))) return 'Three-Month Professional Programme'
  if (interests.some((item) => item.includes('ngtp') || item.includes('accelerator') || item.includes('career'))) return 'Career Accelerator'
  if (interests.some((item) => item.includes('webinar') || item.includes('session'))) return 'Webinar'
  return 'Community'
}

function recommendedRoute(input: ConversationInput, score: number) {
  const interest = primaryInterest(input)
  const status = text(input.currentStatus || input.customerCategory, 120)
  if (interest === 'BATP') return 'Business AI Transformation Program'
  if (interest === 'Corporate Training' || status === 'Corporate Representative') return 'Corporate Training'
  if (interest === 'Ambassador Programme') return 'Ambassador Programme'
  if (interest === 'Three-Month Professional Programme') return 'Three-Month Professional Programme'
  if (interest === 'Career Accelerator' || score >= 40) return 'Career Accelerator'
  if (interest === 'Webinar') return 'Webinar'
  return 'Community'
}

function finalPrompt(route: string) {
  const templates: Record<string, string> = {
    Community: 'Thanks. I have enough to start your NEXORA community profile. The next step is to join the community and receive session invites.',
    'Career Accelerator': 'Thanks. Based on your profile, the NEXORA Career Accelerator is the best next step. I can send the programme details and registration link.',
    'Business AI Transformation Program': 'Thanks. Based on your business profile, the Business AI Transformation Program is the best next step. I can send the BATP details and application link.',
    'Three-Month Professional Programme': 'Thanks. You look suited for the three-month professional programme. I can send the full programme details and payment options.',
    Webinar: 'Thanks. The best next step is a NEXORA Intelligence Session. I can send upcoming webinar details.',
    'Corporate Training': 'Thanks. This looks like a corporate training request. The next step is a short discovery call with the NEXORA team.',
    'Ambassador Programme': 'Thanks. I can route you to the ambassador application so you can start referring and tracking rewards.',
    'Human Review': 'Thanks. I have logged your details for the NEXORA team to review and follow up.',
  }
  return templates[route] || templates.Community
}

const leadConversationFields = new Set([
  'Full Name',
  'WhatsApp Number',
  'Email Address',
  'Gender',
  'Current Status',
  'Institution',
  'Course of Study',
  'Graduation Year',
  'Employer',
  'Job Role',
  'Industry',
  'Years of Experience',
  'Location',
  'Interest Areas',
  'Primary Goal',
  'Biggest Challenge',
  'Preferred Webinar Topics',
  'Referral Code',
  'Campaign Source',
])

function airtableRoute(route: string) {
  if (route === 'Business AI Transformation Program') return 'Corporate Training'
  if (route === 'NGTP Application') return 'Career Accelerator'
  return route
}

async function routingDecision(input: ConversationInput, score: number, qualificationStatus: string) {
  const fallbackRoute = recommendedRoute(input, score)
  const interest = primaryInterest(input)
  const category = text(input.currentStatus || input.customerCategory, 120)
  const platform = text(input.platform, 40) || 'WhatsApp'
  const rules = await listRecords<Fields>('Conversation Routing Rules', {
    maxRecords: 100,
    sortField: 'Priority',
    direction: 'asc',
  }).catch(() => [])

  const rule = rules.find((record) => {
    const fields = record.fields
    if (!fields.Active) return false
    const ruleChannel = text(fields.Channel, 40) || 'Any'
    const ruleStatus = text(fields['Qualification Status'], 80) || 'Any'
    const ruleInterest = text(fields['Interest Signal'], 120) || 'Any'
    const ruleCategory = text(fields['Professional Category'], 120) || 'Any'
    const channelMatch = ruleChannel === 'Any' || ruleChannel === platform
    const statusMatch = ruleStatus === 'Any' || ruleStatus === qualificationStatus
    const interestMatch = ruleInterest === 'Any' || ruleInterest === interest || (ruleInterest === 'NGTP' && fallbackRoute === 'Career Accelerator')
    const categoryMatch = ruleCategory === 'Any' || ruleCategory === category
    return channelMatch && statusMatch && interestMatch && categoryMatch
  })

  const route = text(rule?.fields['Recommended Route'], 120) || fallbackRoute
  return {
    route,
    reply: text(rule?.fields['Reply Template']) || finalPrompt(route),
  }
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

async function findConversation(conversationId: string, platform: string, platformUserId: string) {
  if (conversationId) {
    const records = await listRecords<Fields>('Lead Capture Conversations', {
      formula: `{Conversation ID}='${conversationId.replaceAll("'", "\\'")}'`,
      maxRecords: 1,
    })
    if (records[0]) return records[0]
  }

  if (platform && platformUserId) {
    const records = await listRecords<Fields>('Lead Capture Conversations', {
      formula: `AND({Platform}='${platform.replaceAll("'", "\\'")}',{Platform User ID}='${platformUserId.replaceAll("'", "\\'")}')`,
      maxRecords: 1,
    })
    if (records[0]) return records[0]
  }

  return null
}

export async function handleInboundConversation(input: ConversationInput) {
  const platform = text(input.platform, 40) || 'WhatsApp'
  const channel = platform === 'Telegram' ? 'Telegram' : platform === 'Website' ? 'Website' : platform === 'Manual' ? 'Manual' : 'WhatsApp'
  const conversationId = text(input.conversationId, 160) || `${channel}-${text(input.platformUserId || input.whatsAppNumber || input.phone || Date.now(), 120)}`
  const platformUserId = text(input.platformUserId, 160)
  const lastMessage = text(input.message || input.lastUserMessage)
  const now = new Date().toISOString()

  const lead = await captureLead({
    ...input,
    platform: channel,
    conversationId,
    lastUserMessage: lastMessage,
  })

  const missing = missingFields(input)
  const known = knownFields(input)
  const next = nextField(input)
  const decision = next ? { route: 'Human Review', reply: next.prompt } : await routingDecision(input, lead.score, lead.status)
  const route = decision.route
  const storedRoute = airtableRoute(route)
  const nextPrompt = decision.reply
  const status = next ? 'In Progress' : 'Qualified'
  const step = next ? currentStepFor(next.label) : 'Routed'

  const existingConversation = await findConversation(conversationId, channel, platformUserId)
  let conversation: AirtableRecord<Fields> | null = existingConversation
  const conversationFields = compact({
    'Conversation ID': conversationId,
    Contact: [lead.contact.id],
    Platform: channel,
    'Platform User ID': platformUserId,
    'Current Step': step,
    'Recommended Route': storedRoute,
    'Last Inbound Channel': channel,
    'Last Routed At': next ? undefined : now,
    'Conversation Status': status,
    'Last Message At': now,
    'Last User Message': lastMessage,
    'Last Assistant Prompt': nextPrompt,
    'Known Fields': known.filter((field) => leadConversationFields.has(field)),
    'Missing Fields': missing.filter((field) => leadConversationFields.has(field)),
    'Conversation Summary': `Qualification status: ${lead.status}. Recommended route: ${route}.`,
    'Next Question': nextPrompt,
    'Raw Payload': JSON.stringify(input).slice(0, 9000),
  })

  if (conversation) {
    conversation = await updateRecord<AirtableRecord<Fields>>('Lead Capture Conversations', conversation.id, conversationFields)
  } else {
    conversation = await createRecord<AirtableRecord<Fields>>('Lead Capture Conversations', conversationFields)
  }

  await createRecord('Conversation Message Queue', compact({
    'Message ID': `MSG-${Date.now()}`,
    Contact: [lead.contact.id],
    Conversation: [conversation.id],
    Channel: channel,
    'Recipient Chat ID': channel === 'Telegram' ? platformUserId : phone(input.whatsAppNumber || input.phone),
    Direction: 'Outbound',
    'Message Type': next ? 'Question' : 'Recommendation',
    'Message Body': nextPrompt,
    'Queue Status': 'Ready to Send',
    'Scheduled For': now,
    'Created At': now,
    'Source Event ID': text(input.eventId, 160),
  }))

  return {
    ok: true,
    contactId: lead.contact.id,
    conversationId,
    qualificationScore: lead.score,
    qualificationStatus: lead.status,
    missingFields: missing,
    currentStep: step,
    recommendedRoute: route,
    reply: nextPrompt,
  }
}
