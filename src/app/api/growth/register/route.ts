import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateGrowthId, growthAssociateAuthEmail, normalizeWhatsAppNumber, validateAssociatePassword } from '@/lib/growth-associate-auth'
import { getGrowthAssociateReferralUrl } from '@/lib/growth-associate-urls'
import { listPaystackBanks, resolvePaystackAccount, type PaystackBank } from '@/lib/paystack-bank'

export const runtime = 'nodejs'

const fallbackBanks: PaystackBank[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay Digital Services', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'UBA', code: '033' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
]

async function readBody(request: NextRequest) {
  const type = request.headers.get('content-type') || ''
  if (type.includes('application/json')) return { data: await request.json(), form: false }
  const form = await request.formData()
  return { data: Object.fromEntries(form.entries()), form: true }
}

function redirectWith(path: string, key: 'error' | 'message', value: string, request: NextRequest) {
  const url = new URL(path, request.url)
  url.searchParams.set(key, value)
  return NextResponse.redirect(url, 303)
}

function readableError(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error) {
    const maybe = error as { message?: unknown; error_description?: unknown; code?: unknown }
    const message = typeof maybe.message === 'string' ? maybe.message : typeof maybe.error_description === 'string' ? maybe.error_description : ''
    const code = typeof maybe.code === 'string' ? maybe.code : ''
    return message || code || 'Registration failed. Please try again.'
  }
  return 'Registration failed. Please try again.'
}

async function availableBanks() {
  try {
    const banks = await listPaystackBanks()
    return banks.length ? banks : fallbackBanks
  } catch (error) {
    console.warn('Paystack bank list unavailable; using fallback banks', readableError(error))
    return fallbackBanks
  }
}

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null
  let createdPartnerId: string | null = null
  const db = createSupabaseAdminClient()
  const parsed = await readBody(request)
  try {
    const body = parsed.data
    const fullName = String(body.fullName || '').trim().replace(/\s+/g, ' ')
    const phone = normalizeWhatsAppNumber(String(body.whatsapp || ''))
    const accountName = String(body.accountName || '').trim()
    const bankCode = String(body.bankCode || '').trim()
    const accountNumber = String(body.accountNumber || '').replace(/\D/g, '')
    const password = String(body.password || '')
    validateAssociatePassword(password, String(body.confirmPassword || ''))
    if (fullName.length < 3 || accountName.length < 3) throw new Error('Enter your full name and account name.')

    const existing = await db.from('partners').select('id').eq('whatsapp_normalized', phone).maybeSingle()
    if (existing.error) throw existing.error
    if (existing.data) {
      const message = 'An account already exists for this WhatsApp number. Please sign in.'
      if (parsed.form) return redirectWith('/growth/login', 'message', message, request)
      return NextResponse.json({ ok: false, message }, { status: 409 })
    }

    const banks = await availableBanks()
    const bank = banks.find((item) => item.code === bankCode)
    if (!bank) throw new Error('Select a valid bank.')
    if (!/^\d{10}$/.test(accountNumber)) throw new Error('Enter a valid 10-digit account number.')

    let verified: { accountName: string; status: string; score: number; accountNumberLastFour: string } | null = null
    try {
      verified = await resolvePaystackAccount({ accountNumber, bankCode, profileName: accountName })
      if (verified.status === 'MISMATCH') throw new Error('The account name does not match the bank account. Please check it and try again.')
    } catch (error) {
      const message = readableError(error)
      if (message.includes('does not match')) throw error
      console.warn('Paystack account resolution unavailable; payout details will need review', { bankCode, reason: message })
    }

    const growthId = await generateGrowthId(db)
    const created = await db.auth.admin.createUser({
      email: growthAssociateAuthEmail(phone),
      password,
      email_confirm: true,
      app_metadata: { role: 'growth_associate' },
      user_metadata: { full_name: fullName, whatsapp: phone },
    })
    if (created.error || !created.data.user) throw created.error || new Error('Account creation failed.')
    createdUserId = created.data.user.id

    const partnerInsert = await db.from('partners').insert({ user_id: createdUserId, partner_id: growthId, full_name: fullName, email: null, whatsapp: phone, whatsapp_normalized: phone, status: 'ACTIVE' }).select('id').single()
    if (partnerInsert.error) throw partnerInsert.error
    const partnerId = partnerInsert.data.id
    createdPartnerId = partnerId

    const referralInsert = await db.from('referral_codes').insert({ partner_id: partnerId, code: growthId, referral_url: getGrowthAssociateReferralUrl(growthId), active: true })
    if (referralInsert.error) throw referralInsert.error

    const bankInsert = await db.from('partner_bank_accounts').insert({
      partner_id: partnerId,
      profile_name: fullName,
      bank_name: bank.name,
      bank_code: bankCode,
      account_number_last_four: accountNumber.slice(-4),
      account_name: verified?.accountName || accountName,
      verification_status: verified?.status === 'MATCH' ? 'VERIFIED' : 'MANUAL_REVIEW',
      name_match_score: verified?.score ?? null,
      verified_at: verified?.status === 'MATCH' ? new Date().toISOString() : null,
    })
    if (bankInsert.error) throw bankInsert.error

    const message = 'Account created. Please sign in with your WhatsApp number and password.'
    if (parsed.form) return redirectWith('/growth/login', 'message', message, request)
    return NextResponse.json({ ok: true, growthId, bankVerificationPending: verified?.status !== 'MATCH' })
  } catch (error) {
    if (createdPartnerId) await db.from('partners').delete().eq('id', createdPartnerId)
    if (createdUserId) await db.auth.admin.deleteUser(createdUserId)
    const message = readableError(error)
    console.error('Growth Associate registration failed', { message })
    if (parsed.form) return redirectWith('/growth/register', 'error', message, request)
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }
}