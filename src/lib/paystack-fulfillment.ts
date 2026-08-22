import { createSupabaseAdminClient, hasSupabaseAdminConfig } from './supabase/admin'
import { recordSupabaseReferralEvent, resolveSupabaseReferral } from './supabase-referrals'

const text = (value: unknown, max = 254) => typeof value === 'string' ? value.trim().slice(0, max) : ''

async function verify(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured')
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' })
  const result = await response.json()
  if (!response.ok || !result.status) throw new Error(result.message || 'Paystack verification failed')
  return result.data as Record<string, any>
}

export async function finalizeSuccessfulPaystackPayment(reference: string, _eventPayload?: Record<string, any>) {
  if (!hasSupabaseAdminConfig()) throw new Error('Supabase admin configuration is missing')
  const transaction = await verify(reference)
  if (transaction.status !== 'success') return { ok: false as const, status: transaction.status || 'unknown', reference }
  const amount = Math.round(Number(transaction.amount || 0) / 100)
  const metadata = transaction.metadata || {}
  const referralCode = text(metadata.referral_code, 120)
  const referral = referralCode ? await resolveSupabaseReferral(referralCode).catch(() => null) : null
  const supabase = createSupabaseAdminClient()
  const { data: payment, error: paymentError } = await supabase.from('payments').update({ amount_ngn: amount, status: 'PAID', paid_at: transaction.paid_at || new Date().toISOString(), referral_code_id: referral?.id || null, raw_payload: transaction, updated_at: new Date().toISOString() }).eq('paystack_reference', reference).select('id, user_id').single()
  if (paymentError) throw paymentError
  const { data: items, error: itemsError } = await supabase.from('payment_items').select('enrolment_id, amount_ngn, programmes(programme_code, name, slug)').eq('payment_id', payment.id)
  if (itemsError || !items?.length) throw new Error(itemsError?.message || 'Payment has no course items')
  const enrolmentIds = items.map((item) => item.enrolment_id)
  const { error: enrolmentError } = await supabase.from('enrolments').update({ status: 'ENROLLED', referral_code_id: referral?.id || null, updated_at: new Date().toISOString() }).in('id', enrolmentIds)
  if (enrolmentError) throw enrolmentError
  if (referral?.partner_id) {
    await supabase.from('commissions').upsert({ partner_id: referral.partner_id, payment_id: payment.id, level: 'L1', rate: 15, amount_ngn: Math.round(amount * 0.15), status: 'PENDING' }, { onConflict: 'partner_id,payment_id,level' }).throwOnError()
  }
  if (referralCode) await recordSupabaseReferralEvent({ referralCode, eventType: 'PAYMENT_SUCCEEDED', paymentReference: reference, pageUrl: '/payment/success' }).catch(() => undefined)
  const courses = items.map((item: any) => item.programmes).filter(Boolean)
  const fullName = text(metadata.full_name, 160)
  return { ok: true as const, reference, enrollmentId: enrolmentIds[0], enrollmentIds: enrolmentIds, amount, paidAt: transaction.paid_at || new Date().toISOString(), programme: { code: 'COURSES', name: courses.map((course: any) => course.name).join(', '), selectedTracks: courses.map((course: any) => course.name), selectedTrackSlugs: courses.map((course: any) => course.slug) }, customer: { fullName, firstName: fullName.split(/\s+/)[0] || 'there', email: text(transaction.customer?.email) }, referral: { referralCode, ambassadorId: referral?.partner_id || '', attributionStatus: referral ? 'APPROVED' : 'UNATTRIBUTED', attributionSource: referral ? 'DIRECT_REFERRAL' : 'ADMIN_CONFIRMED' }, group: null }
}
