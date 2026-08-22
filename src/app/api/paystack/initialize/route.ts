import { NextRequest, NextResponse } from 'next/server'
import { COURSE_CATALOGUE, validateCourseSelection } from '@/lib/accelerator-products'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { cleanReferralCode, resolveSupabaseReferral } from '@/lib/supabase-referrals'

export const runtime = 'nodejs'
const text = (value: unknown, max = 254) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fullName = text(body.fullName, 160)
    const email = text(body.email).toLowerCase()
    const phone = text(body.phone, 80).replace(/[^0-9+]/g, '')
    const selection = validateCourseSelection(body.courseCodes)
    if (!fullName || !email) return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 })
    if (!selection.ok) return NextResponse.json({ error: selection.error }, { status: 400 })
    if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Course registration is temporarily unavailable.' }, { status: 503 })
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Online payment is not configured.' }, { status: 503 })

    const supabase = createSupabaseAdminClient()
    const codes = selection.courses.map((course) => course.code)
    const { data: programmes, error: catalogueError } = await supabase.from('programmes')
      .select('id, programme_code, name, price_ngn').in('programme_code', codes).eq('active', true).eq('registration_open', true)
    if (catalogueError || programmes?.length !== codes.length) throw new Error(`Course catalogue mismatch: ${catalogueError?.message || 'missing active course'}`)

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (usersError) throw usersError
    const user = users.users.find((item) => item.email?.toLowerCase() === email)
    const referralCode = cleanReferralCode(body.referralCode) || cleanReferralCode(request.cookies.get('nexora_referral_code')?.value)
    const referral = referralCode ? await resolveSupabaseReferral(referralCode).catch(() => null) : null
    const reference = `NEXORA-COURSES-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const enrolments = [] as Array<{ id: string; programme_id: string }>
    for (const programme of programmes) {
      const { data, error } = await supabase.from('enrolments').insert({ user_id: user?.id || null, programme_id: programme.id, track_id: null, status: 'PENDING_PAYMENT', referral_code_id: referral?.id || null }).select('id, programme_id').single()
      if (error) throw error
      enrolments.push(data)
    }
    const { data: payment, error: paymentError } = await supabase.from('payments').insert({ user_id: user?.id || null, enrolment_id: enrolments[0].id, programme_id: enrolments[0].programme_id, referral_code_id: referral?.id || null, paystack_reference: reference, amount_ngn: selection.amount, status: 'INITIALIZED', raw_payload: { fullName, email, phone, courseCodes: codes } }).select('id').single()
    if (paymentError) throw paymentError
    const { error: itemsError } = await supabase.from('payment_items').insert(enrolments.map((enrolment) => ({ payment_id: payment.id, programme_id: enrolment.programme_id, enrolment_id: enrolment.id, amount_ngn: 10000 })))
    if (itemsError) throw itemsError

    const paystack = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, amount: selection.amount * 100, currency: 'NGN', reference, callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink'}/payment/success?reference=${reference}`, metadata: { full_name: fullName, phone, course_codes: codes.join(','), course_names: selection.courses.map((course) => course.name).join(', '), referral_code: referralCode, supabase_payment_id: payment.id } }) })
    const result = await paystack.json()
    if (!paystack.ok || !result.status) throw new Error(result.message || 'Paystack initialization failed')
    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference, amount: selection.amount, courses: COURSE_CATALOGUE.filter((course) => codes.includes(course.code)) })
  } catch (error) {
    console.error('Course checkout initialization failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Payment could not be initialized. Please try again.' }, { status: 500 })
  }
}
