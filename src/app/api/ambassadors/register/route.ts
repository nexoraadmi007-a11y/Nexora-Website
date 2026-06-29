import { NextRequest, NextResponse } from 'next/server'

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
  location?: unknown
  currentStatus?: unknown
  institutionOrOrganization?: unknown
  nyscState?: unknown
  industry?: unknown
  whyAmbassador?: unknown
  communitiesOrNetworks?: unknown
  estimatedReach?: unknown
  promotionExperience?: unknown
  preferredCommunicationChannel?: unknown
  telegramUsername?: unknown
  communicationsConsent?: unknown
  ambassadorTermsAccepted?: unknown
  externalSubmissionId?: unknown
  website?: unknown
}

type RateEntry = { count: number; resetAt: number }
const rateStore = new Map<string, RateEntry>()

function text(value: unknown, max = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function phone(value: unknown) {
  return text(value, 40).replace(/[^0-9+]/g, '')
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
  return response.json() as Promise<{ records?: Array<{ id: string }> }>
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
      'Source Channel': 'Website',
      'External Submission ID': externalSubmissionId,
      'Submitted At': new Date().toISOString(),
      'Communications Consent': true,
      'Ambassador Terms Accepted': true,
      'Registration Status': 'New',
      'Processing Status': 'New Submission',
      'Why Become an Ambassador?': whyAmbassador,
      'Communities or Networks': communities,
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

    const reach = Number(body.estimatedReach)
    if (Number.isFinite(reach) && reach >= 0) fields['Estimated Reach'] = Math.round(reach)

    await airtable(encodeURIComponent(AIRTABLE_TABLE), {
      method: 'POST',
      body: JSON.stringify({ fields }),
    })

    return NextResponse.json({ ok: true, registrationReference: externalSubmissionId }, { status: 201 })
  } catch (error) {
    console.error('Ambassador registration failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'We could not submit your application. Please try again.' }, { status: 500 })
  }
}
