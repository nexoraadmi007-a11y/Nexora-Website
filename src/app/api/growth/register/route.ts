import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { generateGrowthId, normalizeWhatsAppNumber, validateAssociatePassword } from '@/lib/growth-associate-auth'
import { getGrowthAssociateReferralUrl } from '@/lib/growth-associate-urls'
import { listPaystackBanks, resolvePaystackAccount } from '@/lib/paystack-bank'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null
  let createdPartnerId: string | null = null
  const db = createSupabaseAdminClient()
  try {
    const body = await request.json()
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
    if (existing.data) return NextResponse.json({ ok: false, message: 'An account already exists for this WhatsApp number. Please sign in.' }, { status: 409 })

    const banks = await listPaystackBanks()
    const bank = banks.find((item) => item.code === bankCode)
    if (!bank) throw new Error('Select a valid bank.')
    if (!/^\d{10}$/.test(accountNumber)) throw new Error('Enter a valid 10-digit account number.')
    let verified: { accountName: string; status: string; score: number; accountNumberLastFour: string } | null = null
    try {
      verified = await resolvePaystackAccount({ accountNumber, bankCode, profileName: accountName })
      if (verified.status === 'MISMATCH') throw new Error('The account name does not match the bank account. Please check it and try again.')
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('does not match')) throw error
      console.warn('Paystack account resolution unavailable; payout details were not activated', { bankCode, reason: message })
    }

    const growthId = await generateGrowthId(db)
    const created = await db.auth.admin.createUser({
      phone,
      password,
      phone_confirm: true,
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
    if (verified) {
      const bankInsert = await db.from('partner_bank_accounts').insert({ partner_id: partnerId, profile_name: fullName, bank_name: bank.name, bank_code: bankCode, account_number_last_four: verified.accountNumberLastFour, account_name: verified.accountName, verification_status: verified.status === 'MATCH' ? 'VERIFIED' : 'MANUAL_REVIEW', name_match_score: verified.score, verified_at: verified.status === 'MATCH' ? new Date().toISOString() : null })
      if (bankInsert.error) throw bankInsert.error
    }

    const auth = await createSupabaseServerClient()
    const login = await auth.auth.signInWithPassword({ phone, password })
    if (login.error) throw login.error
    return NextResponse.json({ ok: true, growthId, bankVerificationPending: !verified })
  } catch (error) {
    if (createdPartnerId) await db.from('partners').delete().eq('id', createdPartnerId)
    if (createdUserId) await db.auth.admin.deleteUser(createdUserId)
    const message = error instanceof Error ? error.message : 'Registration failed. Please try again.'
    console.error('Growth Associate registration failed', message)
    return NextResponse.json({ ok: false, message }, { status: 400 })
  }
}
