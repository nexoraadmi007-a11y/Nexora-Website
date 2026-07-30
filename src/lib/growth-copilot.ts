import { createRecord, escapeFormula, listRecords, type AirtableRecord } from './airtable'
import { detectKnowledgeConflicts, findProgrammeByFamily, inferTrackFromText, getApprovedKnowledgeSnapshot, type CommercialProgramme, type CommercialTrack, type ProspectSegment } from './commercial-knowledge'
import { compact } from './growth-associate'
import { getSalesSession, saveSalesSession, type SalesSession } from './sales-session'

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

export type ConversationIntent =
  | 'PRICE_QUERY'
  | 'AFFORDABILITY_OBJECTION'
  | 'VALUE_OBJECTION'
  | 'PROGRAMME_DIFFERENTIATION'
  | 'PROGRAMME_CONTENT'
  | 'PROGRAMME_MATCH'
  | 'TRUST_CONCERN'
  | 'TIMING_CONCERN'
  | 'DEVICE_REQUIREMENT'
  | 'CERTIFICATE_QUERY'
  | 'JOB_OUTCOME_QUERY'
  | 'PAYMENT_INTENT'
  | 'APPLICATION_INTENT'
  | 'FOLLOW_UP_REQUEST'
  | 'NOT_INTERESTED'
  | 'OPT_OUT'
  | 'GENERAL_ENQUIRY'
  | 'UNCLEAR'

export type ConversationCopilotContext = {
  mode: 'CONVERSATION_RESPONSE'
  prospectType: ProspectType
  programmeContext: 'CAREER_ACCELERATOR'
  conversationText: string
  latestProspectMessage: string
  associateContext?: Record<string, unknown>
  leadContactability: null
  leadSource: null
  outreachStatus: null
}

export type ConversationCopilotResult = {
  mode: 'CONVERSATION_RESPONSE'
  detectedIntent: ConversationIntent
  detectedObjection: string
  conversationObjective: string
  replyToSend: string
  nextBestAction: string
  responseBranches: Array<{ possibleReply: string; recommendedResponse: string }>
  followUpInstruction: string
  requiresAdminConfirmation: false
  programmeSnapshot: {
    programmeFamily: string
    currentPriceNgn: number
    availableProgrammes: string[]
    approvedValuePoints: string[]
    jobGuarantee: false
    incomeGuarantee: false
  }
}

const individualTerms = ['nysc', 'corper', 'corp member', 'student', 'final year', 'final-year', '500 level', 'graduate', 'internship', 'entry level', 'job', 'portfolio', 'career']
const businessTerms = ['instagram', 'facebook', 'vendor', 'whatsapp', 'business', 'store', 'brand', 'orders', 'customers', 'skincare', 'fashion', 'wig', 'beauty', 'cake', 'delivery']
const excludedBusinessTerms = ['university', 'government', 'hospital', 'major pharmacy', 'large corporation', 'manufacturing company', 'law firm', 'engineering firm']
const genericArticleTerms = ['blog', 'article', 'news', 'guide', 'portal', 'wikipedia', 'newspaper', 'how to', 'latest update']
const conversationForbiddenPhrases = [
  'missing valid contact path',
  'before outreach',
  'locate a valid public contact route',
  'locate a public contact route',
  'lead qualification',
  'source url',
  'assignable lead',
  'confirm from the official page',
  'production action',
  'public profile',
  'contactability',
]

function text(value: unknown, max = 8000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function lower(value: string) {
  return value.toLowerCase()
}

export function trustedCareerProgrammeSnapshot() {
  const career = findProgrammeByFamily('CAREER_ACCELERATOR')
  return {
    programmeFamily: career?.name || 'Career Accelerator',
    currentPriceNgn: career?.currentPrice || 0,
    availableProgrammes: career?.tracks.map((track) => track.name) || [],
    approvedValuePoints: career?.approvedValuePoints || [],
    jobGuarantee: false as const,
    incomeGuarantee: false as const,
  }
}

function latestProspectMessage(input: string) {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const prospectLabels = ['prospect', 'customer', 'client', 'lead']
  const associateLabels = ['associate', 'me', 'sales', 'nexora', 'admin']
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const match = lines[index].match(/^([^:]{1,30}):\s*(.+)$/)
    if (!match) continue
    const label = match[1].toLowerCase()
    if (prospectLabels.some((item) => label.includes(item))) return text(match[2], 2000)
    if (associateLabels.some((item) => label.includes(item))) continue
  }
  return text(lines[lines.length - 1] || input, 2000)
}

function makeConversationContext(input: GrowthCopilotInput): ConversationCopilotContext {
  const conversationText = text(input.text, 7000)
  if (!conversationText || conversationText.length < 4) throw new Error('Please provide enough prospect context for the Conversation Copilot.')
  return {
    mode: 'CONVERSATION_RESPONSE',
    prospectType: inferProspectType(conversationText, input.prospectType),
    programmeContext: 'CAREER_ACCELERATOR',
    conversationText,
    latestProspectMessage: latestProspectMessage(conversationText),
    associateContext: {},
    leadContactability: null,
    leadSource: null,
    outreachStatus: null,
  }
}

function detectConversationIntent(message: string): ConversationIntent {
  const raw = lower(message)
  if (/\b(stop|unsubscribe|do not message|don't message|dont message|leave me)\b/.test(raw)) return 'OPT_OUT'
  if (raw.includes('not interested')) return 'NOT_INTERESTED'
  if (['youtube', 'free video', 'free course', 'online video'].some((term) => raw.includes(term))) return 'PROGRAMME_DIFFERENTIATION'
  if (['how much', 'price', 'cost', 'fee', 'amount'].some((term) => raw.includes(term))) return 'PRICE_QUERY'
  if (['no money', 'enough money', 'money now', 'cannot afford', "can't afford", 'cant afford', 'expensive', 'broke'].some((term) => raw.includes(term))) return 'AFFORDABILITY_OBJECTION'
  if (['worth', 'value', 'benefit', 'why should i', 'why pay'].some((term) => raw.includes(term))) return 'VALUE_OBJECTION'
  if (['what will i learn', 'what do i learn', 'curriculum', 'content', 'modules'].some((term) => raw.includes(term))) return 'PROGRAMME_CONTENT'
  if (['which one', 'which programme', 'which program', 'best for me', 'interested in'].some((term) => raw.includes(term))) return 'PROGRAMME_MATCH'
  if (['scam', 'legit', 'real', 'trust', 'proof'].some((term) => raw.includes(term))) return 'TRUST_CONCERN'
  if (['when', 'start', 'busy', 'time', 'schedule', 'later', 'next week', 'next month'].some((term) => raw.includes(term))) return 'TIMING_CONCERN'
  if (['phone', 'laptop', 'computer', 'device'].some((term) => raw.includes(term))) return 'DEVICE_REQUIREMENT'
  if (['certificate', 'certification'].some((term) => raw.includes(term))) return 'CERTIFICATE_QUERY'
  if (['job', 'work', 'employment', 'opportunity', 'opportunities', 'income', 'earn'].some((term) => raw.includes(term))) return 'JOB_OUTCOME_QUERY'
  if (['payment link', 'pay', 'paid', 'paystack', 'transfer'].some((term) => raw.includes(term))) return 'PAYMENT_INTENT'
  if (['apply', 'register', 'enroll', 'enrol'].some((term) => raw.includes(term))) return 'APPLICATION_INTENT'
  if (['follow up', 'remind me', 'get back'].some((term) => raw.includes(term))) return 'FOLLOW_UP_REQUEST'
  if (['what', 'how', 'details', 'explain'].some((term) => raw.includes(term))) return 'GENERAL_ENQUIRY'
  return 'UNCLEAR'
}

function inferTrackInterest(message: string) {
  const raw = lower(message)
  if (['ui', 'ux', 'design', 'figma', 'product design'].some((term) => raw.includes(term))) return 'Certified UI/UX Designer'
  if (['finance', 'financial', 'accounting', 'banking', 'analysis', 'analyst'].some((term) => raw.includes(term))) return 'AI Financial Analyst'
  if (['content', 'creator', 'social media', 'marketing', 'copywriting'].some((term) => raw.includes(term))) return 'AI Content Creation'
  return ''
}

function conversationObjective(intent: ConversationIntent) {
  const map: Record<ConversationIntent, string> = {
    PRICE_QUERY: 'CONFIRM_PROGRAMME_INTEREST',
    AFFORDABILITY_OBJECTION: 'UNDERSTAND_OBJECTION',
    VALUE_OBJECTION: 'UNDERSTAND_OBJECTION',
    PROGRAMME_DIFFERENTIATION: 'CONFIRM_PROGRAMME_INTEREST',
    PROGRAMME_CONTENT: 'SEND_PROGRAMME_OVERVIEW',
    PROGRAMME_MATCH: 'CONFIRM_PROGRAMME_INTEREST',
    TRUST_CONCERN: 'SEND_PROGRAMME_OVERVIEW',
    TIMING_CONCERN: 'SCHEDULE_FOLLOW_UP',
    DEVICE_REQUIREMENT: 'CONFIRM_PROGRAMME_INTEREST',
    CERTIFICATE_QUERY: 'SEND_PROGRAMME_OVERVIEW',
    JOB_OUTCOME_QUERY: 'SEND_PROGRAMME_OVERVIEW',
    PAYMENT_INTENT: 'SEND_PAYMENT_LINK',
    APPLICATION_INTENT: 'SEND_APPLICATION_LINK',
    FOLLOW_UP_REQUEST: 'SCHEDULE_FOLLOW_UP',
    NOT_INTERESTED: 'RESPECT_OPT_OUT',
    OPT_OUT: 'RESPECT_OPT_OUT',
    GENERAL_ENQUIRY: 'CONFIRM_PROGRAMME_INTEREST',
    UNCLEAR: 'CONFIRM_PROGRAMME_INTEREST',
  }
  return map[intent]
}

function conversationReply(intent: ConversationIntent, context: ConversationCopilotContext) {
  const snapshot = trustedCareerProgrammeSnapshot()
  const price = `NGN ${snapshot.currentPriceNgn.toLocaleString('en-NG')}`
  const programmes = snapshot.availableProgrammes.join(', ')
  const track = inferTrackInterest(context.latestProspectMessage)
  switch (intent) {
    case 'AFFORDABILITY_OBJECTION':
      return {
        reply: `I understand. Is the main issue that the ${price} is not available right now, or that you are still deciding whether the programme is worth it?`,
        action: 'Wait for their answer. If it is timing, agree on a realistic follow-up date. If it is value, explain the practical projects and support.',
      }
    case 'PROGRAMME_DIFFERENTIATION':
      return {
        reply: 'YouTube can give useful information, but it is usually scattered and you have to figure out the learning path yourself. Nexora gives you a structured programme, practical projects, guidance, feedback and accountability, so you do not just watch lessons, you build work you can show. Which career path are you most interested in?',
        action: 'Identify the programme they are interested in, then explain the specific projects and outcome.',
      }
    case 'PRICE_QUERY':
      return {
        reply: `The Career Accelerator currently costs ${price}. The available programmes are ${programmes}. Which one are you interested in so I can share the exact details?`,
        action: 'Confirm the specific programme interest, then send the relevant breakdown and enrollment link.',
      }
    case 'PROGRAMME_CONTENT':
      return {
        reply: track
          ? `In ${track}, you learn through a structured roadmap, practical tasks, guided support, and a capstone you can show. I can send the module breakdown if you want to see the exact weekly plan.`
          : `You learn through a structured roadmap, practical tasks, guided support, and a capstone you can show. The three options are ${programmes}. Which one do you want the breakdown for?`,
        action: 'Send the programme-specific modules after they choose a path.',
      }
    case 'DEVICE_REQUIREMENT':
      return {
        reply: 'You can use your phone for some learning, communication, research and assignments, but a laptop is better for serious project work, especially UI/UX design, finance analysis, spreadsheets, dashboards and portfolio work. Which path are you considering?',
        action: 'Confirm the programme first, then explain the realistic device requirement for that path.',
      }
    case 'CERTIFICATE_QUERY':
      return {
        reply: 'Yes, certificate is included after you complete the required assignments and capstone review. The stronger value is that the certificate is backed by practical work you can show. Which programme are you looking at?',
        action: 'Confirm their programme interest and explain the capstone/certificate requirement.',
      }
    case 'JOB_OUTCOME_QUERY':
      return {
        reply: 'Knowing AI can open opportunities in content, design, finance analysis, business operations and productivity support, but it is not a job guarantee. The goal is to build practical skills and portfolio evidence that make you more useful. Which direction interests you most?',
        action: 'Match the prospect to one career path and avoid promising jobs, income or clients.',
      }
    case 'TRUST_CONCERN':
      return {
        reply: 'That is fair. You should verify before paying. You can check Nexora through the official website, programme page and payment process. I can send the official link so you confirm the details yourself.',
        action: 'Send only the official Nexora link and answer their specific trust concern calmly.',
      }
    case 'TIMING_CONCERN':
      return {
        reply: 'No problem. Would you prefer I send the details now so you can review them, then I follow up at a time that works for you?',
        action: 'Ask for a specific follow-up day or time instead of defaulting to 24 hours.',
      }
    case 'PAYMENT_INTENT':
      return {
        reply: 'Great. I can send the official payment link so your enrollment is tracked properly. Which programme are you paying for?',
        action: 'Confirm programme choice before sending the payment link.',
      }
    case 'APPLICATION_INTENT':
      return {
        reply: 'Great. I can send the registration link. Before I do, which Career Accelerator programme do you want: AI Content Creation, Certified UI/UX Designer, or AI Financial Analyst?',
        action: 'Confirm the programme choice, then send the correct application/enrollment link.',
      }
    case 'NOT_INTERESTED':
      return {
        reply: 'No problem, thank you for letting me know. Would you like me to stop here, or should I only send future updates if there is something very relevant?',
        action: 'Respect the decision. Do not keep following up unless they give permission.',
      }
    case 'OPT_OUT':
      return {
        reply: 'Understood. I will not continue the conversation. Thank you for your time.',
        action: 'Stop follow-up and mark the conversation as opted out where applicable.',
      }
    case 'VALUE_OBJECTION':
      return {
        reply: `That is a fair question. The value is not just lessons; it is structure, practical projects, feedback, accountability and a capstone you can show. What result matters most to you: learning the skill, building a portfolio, or improving your career options?`,
        action: 'Find the value concern before sending a longer pitch.',
      }
    default:
      return {
        reply: `Nexora Career Accelerator has three practical paths: ${programmes}. Each one is structured around projects, feedback and a capstone. Which path are you most interested in?`,
        action: 'Confirm programme interest before sending detailed information.',
      }
  }
}

function responseBranches(intent: ConversationIntent, price: string) {
  if (intent === 'AFFORDABILITY_OBJECTION') {
    return [
      { possibleReply: 'I just do not have the money.', recommendedResponse: 'No problem. When do you realistically think you may be able to enrol?' },
      { possibleReply: 'I am not sure it is worth it.', recommendedResponse: 'That is fair. Which result matters most to you: learning the skill, building a portfolio, or improving your career options?' },
    ]
  }
  if (intent === 'PROGRAMME_DIFFERENTIATION') {
    return [
      { possibleReply: 'Which projects will I do?', recommendedResponse: 'That depends on the path you choose. Content, UI/UX and Financial Analysis each have different practical projects and capstones.' },
      { possibleReply: 'Can I still learn from YouTube?', recommendedResponse: 'Yes, YouTube can support you. Nexora gives the structure, guidance, tasks and feedback so you know what to do next.' },
    ]
  }
  if (intent === 'PRICE_QUERY') {
    return [
      { possibleReply: 'Is there a discount?', recommendedResponse: `The current approved price is ${price}. Let me first confirm the programme you want so I send the correct details.` },
    ]
  }
  return []
}

function validateConversationResult(result: ConversationCopilotResult) {
  if (result.mode !== 'CONVERSATION_RESPONSE') return 'Invalid conversation mode.'
  if (!result.replyToSend) return 'Missing reply_to_send.'
  if (!result.nextBestAction) return 'Missing next_best_action.'
  const body = `${result.replyToSend}\n${result.nextBestAction}`.toLowerCase()
  const forbidden = conversationForbiddenPhrases.find((phrase) => body.includes(phrase))
  if (forbidden) return `Conversation reply contains forbidden lead-analysis phrase: ${forbidden}.`
  if (/\b[A-Z]{3,}_[A-Z_]+\b/.test(`${result.replyToSend}\n${result.nextBestAction}`)) return 'Conversation reply exposes internal enum formatting.'
  const words = `${result.replyToSend} ${result.nextBestAction}`.split(/\s+/).filter(Boolean)
  if (words.length > 150) return 'Conversation reply is too long for default Telegram mode.'
  return ''
}

function formatPrice(programme?: CommercialProgramme | CommercialTrack) {
  if (!programme?.currentPrice) return ''
  return `NGN ${programme.currentPrice.toLocaleString('en-NG')}`
}

function classifyCommercialProspect(input: string, explicit?: ProspectType, session?: SalesSession): ProspectSegment {
  if (session?.prospectType && session.prospectType !== 'UNKNOWN') return session.prospectType
  if (explicit === 'BUSINESS') return 'BUSINESS_OWNER'
  if (explicit === 'INDIVIDUAL') return 'INDIVIDUAL_CAREER'
  const raw = lower(input)
  const businessSignals = ['business programme', 'business program', 'business transformation', 'my business', 'my store', 'customers', 'orders', 'instagram page', 'website', 'sales', 'staff', 'whatsapp orders', 'marketing', 'automation', 'vendor', 'skincare', 'fashion', 'restaurant', 'shop', 'brand', 'business owner']
  const careerSignals = ['career accelerator', 'career programme', 'career program', 'course', 'career', 'nysc', 'student', 'graduate', 'job', 'skill', 'portfolio', 'track', 'learn ai', 'ui/ux', 'content creation', 'financial analyst']
  const corporateSignals = ['company training', 'train my team', 'employees', 'staff training', 'corporate']
  const businessScore = businessSignals.filter((term) => raw.includes(term)).length
  const careerScore = careerSignals.filter((term) => raw.includes(term)).length
  if (corporateSignals.some((term) => raw.includes(term))) return 'CORPORATE'
  if (businessScore > careerScore) return 'BUSINESS_OWNER'
  if (careerScore > businessScore) return 'INDIVIDUAL_CAREER'
  return 'UNKNOWN'
}

function selectedProgrammeFromContext(segment: ProspectSegment, input: string, session?: SalesSession) {
  const raw = lower(`${session?.selectedProgramme || ''} ${input}`)
  if (segment === 'BUSINESS_OWNER' || raw.includes('business transformation') || raw.includes('business programme') || raw.includes('business program')) return findProgrammeByFamily('BUSINESS_TRANSFORMATION')
  if (segment === 'INDIVIDUAL_CAREER' || raw.includes('career accelerator') || raw.includes('career programme') || raw.includes('career program')) return findProgrammeByFamily('CAREER_ACCELERATOR')
  return undefined
}

function selectedTrackFromContext(input: string, session?: SalesSession) {
  if (session?.selectedTrack) return inferTrackFromText(session.selectedTrack) || inferTrackFromText(input)
  return inferTrackFromText(input)
}

function businessGapFromText(input: string, session?: SalesSession) {
  const raw = lower(input)
  if (session?.knownBusinessGap) return session.knownBusinessGap
  if (['whatsapp', 'orders', 'dm', 'follow up'].some((term) => raw.includes(term))) return 'orders and customer follow-up'
  if (['website', 'landing page', 'online presence'].some((term) => raw.includes(term))) return 'online presence and lead capture'
  if (['marketing', 'content', 'sales'].some((term) => raw.includes(term))) return 'marketing and sales system'
  if (['database', 'crm', 'customers'].some((term) => raw.includes(term))) return 'customer database and CRM'
  if (['dashboard', 'report', 'tracking'].some((term) => raw.includes(term))) return 'business dashboard and reporting'
  return ''
}

function businessTypeFromText(input: string, session?: SalesSession) {
  const raw = lower(input)
  if (session?.knownBusinessType) return session.knownBusinessType
  if (raw.includes('skincare')) return 'skincare business'
  if (raw.includes('fashion') || raw.includes('clothes')) return 'fashion business'
  if (raw.includes('restaurant') || raw.includes('food')) return 'restaurant'
  if (raw.includes('school')) return 'school'
  if (raw.includes('instagram')) return 'Instagram vendor'
  if (raw.includes('whatsapp')) return 'WhatsApp business'
  return ''
}

function commercialObjective(input: {
  segment: ProspectSegment
  intent: ConversationIntent
  programme?: CommercialProgramme
  track?: CommercialTrack
  session?: SalesSession
}) {
  if (input.intent === 'OPT_OUT' || input.intent === 'NOT_INTERESTED') return 'RESPECT_OPT_OUT'
  if (input.segment === 'UNKNOWN') return 'CLARIFY_PROSPECT_TYPE'
  if (input.segment === 'BUSINESS_OWNER') {
    if (input.intent === 'PRICE_QUERY') return 'EXPLAIN_BUSINESS_PROGRAMME'
    if (input.intent === 'APPLICATION_INTENT') return 'SEND_APPLICATION'
    if (input.intent === 'PAYMENT_INTENT') return 'SEND_PROPOSAL'
    if (!input.session?.knownBusinessGap) return 'IDENTIFY_GAP'
    return 'BOOK_ASSESSMENT'
  }
  if (input.intent === 'PRICE_QUERY') return input.programme ? 'ANSWER_PRICE' : 'MATCH_TRACK'
  if (input.intent === 'APPLICATION_INTENT') return input.track || input.session?.selectedTrack ? 'SEND_APPLICATION' : 'MATCH_TRACK'
  if (input.intent === 'PAYMENT_INTENT') return input.track || input.session?.selectedTrack ? 'SEND_PAYMENT' : 'MATCH_TRACK'
  if (input.track || input.session?.selectedTrack) return 'EXPLAIN_TRACK'
  return 'MATCH_TRACK'
}

function trackSpecificSummary(track: CommercialTrack) {
  const modules = track.modules.slice(0, 3).map((module) => module.title).join(', ')
  const project = track.projects[0] || track.capstone
  return `${track.name} covers ${modules}. You will work toward ${project.toLowerCase()} and a reviewed capstone.`
}

function knowledgeGroundedReply(input: {
  message: string
  segment: ProspectSegment
  intent: ConversationIntent
  programme?: CommercialProgramme
  track?: CommercialTrack
  businessGap: string
  businessType: string
  objective: string
  session?: SalesSession
}) {
  const career = findProgrammeByFamily('CAREER_ACCELERATOR')
  const business = findProgrammeByFamily('BUSINESS_TRANSFORMATION')
  const trackNames = career?.tracks.map((track) => track.name).join(', ') || ''
  const programme = input.programme
  const price = formatPrice(input.track || programme)

  if (input.intent === 'OPT_OUT') return { reply: 'Understood. I will not continue the conversation. Thank you for your time.', action: 'End the sales conversation and do not follow up.' }
  if (input.intent === 'NOT_INTERESTED') return { reply: 'No problem, thank you for letting me know. Should I stop here, or would you only like future updates if something directly relevant comes up?', action: 'Respect their answer. Do not continue unless they give permission.' }
  if (input.segment === 'UNKNOWN') return { reply: 'Are you asking about developing a career skill or improving your business?', action: 'Wait for the clarification, then continue under the correct programme family.' }

  if (input.segment === 'BUSINESS_OWNER') {
    if (!business) return { reply: "This detail is not currently confirmed in Nexora's approved programme information.", action: 'Do not invent business programme information. Ask admin to review the knowledge base.' }
    const businessPrice = formatPrice(business)
    if (input.intent === 'PRICE_QUERY') return {
      reply: `The AI Business Transformation Programme currently costs ${businessPrice} and runs for ${business.duration}. It is designed to help business owners improve customer management, marketing, sales and operations. Would you prefer the full breakdown or a short assessment for your business?`,
      action: 'Send the business overview or book an assessment based on their response.',
    }
    if (input.intent === 'APPLICATION_INTENT') return {
      reply: `Great. The next step is the Business Transformation application. It helps Nexora understand your business, current gaps and the assets you need built. Should I send the application link now?`,
      action: `Send ${business.applicationUrl} if they confirm.`,
    }
    if (input.intent === 'PAYMENT_INTENT') return {
      reply: `Great. Before payment, let us confirm your business need so the programme is properly matched to you. Is your biggest need branding, website, customer follow-up, marketing, sales process, or operations dashboard?`,
      action: 'Confirm the business gap before sending the payment path.',
    }
    const gap = input.businessGap || 'customer management and business growth systems'
    const businessType = input.businessType ? ` for your ${input.businessType}` : ''
    return {
      reply: `From what you described${businessType}, the first thing to understand is ${gap}. The Business Transformation Programme can help you build practical systems such as a website, customer database, marketing engine, sales workflow, automation and dashboards. Would you be open to a short assessment so we can show what the first system should look like for your business?`,
      action: 'Ask one diagnostic question or book the assessment. Do not pitch every deliverable at once.',
    }
  }

  if (!career) return { reply: "This detail is not currently confirmed in Nexora's approved programme information.", action: 'Ask admin to review the approved knowledge snapshot.' }
  if (input.intent === 'PRICE_QUERY') {
    if (!programme && !input.track && !input.session?.selectedProgramme) return {
      reply: 'Are you asking about the Career Accelerator or the Business Transformation Programme?',
      action: 'Clarify the correct offer before giving a price.',
    }
    return {
      reply: input.track
        ? `${input.track.name} currently costs ${formatPrice(input.track)}. ${trackSpecificSummary(input.track)} Would you prefer the full breakdown or the application link?`
        : `The Career Accelerator currently costs ${formatPrice(career)} per programme. The active options are ${trackNames}. Which path should I send details for?`,
      action: input.track ? 'Send the selected track breakdown or application link based on their response.' : 'Confirm the track before sending the application/payment path.',
    }
  }
  if (input.track) return {
    reply: `Great choice. ${trackSpecificSummary(input.track)} Would you prefer the full programme breakdown or the application link?`,
    action: 'Send the selected track information. If the prospect is satisfied, move to application.',
  }
  if (input.intent === 'PROGRAMME_DIFFERENTIATION') return {
    reply: `YouTube can help, but Nexora gives a structured path, real projects, feedback and a reviewed capstone. The active Career Accelerator options are ${trackNames}. Which one fits your goal best?`,
    action: 'Get the selected track, then explain that track using approved modules and projects.',
  }
  if (input.intent === 'AFFORDABILITY_OBJECTION') return {
    reply: `I understand. Is the main issue that the ${formatPrice(career)} fee is not available right now, or that you are still deciding whether the programme is worth it?`,
    action: 'If the issue is timing, agree on a follow-up date. If it is value, connect the selected track to practical projects and outcomes.',
  }
  if (input.intent === 'APPLICATION_INTENT') return {
    reply: `Great. Before I send the application link, choose the Career Accelerator path you want: ${trackNames}. Which one should I register you for?`,
    action: 'Confirm the selected track, then send the application link.',
  }
  return {
    reply: `The Career Accelerator has these active paths: ${trackNames}. Which one matches what you want to build next?`,
    action: 'Match the prospect to one track before explaining details or sending application/payment.',
  }
}

function qualityGate(result: ConversationCopilotResult) {
  const baseError = validateConversationResult(result)
  if (baseError) return baseError
  const body = `${result.replyToSend}\n${result.nextBestAction}`.toLowerCase()
  if (body.includes('guaranteed job') || body.includes('guaranteed income') || body.includes('guaranteed sales')) return 'Unsupported guarantee detected.'
  if (body.includes('source url') || body.includes('contact path')) return 'Lead-analysis wording leaked into conversation response.'
  return ''
}

function buildConversationResult(input: GrowthCopilotInput, session?: SalesSession): ConversationCopilotResult & { prospectSegment: ProspectSegment; selectedProgramme: string; selectedTrack: string; knowledgeVersion: string; fieldsUsed: string[] } {
  const context = makeConversationContext({ ...input, mode: 'conversation' })
  const snapshot = getApprovedKnowledgeSnapshot()
  const intent = detectConversationIntent(context.latestProspectMessage)
  const segment = classifyCommercialProspect(context.conversationText, input.prospectType, session)
  const programme = selectedProgrammeFromContext(segment, context.conversationText, session)
  const track = selectedTrackFromContext(context.conversationText, session)
  const businessGap = businessGapFromText(context.conversationText, session)
  const businessType = businessTypeFromText(context.conversationText, session)
  const objective = commercialObjective({ segment, intent, programme, track, session })
  const generated = knowledgeGroundedReply({ message: context.latestProspectMessage, segment, intent, programme, track, businessGap, businessType, objective, session })
  const career = findProgrammeByFamily('CAREER_ACCELERATOR')
  const result = {
    mode: 'CONVERSATION_RESPONSE' as const,
    detectedIntent: intent,
    detectedObjection: intent.includes('OBJECTION') ? intent : '',
    conversationObjective: objective,
    replyToSend: generated.reply,
    nextBestAction: generated.action,
    responseBranches: responseBranches(intent, formatPrice(programme || career) || 'approved price'),
    followUpInstruction: generated.action,
    requiresAdminConfirmation: false as const,
    programmeSnapshot: {
      programmeFamily: programme?.name || career?.name || 'Nexora approved programme',
      currentPriceNgn: programme?.currentPrice || career?.currentPrice || 0,
      availableProgrammes: programme?.tracks.length ? programme.tracks.map((item) => item.name) : snapshot.programmes.filter((item) => item.active).map((item) => item.name),
      approvedValuePoints: programme?.approvedValuePoints || career?.approvedValuePoints || [],
      jobGuarantee: false as const,
      incomeGuarantee: false as const,
    },
    prospectSegment: segment,
    selectedProgramme: programme?.name || '',
    selectedTrack: track?.name || '',
    knowledgeVersion: snapshot.version,
    fieldsUsed: [
      'programmeFamily',
      'currentPrice',
      'duration',
      'tracks',
      track ? 'track.modules' : '',
      track ? 'track.projects' : '',
      segment === 'BUSINESS_OWNER' ? 'business.outcomes' : '',
    ].filter(Boolean),
  }
  const error = qualityGate(result)
  if (error) throw new Error(error)
  return result
}

export function runConversationCopilot(input: GrowthCopilotInput): ConversationCopilotResult {
  return buildConversationResult(input)
}

export async function runConversationCopilotWithSession(input: GrowthCopilotInput & { telegramChatId?: string; prospectReference?: string }) {
  const session = await getSalesSession({
    associateId: input.associateId,
    telegramChatId: input.telegramChatId,
    prospectReference: input.prospectReference,
    leadId: input.leadId,
  })
  const result = buildConversationResult(input, session)
  session.prospectType = result.prospectSegment
  session.selectedProgramme = result.selectedProgramme || session.selectedProgramme
  session.selectedTrack = result.selectedTrack || session.selectedTrack
  session.currentObjective = result.conversationObjective
  session.currentSalesStage = result.conversationObjective
  session.lastProspectMessage = latestProspectMessage(input.text)
  session.lastCopilotReply = result.replyToSend
  session.lastQuestionAsked = result.replyToSend.endsWith('?') ? result.replyToSend : session.lastQuestionAsked
  session.applicationSent = session.applicationSent || result.conversationObjective === 'SEND_APPLICATION'
  session.paymentLinkSent = session.paymentLinkSent || result.conversationObjective === 'SEND_PAYMENT'
  session.knownBusinessGap = businessGapFromText(input.text, session)
  session.knownBusinessType = businessTypeFromText(input.text, session)
  await saveSalesSession({ session })
  return result
}

export function formatConversationCopilotResult(result: ConversationCopilotResult, detailed = false) {
  const base = [
    'NEXORA GROWTH COPILOT',
    '',
    'Reply to Send',
    '',
    `"${result.replyToSend}"`,
    '',
    'Next Best Action',
    '',
    result.nextBestAction,
  ]
  if (!detailed) return base.join('\n')
  const branches = result.responseBranches.slice(0, 3).flatMap((branch) => [
    '',
    `If they say: "${branch.possibleReply}"`,
    `Reply: "${branch.recommendedResponse}"`,
  ])
  return [
    ...base,
    '',
    `Detected Concern: ${result.detectedIntent.replaceAll('_', ' ').toLowerCase()}`,
    ...branches,
  ].join('\n')
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
