import { NextRequest, NextResponse } from 'next/server'
import { createRecord, escapeFormula, listRecords } from '@/lib/airtable'
import { cleanReferralCode, recordSupabaseReferralEvent, referralEventTypes } from '@/lib/supabase-referrals'

export const runtime = 'nodejs'

const allowedEvents = referralEventTypes

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

async function findAmbassador(referralCode: string) {
  if (!referralCode) return null
  const records = await listRecords<Record<string, any>>('Ambassadors', {
    formula: `{Referral Code}='${escapeFormula(referralCode)}'`,
    maxRecords: 1,
  }).catch(() => [])
  return records[0] || null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const referralCode = cleanReferralCode(body.referralCode)
    const eventType = text(body.eventType, 80) || 'LANDING_PAGE_VIEWED'
    if (!referralCode || !allowedEvents.has(eventType)) return NextResponse.json({ ok: true, skipped: true })

    const supabaseResult = await recordSupabaseReferralEvent({
      referralCode,
      eventType,
      anonymousId: text(body.visitorId, 160),
      sessionId: text(body.sessionId, 160),
      pageUrl: text(body.pageUrl, 500).startsWith('http') ? text(body.pageUrl, 500) : undefined,
    }).catch((error) => {
      console.error('Supabase referral event capture failed', error instanceof Error ? error.message : error)
      return null
    })
    if (supabaseResult?.ok) return NextResponse.json({ ok: true, storage: 'supabase' })

    const ambassador = await findAmbassador(referralCode)
    if (!ambassador) return NextResponse.json({ ok: true, skipped: true, reason: 'Unknown referral code' })

    const visitorId = text(body.visitorId, 160)
    const sessionId = text(body.sessionId, 160)
    const now = new Date().toISOString()
    await createRecord('Referral Events', compact({
      'Referral Event ID': `REVT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      'Referral Code': referralCode,
      Associate: [ambassador.id],
      'Visitor ID': visitorId,
      'Session ID': sessionId,
      'Event Type': eventType,
      'Page URL': text(body.pageUrl, 500).startsWith('http') ? text(body.pageUrl, 500) : undefined,
      'Occurred At': now,
    }))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Referral event capture failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: true, skipped: true })
  }
}
