import { NextRequest, NextResponse } from 'next/server'
import { createRecord, escapeFormula, listRecords } from '@/lib/airtable'
import { calculateCareerTrackPricing, careerAcceleratorTracks } from '@/lib/career-accelerator-v2'
import { captureLead } from '@/lib/lead-capture'
import { calculateCheckoutPrice, commissionAmount } from '@/lib/product-rules'
import { sendTelegramMessage } from '@/lib/telegram'
import { cleanReferralCode, recordSupabaseReferralEvent, resolveSupabaseReferral } from '@/lib/supabase-referrals'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { careerCourseByName, careerCourseBySlug, normalizeCareerCourseSlug } from '@/lib/career-course-map'

export const runtime = 'nodejs'

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function phone(value: unknown) {
  return text(value, 80).replace(/[^0-9+]/g, '')
}

function normalizeReferralCode(value: unknown) {
  return cleanReferralCode(value)
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => text(item, 160)).filter(Boolean)
  const raw = text(value)
  if (!raw) return []
  return raw.split(',').map((item) => text(item, 160)).filter(Boolean)
}

function normalizeTrackSlugs(value: unknown) {
  return stringArray(value).map(normalizeCareerCourseSlug).filter(Boolean)
}

async function findAmbassador(referralCode: string) {
  if (!referralCode) return null
  const records = await listRecords<Record<string, any>>('Ambassadors', {
    formula: `{Referral Code}='${escapeFormula(referralCode)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

async function findProgram(code: string) {
  const records = await listRecords<Record<string, any>>('Programmes', {
    formula: `{Programme Code}='${escapeFormula(code)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

async function createReferralEvent(input: {
  referralCode: string
  ambassadorId?: string
  contactId?: string
  programmeId?: string
  visitorId?: string
  sessionId?: string
  eventType: string
  pageUrl?: string
}) {
  if (!input.referralCode && !input.ambassadorId) return null
  return createRecord('Referral Events', compact({
    'Referral Event ID': `REVT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    'Referral Code': input.referralCode,
    ...(input.ambassadorId ? { Associate: [input.ambassadorId] } : {}),
    ...(input.contactId ? { Lead: [input.contactId] } : {}),
    ...(input.programmeId ? { Programme: [input.programmeId] } : {}),
    'Visitor ID': input.visitorId,
    'Session ID': input.sessionId,
    'Event Type': input.eventType,
    'Page URL': input.pageUrl,
    'Occurred At': new Date().toISOString(),
  }))
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

async function notifyAdmin(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Application Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

async function findSupabaseProgramme(input: { programCode: string; programmeSlug: string; selectedTrackSlugs: string[] }) {
  if (!hasSupabaseAdminConfig()) return null
  const supabase = createSupabaseAdminClient()
  const careerCourse = input.programCode === 'BATP' ? null : careerCourseBySlug(input.selectedTrackSlugs[0])
  const programmeCode = input.programCode === 'BATP'
    ? 'BUSINESS_TRANSFORMATION'
    : careerCourse?.programmeCode || 'AI_INCOME_ACCELERATOR'
  const { data: programme, error } = await supabase
    .from('programmes')
    .select('id, programme_code, slug, name, price_ngn')
    .eq('programme_code', programmeCode)
    .maybeSingle()
  if (error) throw new Error(`Supabase programme lookup failed: ${error.message}`)
  if (!programme) return null
  let trackId: string | null = null
  if (input.selectedTrackSlugs[0] && programme.programme_code === 'AI_INCOME_ACCELERATOR') {
    const { data: track, error: trackError } = await supabase
      .from('programme_tracks')
      .select('id')
      .eq('programme_id', programme.id)
      .eq('slug', input.selectedTrackSlugs[0])
      .maybeSingle()
    if (trackError) throw new Error(`Supabase track lookup failed: ${trackError.message}`)
    trackId = track?.id || null
  }
  return { ...programme, trackId }
}

async function findSupabaseUserByEmail(email: string) {
  if (!hasSupabaseAdminConfig() || !email) return null
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new Error(`Supabase user lookup failed: ${error.message}`)
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null
}

async function createSupabaseCheckout(input: {
  email: string
  amount: number
  reference: string
  programCode: string
  programmeSlug: string
  selectedTrackSlugs: string[]
  referralCode: string
  metadata: Record<string, unknown>
}) {
  if (!hasSupabaseAdminConfig()) return { enrolmentId: '', paymentId: '' }
  const supabase = createSupabaseAdminClient()
  const [user, programme, referral] = await Promise.all([
    findSupabaseUserByEmail(input.email),
    findSupabaseProgramme({ programCode: input.programCode, programmeSlug: input.programmeSlug, selectedTrackSlugs: input.selectedTrackSlugs }),
    input.referralCode ? resolveSupabaseReferral(input.referralCode).catch(() => null) : Promise.resolve(null),
  ])

  const { data: enrolment, error: enrolmentError } = await supabase
    .from('enrolments')
    .insert({
      user_id: user?.id || null,
      programme_id: programme?.id || null,
      track_id: programme?.trackId || null,
      status: 'PENDING_PAYMENT',
      referral_code_id: referral?.id || null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (enrolmentError || !enrolment) throw new Error(`Supabase enrolment initialization failed: ${enrolmentError?.message || 'No enrolment returned'}`)

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .upsert({
      user_id: user?.id || null,
      enrolment_id: enrolment.id,
      programme_id: programme?.id || null,
      referral_code_id: referral?.id || null,
      paystack_reference: input.reference,
      amount_ngn: input.amount,
      status: 'INITIALIZED',
      raw_payload: input.metadata,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'paystack_reference' })
    .select('id')
    .single()
  if (paymentError || !payment) throw new Error(`Supabase payment initialization failed: ${paymentError?.message || 'No payment returned'}`)

  return { enrolmentId: enrolment.id, paymentId: payment.id }
}

async function createApplication(body: Record<string, unknown>, contactId: string, programId: string | undefined, programCode: string, reference: string) {
  const isBusiness = programCode === 'BATP'
  const isComplete = programCode === 'COMPLETE'
  const selectedTrackNames = stringArray(body.selectedTrackNames)
    const selectedTrackLabel = selectedTrackNames.length > 1 ? `AI Income Accelerator Tracks: ${selectedTrackNames.join(', ')}` : selectedTrackNames[0] || (isComplete ? 'Complete' : isBusiness ? 'Business' : 'AI Income')
  return createRecord('NGTP Applications', compact({
    'Application ID': `APP-${Date.now()}`,
    Applicant: [contactId],
    ...(programId ? { 'Selected Programme': [programId] } : {}),
    'Application Program': programCode,
    'Application Track': selectedTrackLabel,
    'Application Stage': 'Submitted',
    'Submitted At': new Date().toISOString().slice(0, 10),
    'Career Vision': isBusiness ? text(body.growthGoals || body.learningGoals) : text(body.primaryGoal),
    'Professional Challenges': isBusiness || isComplete ? text(body.businessChallenges) : text(body.biggestChallenge),
    'Why NEXORA?': text(body.learningGoals || body.primaryGoal || body.message),
    'Problem-Solving Example': text(body.problemSolvingExample || body.currentTechnologyUsage || body.currentAIUsage),
    'Relevant Experience': text(body.relevantExperience || body.currentMarketing || selectedTrackNames.join(', ')),
    'Business Name': text(body.businessName),
    'Years in Business': Number(text(body.yearsInBusiness, 8)) || undefined,
    'Number of Employees': Number(text(body.numberOfEmployees, 8)) || undefined,
    'Monthly Customers': Number(text(body.monthlyCustomers, 8)) || undefined,
    'Business Challenges': text(body.businessChallenges),
    'Current Marketing': text(body.currentMarketing),
    'Current Technology Usage': text(body.currentTechnologyUsage || body.currentAIUsage),
    'Growth Goals': text(body.growthGoals || body.learningGoals),
    'Website Submission ID': reference,
    'Website Source URL': text(body.sourcePage, 200),
    'Communications Consent': true,
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fullName = text(body.fullName, 160)
    const email = text(body.email, 254).toLowerCase()
    const requestedCode = text(body.programCode, 20).toUpperCase()
    const programCode = requestedCode === 'BATP' ? 'BATP' : requestedCode === 'COMPLETE' ? 'COMPLETE' : 'NGTP'
    const selectedTrackSlugs = normalizeTrackSlugs(body.selectedTrackSlugs)
    const validCareerTracks = careerAcceleratorTracks.filter((track) => selectedTrackSlugs.includes(track.slug))
    const selectedTrackNames = validCareerTracks.length
      ? validCareerTracks.map((track) => track.title)
      : stringArray(body.selectedTrackNames)
    const careerPricing = programCode === 'NGTP'
      ? calculateCareerTrackPricing(validCareerTracks.map((track) => track.slug))
      : null
    const programmeSlug = text(body.programmeSlug, 120) || (programCode === 'BATP' ? 'business-transformation' : 'ai-income-accelerator')
    const checkoutPricing = calculateCheckoutPrice({ programme: programmeSlug, promoCode: text(body.promoCode, 80) })
    if (checkoutPricing.error) {
      return NextResponse.json({ error: checkoutPricing.error }, { status: 400 })
    }
    const amount = checkoutPricing.finalPrice
    const programName = text(body.programName, 160) || (programCode === 'COMPLETE' ? 'Complete AI Accelerator' : programCode === 'BATP' ? 'AI Business Transformation Programme' : selectedTrackNames.length > 1 ? `AI Income Accelerator Tracks (${selectedTrackNames.length})` : selectedTrackNames[0] || 'AI Income Accelerator')
    const sourcePage = text(body.sourcePage, 200)
    const referralCode = normalizeReferralCode(body.referralCode) || normalizeReferralCode(request.cookies.get('nexora_referral_code')?.value)
    const visitorId = text(body.visitorId, 160)
    const sessionId = text(body.sessionId, 160)
    const supabaseReferral = referralCode ? await resolveSupabaseReferral(referralCode).catch((error) => {
      console.error('Supabase referral resolution failed', error instanceof Error ? error.message : error)
      return null
    }) : null
    const ambassador = supabaseReferral ? null : await findAmbassador(referralCode).catch(() => null)
    const selectedCourse = programCode === 'NGTP'
      ? careerCourseBySlug(validCareerTracks[0]?.slug) || careerCourseByName(selectedTrackNames[0])
      : null
    const selectedProgrammeCode = programCode === 'NGTP' ? selectedCourse?.programmeCode || validCareerTracks[0]?.code || 'NGTP' : programCode
    const program = await findProgram(selectedProgrammeCode).catch(() => null)
    const referralOwnerFound = Boolean(supabaseReferral || ambassador)
    const commissionPercent = referralOwnerFound ? 15 : 0
    const l1CommissionAmount = referralOwnerFound ? commissionAmount(amount, 'L1') : 0
    const reference = `NEXORA-${programCode}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 })
    }
    if (programCode === 'NGTP' && !validCareerTracks.length) {
      return NextResponse.json({ error: 'Select a valid AI Income Accelerator track.' }, { status: 400 })
    }
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'A valid payment amount is required.' }, { status: 400 })
    }

    const supabaseCheckout = await createSupabaseCheckout({
      email,
      amount,
      reference,
      programCode,
      programmeSlug,
      selectedTrackSlugs: validCareerTracks.map((track) => track.slug),
      referralCode,
      metadata: {
        fullName,
        email,
        programCode,
        programName,
        selectedTrackNames,
        sourcePage,
        referralCode,
        amount,
      },
    }).catch((error) => {
      console.error('Checkout Supabase initialization failed', error instanceof Error ? error.message : error)
      return { enrolmentId: '', paymentId: '' }
    })

    const lead = await captureLead({
      ...body,
      email,
      fullName,
      platform: 'Website',
      programCode,
      programApplied: programCode,
      interestAreas: programCode === 'COMPLETE' ? ['Complete AI Accelerator', 'NGTP', 'BATP'] : programCode === 'BATP' ? ['BATP', 'Business AI Transformation'] : ['NGTP', 'AI Income Accelerator', ...selectedTrackNames],
      currentStatus: text(body.customerCategory, 80),
      primaryGoal: text(body.primaryGoal || body.learningGoals || body.growthGoals),
      biggestChallenge: text(body.biggestChallenge || body.businessChallenges),
      notes: [
        `Payment/application initialized for ${programCode}. Reference: ${reference}`,
        selectedTrackNames.length ? `Selected programmes: ${selectedTrackNames.join(', ')}` : '',
        `Pricing: list NGN ${checkoutPricing.listPrice}. Discount NGN ${checkoutPricing.discount}. Final NGN ${checkoutPricing.finalPrice}.`,
      ].filter(Boolean).join('\n'),
    }).catch((error) => {
      console.error('Checkout Airtable lead capture failed', error instanceof Error ? error.message : error)
      return null
    })

    const contactId = lead?.contact.id || ''
    const application = contactId
      ? await createApplication(body, contactId, program?.id, programCode, reference).catch((error) => {
        console.error('Checkout Airtable application capture failed', error instanceof Error ? error.message : error)
        return null
      })
      : null
    if (referralCode && supabaseReferral) {
      await recordSupabaseReferralEvent({
        referralCode,
        eventType: 'APPLICATION_STARTED',
        anonymousId: visitorId,
        sessionId,
        pageUrl: sourcePage,
      }).catch((error) => console.error('Application Supabase referral event failed', error instanceof Error ? error.message : error))
    }
    if (ambassador) {
      await createReferralEvent({
        referralCode,
        ambassadorId: ambassador.id,
        contactId,
        programmeId: program?.id,
        visitorId,
        sessionId,
        eventType: 'APPLICATION_STARTED',
        pageUrl: sourcePage,
      }).catch((error) => console.error('Application referral event failed', error instanceof Error ? error.message : error))
    }
    await notifyAdmin([
      'New NEXORA application initialized',
      `Name: ${fullName}`,
      `Email: ${email}`,
      `Program: ${programName} (${programCode})`,
      selectedTrackNames.length ? `Programme: ${selectedTrackNames.join(', ')}` : '',
      `Amount: NGN ${amount.toLocaleString()}`,
      `Lead score: ${lead?.contact.fields?.['Priority Score'] || 'Captured'}`,
      `Follow-up stage: Payment Initialized`,
      `AI summary: ${fullName} applied for ${programName}. Main goal: ${text(body.primaryGoal || body.learningGoals || body.growthGoals || 'Not provided', 240)}.`,
      `Reference: ${reference}`,
    ].filter(Boolean).join('\n'))

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      if (ambassador) {
        await createRecord('Ambassador Referrals', compact({
          'Referral ID': `REF-${Date.now()}`,
          Ambassador: [ambassador.id],
          ...(contactId ? { 'Referred Contact': [contactId] } : {}),
          ...(program ? { Programme: [program.id] } : {}),
          'Referral Code': referralCode,
          'Referral Date': new Date().toISOString().slice(0, 10),
          'Referral Status': 'Submitted',
          'Programme Fee': amount,
          'Commission Percent': commissionPercent,
          'Commission Amount': l1CommissionAmount,
          'Commission Status': 'Pending',
          'Source Page': sourcePage,
          'Payment Reference': reference,
          Notes: `${programCode} application captured before Paystack was configured.${selectedTrackNames.length ? ` Selected programmes: ${selectedTrackNames.join(', ')}` : ''}`,
        }))
      }
      return NextResponse.json({ error: `Online payment is not configured yet. Nexora has received your ${programCode} application interest.` }, { status: 503 })
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        currency: 'NGN',
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink'}/payment/success?reference=${reference}`,
        metadata: {
          full_name: fullName,
          phone: phone(body.phone),
          program: programName,
          program_code: programCode,
          selected_programme_code: selectedProgrammeCode,
          cohort: text(body.cohort, 160),
          source_page: sourcePage,
          referral_code: referralCode,
          ambassador_record_id: ambassador?.id || supabaseReferral?.partner_id || '',
          visitor_id: visitorId,
          session_id: sessionId,
          contact_record_id: contactId,
          application_record_id: application?.id || '',
          supabase_enrolment_id: supabaseCheckout.enrolmentId,
          supabase_payment_id: supabaseCheckout.paymentId,
          programme_record_id: program?.id || '',
          commission_percent: commissionPercent,
          commission_amount: l1CommissionAmount,
          list_price: checkoutPricing.listPrice,
          promo_code: checkoutPricing.promoCode,
          promo_discount: checkoutPricing.discount,
          final_price: checkoutPricing.finalPrice,
          selected_track_slugs: validCareerTracks.map((track) => track.slug).join(','),
          selected_tracks: selectedTrackNames.join(', '),
          track_count: selectedTrackNames.length,
          pricing_rule: careerPricing?.ruleName || text(body.trackBundleRule, 120),
          bundle_subtotal: checkoutPricing.listPrice,
          bundle_discount: checkoutPricing.discount,
          business_name: text(body.businessName, 180),
          business_industry: text(body.industry, 120),
          business_stage: text(body.businessStage, 120),
          staff_size: text(body.staffSize, 80),
          state: text(body.state, 120),
          website: text(body.website, 300),
        },
      }),
      cache: 'no-store',
    })
    const data = await response.json()
    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Paystack initialization failed')
    }

    await createRecord('Website Payment Events', compact({
      'Payment Reference': reference,
      'Full Name': fullName,
      Email: email,
      Phone: phone(body.phone),
      Program: programName,
      Cohort: text(body.cohort, 160),
      'Referral Code': referralCode,
      ...(ambassador ? { Ambassador: [ambassador.id] } : {}),
      'Commission Percent': commissionPercent,
      'Commission Amount': l1CommissionAmount,
      Amount: amount,
      Currency: 'NGN',
      'Payment Status': 'Initialized',
      'Paystack Authorization URL': data.data.authorization_url,
      'Paystack Access Code': data.data.access_code,
      'Source Page': sourcePage,
      'Date Submitted': new Date().toISOString(),
      'Raw Response': JSON.stringify({ paystack: data, selectedTracks: selectedTrackNames, pricing: checkoutPricing, visitorId, sessionId }).slice(0, 9000),
    })).catch((error) => console.error('Website payment event Airtable mirror failed', error instanceof Error ? error.message : error))

    if (referralCode && supabaseReferral) {
      await recordSupabaseReferralEvent({
        referralCode,
        eventType: 'CHECKOUT_STARTED',
        anonymousId: visitorId,
        sessionId,
        paymentReference: reference,
        pageUrl: sourcePage,
      }).catch((error) => console.error('Checkout Supabase referral event failed', error instanceof Error ? error.message : error))
    }

    if (ambassador) {
      await createReferralEvent({
        referralCode,
        ambassadorId: ambassador.id,
        contactId,
        programmeId: program?.id,
        visitorId,
        sessionId,
        eventType: 'CHECKOUT_STARTED',
        pageUrl: sourcePage,
      }).catch((error) => console.error('Checkout referral event failed', error instanceof Error ? error.message : error))

      await createRecord('Ambassador Referrals', compact({
        'Referral ID': `REF-${Date.now()}`,
        Ambassador: [ambassador.id],
        ...(contactId ? { 'Referred Contact': [contactId] } : {}),
        ...(program ? { Programme: [program.id] } : {}),
        'Referral Code': referralCode,
        'Referral Date': new Date().toISOString().slice(0, 10),
        'Referral Status': 'Submitted',
        'Programme Fee': amount,
        'Commission Percent': commissionPercent,
        'Commission Amount': l1CommissionAmount,
        'Commission Status': 'Pending',
        'Source Page': sourcePage,
        'Payment Reference': reference,
        Notes: `${programCode} website payment initialized through Paystack.${selectedTrackNames.length ? ` Selected programmes: ${selectedTrackNames.join(', ')}` : ''}`,
      })).catch((error) => console.error('Ambassador referral Airtable mirror failed', error instanceof Error ? error.message : error))
    }

    return NextResponse.json({ ok: true, authorizationUrl: data.data.authorization_url, reference })
  } catch (error) {
    console.error('Paystack initialization failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Payment could not be initialized. Please try again.' }, { status: 500 })
  }
}
