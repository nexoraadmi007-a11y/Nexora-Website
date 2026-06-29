import { NextRequest, NextResponse } from 'next/server'
import { captureLead, text } from '@/lib/lead-capture'

export const runtime = 'nodejs'

const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 20
type RateEntry = { count: number; resetAt: number }
const rateStore = new Map<string, RateEntry>()

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

export async function POST(request: NextRequest) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json({ error: 'Too many lead capture attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    if (text(body.website)) return NextResponse.json({ ok: true })

    const fullName = text(body.fullName, 160)
    const email = text(body.email, 254)
    const phone = text(body.phone || body.whatsAppNumber, 80)
    const platformUserId = text(body.platformUserId, 160)
    if (!fullName && !email && !phone && !platformUserId) {
      return NextResponse.json({ error: 'At least one identity field is required.' }, { status: 400 })
    }

    const result = await captureLead(body)
    return NextResponse.json({
      ok: true,
      contactId: result.contact.id,
      created: result.created,
      qualificationScore: result.score,
      qualificationStatus: result.status,
    }, { status: result.created ? 201 : 200 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('Lead capture failed', detail)
    const localDebug = (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
    return NextResponse.json({ error: 'Lead capture failed. Please try again.', ...(localDebug ? { detail } : {}) }, { status: 500 })
  }
}
