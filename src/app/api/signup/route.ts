import { NextRequest, NextResponse } from 'next/server'
import { captureLead, phone, text } from '@/lib/lead-capture'
import { sendTelegramMessage } from '@/lib/telegram'
import { createRecord, escapeFormula, listRecords } from '@/lib/airtable'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { cleanReferralCode, recordSupabaseReferralEvent } from '@/lib/supabase-referrals'

export const runtime = 'nodejs'

type SignupPayload = Record<string, unknown>

function normalizeReferralCode(value: unknown) {
  return cleanReferralCode(value)
}

function hasValidPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value)
}

async function notifyAdmin(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Signup Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

async function findAmbassador(referralCode: string) {
  if (!referralCode) return null
  const records = await listRecords<Record<string, any>>('Ambassadors', {
    formula: `LOWER({Referral Code})='${escapeFormula(referralCode.toLowerCase())}'`,
    maxRecords: 1,
  }).catch(() => [])
  return records[0] || null
}

async function createReferralRegistrationEvent(input: { referralCode: string; ambassadorId: string; contactId?: string; sourcePage: string }) {
  await createRecord('Referral Events', {
    'Referral Event ID': `REVT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    'Referral Code': input.referralCode,
    Associate: [input.ambassadorId],
    ...(input.contactId ? { Lead: [input.contactId] } : {}),
    'Event Type': 'REGISTRATION_COMPLETED',
    'Page URL': input.sourcePage,
    'Occurred At': new Date().toISOString(),
  }).catch((error) => console.error('Signup referral event failed', error instanceof Error ? error.message : error))
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupPayload
    const fullName = text(body.fullName, 160)
    const email = text(body.email, 254).toLowerCase()
    const whatsapp = phone(body.whatsAppNumber || body.whatsapp)
    const country = text(body.country, 80)
    const password = text(body.password, 200)
    const referralCode = normalizeReferralCode(body.referralCode) || normalizeReferralCode(request.cookies.get('nexora_referral_code')?.value)

    if (!fullName || !email || !whatsapp || !country || !password) {
      return NextResponse.json({ error: 'Full name, email, WhatsApp number, country, and password are required.' }, { status: 400 })
    }

    if (!hasValidPassword(password)) {
      return NextResponse.json({ error: 'Password must contain at least 8 characters, including a letter and a number.' }, { status: 400 })
    }

    let supabaseUserId = text(body.supabaseUserId, 80)
    let supabaseNotice = ''

    if (hasSupabaseAdminConfig()) {
      const supabase = createSupabaseAdminClient()
      const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          whatsapp,
          country,
          referral_code: referralCode,
        },
      })

      if (createUserError) {
        if (/already registered|already been registered|already exists/i.test(createUserError.message)) {
          const { data: users, error: lookupError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
          if (lookupError) throw new Error(`Supabase account lookup failed: ${lookupError.message}`)
          const matchedUser = users?.users.find((user) => user.email?.toLowerCase() === email)
          if (!matchedUser) throw new Error('This email is already registered. Please log in instead.')
          supabaseUserId = matchedUser.id
          supabaseNotice = 'Existing Nexora account found. Referral details were refreshed.'
        } else {
          throw new Error(`Supabase account creation failed: ${createUserError.message}`)
        }
      } else {
        supabaseUserId = createdUser.user?.id || ''
      }

      if (supabaseUserId) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: supabaseUserId,
          full_name: fullName,
          email,
          whatsapp,
          country,
          role: 'learner',
          signup_referral_code: referralCode || null,
          signup_referral_source: referralCode ? 'signup' : null,
          signup_referral_captured_at: referralCode ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        if (profileError) throw new Error(`Supabase profile save failed: ${profileError.message}`)
      }
    }

    let contactId = ''
    const lead = await captureLead({
      platform: 'Website',
      sourcePage: '/signup',
      fullName,
      email,
      phone: whatsapp,
      whatsAppNumber: whatsapp,
      location: country,
      currentStatus: 'Professional',
      interestAreas: ['Career Accelerator'],
      primaryGoal: 'Create Nexora Institute account',
      notes: `Signup intent captured from the V2 public account page.${referralCode ? ` Referral code: ${referralCode}.` : ''}`,
    }).catch((error) => {
      console.error('Signup Airtable lead capture failed', error instanceof Error ? error.message : error)
      return null
    })
    contactId = lead?.contact.id || ''

    if (referralCode) {
      await recordSupabaseReferralEvent({
        referralCode,
        eventType: 'REGISTRATION_COMPLETED',
        userId: supabaseUserId || undefined,
        pageUrl: '/signup',
      }).catch((error) => console.error('Signup Supabase referral event failed', error instanceof Error ? error.message : error))

      const ambassador = await findAmbassador(referralCode)
      if (ambassador) {
        await createReferralRegistrationEvent({
          referralCode,
          ambassadorId: ambassador.id,
          contactId,
          sourcePage: '/signup',
        })
      }
    }

    notifyAdmin([
      'New Nexora Institute account signup request',
      `Name: ${fullName}`,
      `Email: ${email}`,
      `WhatsApp: ${whatsapp}`,
      `Country: ${country}`,
      referralCode ? `Referral Code: ${referralCode}` : '',
    ].filter(Boolean).join('\n')).catch(() => undefined)

    return NextResponse.json({
      ok: true,
      message: supabaseNotice || 'Account created successfully. You can now log in.',
      referralCode,
    }, { status: 201 })
  } catch (error) {
    console.error('Signup request failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'We could not process the account request. Please try again.' }, { status: 500 })
  }
}
