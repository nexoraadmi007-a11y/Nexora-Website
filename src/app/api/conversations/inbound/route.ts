import { NextRequest, NextResponse } from 'next/server'
import { handleInboundConversation } from '@/lib/conversation-engine'
import { text } from '@/lib/lead-capture'

export const runtime = 'nodejs'

const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 60
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
    return NextResponse.json({ error: 'Too many conversation events. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    if (text(body.website)) return NextResponse.json({ ok: true })

    const platform = text(body.platform, 40)
    const platformUserId = text(body.platformUserId, 160)
    const message = text(body.message || body.lastUserMessage)
    const conversationId = text(body.conversationId, 160)
    if (!platform && !platformUserId && !message && !conversationId) {
      return NextResponse.json({ error: 'A platform, user ID, message, or conversation ID is required.' }, { status: 400 })
    }

    const result = await handleInboundConversation(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('Conversation inbound failed', detail)
    const localDebug = (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
    return NextResponse.json({ error: 'Conversation inbound failed. Please try again.', ...(localDebug ? { detail } : {}) }, { status: 500 })
  }
}
