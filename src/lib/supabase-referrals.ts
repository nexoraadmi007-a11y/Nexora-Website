import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'

export const referralEventTypes = new Set([
  'LINK_CLICKED',
  'LANDING_PAGE_VIEWED',
  'APPLICATION_STARTED',
  'APPLICATION_COMPLETED',
  'CHECKOUT_STARTED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'ENROLLED',
  'REFUNDED',
  'REGISTRATION_COMPLETED',
])

export function cleanReferralCode(value: unknown) {
  const raw = typeof value === 'string' ? value.trim().slice(0, 300) : ''
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return (url.searchParams.get('ref') || '').trim().slice(0, 120).toUpperCase()
  } catch {
    const match = raw.match(/[?&]ref=([^&\s]+)/i)
    return (match?.[1] ? decodeURIComponent(match[1]) : raw).trim().slice(0, 120).toUpperCase()
  }
}

export async function resolveSupabaseReferral(referralCode: string) {
  if (!hasSupabaseAdminConfig()) return null
  const code = cleanReferralCode(referralCode)
  if (!code) return null
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('referral_codes')
    .select('id, code, partner_id, referral_url, partners(id, partner_id, full_name, email)')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle()
  if (error) throw new Error(`Supabase referral lookup failed: ${error.message}`)
  return data
}

export async function recordSupabaseReferralEvent(input: {
  referralCode: string
  eventType: string
  userId?: string
  paymentReference?: string
  pageUrl?: string
  anonymousId?: string
  sessionId?: string
}) {
  if (!hasSupabaseAdminConfig()) return { ok: false, reason: 'SUPABASE_NOT_CONFIGURED' }
  const referralCode = cleanReferralCode(input.referralCode)
  if (!referralCode) return { ok: false, reason: 'MISSING_REFERRAL_CODE' }
  const eventType = input.eventType || 'LANDING_PAGE_VIEWED'
  if (!referralEventTypes.has(eventType)) return { ok: false, reason: 'INVALID_EVENT_TYPE' }
  const referral = await resolveSupabaseReferral(referralCode)
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('referral_events').insert({
    referral_code_id: referral?.id || null,
    partner_id: referral?.partner_id || null,
    referral_code_text: referralCode,
    event_type: eventType,
    session_id: input.sessionId || null,
    anonymous_id: input.anonymousId || null,
    user_id: input.userId || null,
    payment_reference: input.paymentReference || null,
    page_url: input.pageUrl || null,
    occurred_at: new Date().toISOString(),
  })
  if (error) throw new Error(`Supabase referral event insert failed: ${error.message}`)
  return { ok: true, referral, pendingResolution: !referral }
}
