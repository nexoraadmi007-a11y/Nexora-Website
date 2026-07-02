import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { screenGrowthAssociate } from '@/lib/growth-associate'

export const runtime = 'nodejs'

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appNkFVWpoI8ihHmA'
const AIRTABLE_TABLE = 'Ambassador Registrations'
const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 5

type RegistrationPayload = {
  fullName?: unknown
  email?: unknown
  phoneNumber?: unknown
  whatsAppNumber?: unknown
  gender?: unknown
  dateOfBirth?: unknown
  state?: unknown
  lga?: unknown
  location?: unknown
  currentStatus?: unknown
  institutionType?: unknown
  institutionOrOrganization?: unknown
  courseOfStudy?: unknown
  level?: unknown
  nyscBatch?: unknown
  passingOutDate?: unknown
  nyscState?: unknown
  industry?: unknown
  hasLaptop?: unknown
  hasInternetAccess?: unknown
  weeklyHoursAvailable?: unknown
  canAttendWeeklyMeetings?: unknown
  facebookProfile?: unknown
  tiktokProfile?: unknown
  instagramProfile?: unknown
  linkedInProfile?: unknown
  facebookFollowers?: unknown
  tiktokFollowers?: unknown
  instagramFollowers?: unknown
  linkedInConnections?: unknown
  leadershipExperience?: unknown
  whyAmbassador?: unknown
  whyChooseYou?: unknown
  salesExperience?: unknown
  greatestAchievement?: unknown
  communitiesOrNetworks?: unknown
  estimatedReach?: unknown
  promotionExperience?: unknown
  preferredCommunicationChannel?: unknown
  telegramUsername?: unknown
  videoAssessmentLink?: unknown
  communicationsConsent?: unknown
  ambassadorTermsAccepted?: unknown
  externalSubmissionId?: unknown
  website?: unknown
}

type RateEntry = { count: number; resetAt: number }
const rateStore = new Map<string, RateEntry>()
const registrationFields = new Set([
  'Registration ID',
  'Full Name',
  'Email',
  'Phone Number',
  'Location',
  'Current Status',
  'Institution or Organization',
  'NYSC State',
  'Industry',
  'Why Become an Ambassador?',
  'Communities or Networks',
  'Estimated Reach',
  'Promotion Experience',
  'Preferred Communication Channel',
  'Source Channel',
  'Telegram Username',
  'Telegram Chat ID',
  'WhatsApp Number',
  'Platform User ID',
  'Conversation ID',
  'External Submission ID',
  'Submitted At',
  'Communications Consent',
  'Ambassador Terms Accepted',
  'Registration Status',
  'Processing Status',
  'Duplicate Review Needed',
  'Reviewer',
  'Reviewed At',
  'Review Notes',
  'Raw Channel Response',
  'Notes',
  'Master Contact',
  'Created Ambassador',
  'Recruitment Stage',
  'AI Score',
  'AI Recommendation',
  'AI Strengths',
  'AI Weaknesses',
  'AI Interview Questions',
  'AI Suggested Role Fit',
  'AI Screening Summary',
  'Interview Status',
  'Interview Date Time',
  'Calendly Invite Link',
  'Calendly Event ID',
  'Interview Notes',
  'Bootcamp Status',
  'Probation Status',
  'Manager Feedback',
  'Weekly Performance Report',
  'Official Activation Date',
  'Activation Notes',
  'Admin Last Action',
  'Admin Last Action At',
])
function text(value: unknown, max = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function phone(value: unknown) {
  return text(value, 40).replace(/[^0-9+]/g, '')
}

function integer(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0
}

function pickFields(fields: Record<string, unknown>, allowed: Set<string>) {
  return Object.fromEntries(Object.entries(fields).filter(([key, value]) => {
    if (!allowed.has(key)) return false
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

function registrationSummary(body: RegistrationPayload) {
  return [
    text(body.gender, 80) ? `Gender: ${text(body.gender, 80)}` : '',
    text(body.dateOfBirth, 40) ? `Date of birth: ${text(body.dateOfBirth, 40)}` : '',
    text(body.state, 120) ? `State: ${text(body.state, 120)}` : '',
    text(body.lga, 120) ? `LGA: ${text(body.lga, 120)}` : '',
    text(body.institutionType, 120) ? `Institution type: ${text(body.institutionType, 120)}` : '',
    text(body.courseOfStudy, 180) ? `Course of study: ${text(body.courseOfStudy, 180)}` : '',
    text(body.level, 80) ? `Level: ${text(body.level, 80)}` : '',
    text(body.nyscBatch, 80) ? `NYSC batch: ${text(body.nyscBatch, 80)}` : '',
    text(body.passingOutDate, 40) ? `Passing out date: ${text(body.passingOutDate, 40)}` : '',
    text(body.hasLaptop, 40) ? `Laptop: ${text(body.hasLaptop, 40)}` : '',
    text(body.hasInternetAccess, 40) ? `Internet access: ${text(body.hasInternetAccess, 40)}` : '',
    integer(body.weeklyHoursAvailable) ? `Weekly hours: ${integer(body.weeklyHoursAvailable)}` : '',
    text(body.canAttendWeeklyMeetings, 80) ? `Weekly meetings: ${text(body.canAttendWeeklyMeetings, 80)}` : '',
    text(body.facebookProfile, 500) ? `Facebook: ${text(body.facebookProfile, 500)}` : '',
    text(body.tiktokProfile, 500) ? `TikTok: ${text(body.tiktokProfile, 500)}` : '',
    text(body.instagramProfile, 500) ? `Instagram: ${text(body.instagramProfile, 500)}` : '',
    text(body.linkedInProfile, 500) ? `LinkedIn: ${text(body.linkedInProfile, 500)}` : '',
    integer(body.facebookFollowers) ? `Facebook followers: ${integer(body.facebookFollowers)}` : '',
    integer(body.tiktokFollowers) ? `TikTok followers: ${integer(body.tiktokFollowers)}` : '',
    integer(body.instagramFollowers) ? `Instagram followers: ${integer(body.instagramFollowers)}` : '',
    integer(body.linkedInConnections) ? `LinkedIn connections: ${integer(body.linkedInConnections)}` : '',
    text(body.leadershipExperience) ? `Leadership: ${text(body.leadershipExperience)}` : '',
    text(body.whyChooseYou) ? `Why choose you: ${text(body.whyChooseYou)}` : '',
    text(body.salesExperience) ? `Sales/promotions: ${text(body.salesExperience)}` : '',
    text(body.greatestAchievement) ? `Greatest achievement: ${text(body.greatestAchievement)}` : '',
    text(body.videoAssessmentLink, 500) ? `Video assessment: ${text(body.videoAssessmentLink, 500)}` : '',
  ].filter(Boolean).join('\n')
}

function escapeFormula(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

function getClientKey(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function isRateLimited(key: string) {
  const now = Date.now()
  const entry = rateStore.get(key)
  if (!entry || entry.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_REQUESTS
}

async function airtable(path: string, init?: RequestInit) {
  const token = process.env.AIRTABLE_TOKEN
  if (!token) throw new Error('AIRTABLE_TOKEN is not configured')

  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Airtable ${response.status}: ${detail.slice(0, 240)}`)
  }
  return response.json() as Promise<{ id?: string; fields?: Record<string, any>; records?: Array<{ id: string; fields?: Record<string, any> }> }>
}

async function notifyAdmin(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Growth associate Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

export async function POST(request: NextRequest) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as RegistrationPayload
    if (text(body.website)) return NextResponse.json({ ok: true })

    const fullName = text(body.fullName, 160)
    const email = text(body.email, 254).toLowerCase()
    const phoneNumber = phone(body.phoneNumber || body.whatsAppNumber)
    const externalSubmissionId = text(body.externalSubmissionId, 100)
    const whyAmbassador = text(body.whyAmbassador)
    const communities = text(body.communitiesOrNetworks)

    if (!fullName || (!email && !phoneNumber) || !whyAmbassador || !communities) {
      return NextResponse.json({ error: 'Complete the required identity and ambassador profile fields.' }, { status: 400 })
    }
    if (body.communicationsConsent !== true || body.ambassadorTermsAccepted !== true) {
      return NextResponse.json({ error: 'Consent and ambassador terms acceptance are required.' }, { status: 400 })
    }
    if (!externalSubmissionId) {
      return NextResponse.json({ error: 'Submission reference is missing. Refresh and try again.' }, { status: 400 })
    }

    const formula = `AND({Source Channel}='Website',{External Submission ID}='${escapeFormula(externalSubmissionId)}')`
    const query = `${encodeURIComponent(AIRTABLE_TABLE)}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`
    const existing = await airtable(query)
    if (existing.records?.length) {
      return NextResponse.json({ ok: true, registrationReference: externalSubmissionId })
    }

    const fields: Record<string, string | number | boolean> = {
      'Full Name': fullName,
      'Registration ID': `GAR-${Date.now()}`,
      'Source Channel': 'Website',
      'External Submission ID': externalSubmissionId,
      'Submitted At': new Date().toISOString(),
      'Communications Consent': true,
      'Ambassador Terms Accepted': true,
      'Registration Status': 'New',
      'Processing Status': 'New Submission',
      'Recruitment Stage': 'Application Received',
      'Interview Status': 'Not Scheduled',
      'Bootcamp Status': 'Not Started',
      'Probation Status': 'Not Started',
      'Why Become an Ambassador?': whyAmbassador,
      'Communities or Networks': communities,
      Notes: registrationSummary(body),
      'Raw Channel Response': JSON.stringify(body).slice(0, 9000),
    }

    const values: Array<[string, string]> = [
      ['Email', email],
      ['Phone Number', phoneNumber],
      ['WhatsApp Number', phone(body.whatsAppNumber)],
      ['Location', text(body.location, 160)],
      ['Current Status', text(body.currentStatus, 80)],
      ['Institution or Organization', text(body.institutionOrOrganization, 200)],
      ['NYSC State', text(body.nyscState, 120)],
      ['Industry', text(body.industry, 120)],
      ['Promotion Experience', text(body.promotionExperience)],
      ['Preferred Communication Channel', text(body.preferredCommunicationChannel, 30)],
      ['Telegram Username', text(body.telegramUsername, 100)],
    ]
    for (const [field, value] of values) if (value) fields[field] = value

    const estimatedReach = integer(body.estimatedReach)
    if (estimatedReach) fields['Estimated Reach'] = estimatedReach
    const screening = screenGrowthAssociate(body as Record<string, unknown>)
    fields['AI Score'] = screening.score
    fields['AI Recommendation'] = screening.recommendation
    fields['AI Strengths'] = screening.strengths
    fields['AI Weaknesses'] = screening.weaknesses
    fields['AI Interview Questions'] = screening.questions
    fields['AI Suggested Role Fit'] = screening.roleFit
    fields['AI Screening Summary'] = screening.summary

    await airtable(encodeURIComponent(AIRTABLE_TABLE), {
      method: 'POST',
      body: JSON.stringify({ fields: pickFields(fields, registrationFields), typecast: true }),
    })

    await notifyAdmin([
      'New NEXORA Growth Associate application',
      `Name: ${fullName}`,
      `Email: ${email || 'Not provided'}`,
      `Phone: ${phoneNumber || 'Not provided'}`,
      `Location: ${text(body.location || body.state, 160) || 'Not provided'}`,
      `Estimated reach: ${estimatedReach || 0}`,
      `Recruitment stage: ${fields['Recruitment Stage']}`,
      `AI score: ${screening.score}`,
      `AI recommendation: ${screening.recommendation}`,
      `AI summary: ${fullName} applied for Growth Associate recruitment. Motivation: ${whyAmbassador.slice(0, 240) || 'Not provided'}.`,
    ].join('\n'))
    return NextResponse.json({
      ok: true,
      registrationReference: externalSubmissionId,
      stage: 'Application Received',
      message: 'Application submitted successfully.',
    }, { status: 201 })
  } catch (error) {
    console.error('Ambassador registration failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'We could not submit your application. Please try again.' }, { status: 500 })
  }
}
