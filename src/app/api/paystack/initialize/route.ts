import { NextRequest, NextResponse } from 'next/server'
import { authoritativeCourseQuote } from '@/lib/course-checkout'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cleanReferralCode, resolveSupabaseReferral } from '@/lib/supabase-referrals'

export const runtime = 'nodejs'
const text = (value: unknown, max = 254) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fullName = text(body.fullName, 160)
    const submittedEmail = text(body.email).toLowerCase()
    const phone = text(body.phone, 80).replace(/[^0-9+]/g, '')
    if (!fullName || !submittedEmail) return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 })
    if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Course registration is temporarily unavailable.' }, { status: 503 })
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Online payment is not configured.' }, { status: 503 })

    const authClient = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user?.email) return NextResponse.json({ error: 'Please log in before continuing to payment.' }, { status: 401 })
    const email = user.email.toLowerCase()
    if (submittedEmail !== email) return NextResponse.json({ error: `Use the email linked to your account: ${email}` }, { status: 400 })

    const supabase = createSupabaseAdminClient()
    const quote = await authoritativeCourseQuote(supabase, body.courseCodes)
    const codes = quote.courses.map((course) => course.programme_code)

    const { data: existing } = await supabase.from('enrolments').select('programme_id, programmes(name)').eq('user_id', user.id).in('programme_id', quote.courses.map((course) => course.id)).in('status', ['ENROLLED', 'ACTIVE', 'COMPLETED'])
    if (existing?.length) return NextResponse.json({ error: `You are already enrolled in ${existing.map((item: any) => item.programmes?.name).filter(Boolean).join(', ')}.` }, { status: 409 })
    const { data: profile } = await supabase.from('profiles').select('signup_referral_code').eq('id', user.id).maybeSingle()
    const requestedReferralCode = cleanReferralCode(body.referralCode) || cleanReferralCode(request.cookies.get('nexora_referral_code')?.value)
    const referralCode = cleanReferralCode(profile?.signup_referral_code) || requestedReferralCode
    let referral = referralCode ? await resolveSupabaseReferral(referralCode).catch(() => null) : null
    const referralPartner = Array.isArray(referral?.partners) ? referral.partners[0] : referral?.partners
    if (referralPartner?.user_id === user.id || referralPartner?.status !== 'ACTIVE') referral = null
    const reference = `NEXORA-COURSES-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const enrolments = [] as Array<{ id: string; programme_id: string }>
    for (const programme of quote.courses) {
      const { data, error } = await supabase.from('enrolments').insert({ user_id: user.id, programme_id: programme.id, track_id: null, status: 'PENDING_PAYMENT', referral_code_id: referral?.id || null }).select('id, programme_id').single()
      if (error) throw error
      enrolments.push(data)
    }
    const { data: payment, error: paymentError } = await supabase.from('payments').insert({ user_id: user.id, enrolment_id: enrolments[0].id, programme_id: enrolments[0].programme_id, referral_code_id: referral?.id || null, paystack_reference: reference, amount_ngn: quote.total, subtotal_ngn: quote.subtotal, processing_fee_ngn: quote.processingFee, status: 'INITIALIZED', raw_payload: { fullName, email, phone, courseCodes: codes, expectedAmount: quote.total } }).select('id').single()
    if (paymentError) throw paymentError
    const { error: itemsError } = await supabase.from('payment_items').insert(enrolments.map((enrolment) => ({ payment_id: payment.id, programme_id: enrolment.programme_id, enrolment_id: enrolment.id, amount_ngn: quote.courses.find((course) => course.id === enrolment.programme_id)?.price_ngn || 0 })))
    if (itemsError) throw itemsError

    const paystack = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, amount: quote.total * 100, currency: 'NGN', reference, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink'}/payment/success?reference=${reference}`, metadata: { full_name: fullName, phone, course_codes: codes.join(','), course_names: quote.courses.map((course) => course.name).join(', '), subtotal: quote.subtotal, processing_fee: quote.processingFee, expected_amount: quote.total, referral_code: referralCode, supabase_payment_id: payment.id } }) })
    const result = await paystack.json()
    if (!paystack.ok || !result.status) throw new Error(result.message || 'Paystack initialization failed')
    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference, subtotal: quote.subtotal, processingFee: quote.processingFee, amount: quote.total, courses: quote.courses.map((course) => ({ code: course.programme_code, name: course.name, price: course.price_ngn })) })
  } catch (error) {
    console.error('Course checkout initialization failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Payment could not be initialized. Please try again.' }, { status: 500 })
  }
}
