import { NextRequest, NextResponse } from 'next/server'
import { resolvePaystackAccount } from '@/lib/paystack-bank'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const profileName = text(body.profileName, 180)
    const email = text(body.email, 254).toLowerCase()
    const bankName = text(body.bankName, 160)
    const bankCode = text(body.bankCode, 40)
    const accountNumber = text(body.accountNumber, 40).replace(/\D/g, '')

    if (!profileName || !bankName || !bankCode || !accountNumber) {
      return NextResponse.json({ ok: false, error: 'BANK_DETAILS_REQUIRED', message: 'Profile name, bank and account number are required.' }, { status: 400 })
    }

    const resolved = await resolvePaystackAccount({ profileName, bankCode, accountNumber })
    let partnerId: string | null = null
    let profileId: string | null = null

    if (hasSupabaseAdminConfig()) {
      const supabase = createSupabaseAdminClient()
      if (email) {
        const partnerLookup = await supabase
          .from('partners')
          .select('id, user_id')
          .eq('email', email)
          .maybeSingle()
        if (partnerLookup.error) throw new Error(`Partner lookup failed: ${partnerLookup.error.message}`)
        partnerId = partnerLookup.data?.id || null
        profileId = partnerLookup.data?.user_id || null
      }

      const { error } = await supabase.from('partner_bank_accounts').insert({
        partner_id: partnerId,
        profile_id: profileId,
        email: email || null,
        profile_name: profileName,
        bank_name: bankName,
        bank_code: bankCode,
        account_number_last_four: resolved.accountNumberLastFour,
        account_name: resolved.accountName,
        verification_status: resolved.status,
        name_match_score: resolved.score,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (error) throw new Error(`Bank verification save failed: ${error.message}`)
    }

    return NextResponse.json({
      ok: true,
      bank: {
        bankName,
        bankCode,
        accountNumberLastFour: resolved.accountNumberLastFour,
        accountName: resolved.accountName,
        verificationStatus: resolved.status,
        nameMatchScore: resolved.score,
      },
      message: resolved.status === 'VERIFIED'
        ? 'Bank account verified successfully.'
        : resolved.status === 'POSSIBLE_MATCH'
          ? 'Account resolved, but the name needs admin review before payout.'
          : 'Account resolved, but the name does not match your profile closely enough.',
    })
  } catch (error) {
    console.error('Partner bank verification failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'BANK_VERIFICATION_FAILED', message: error instanceof Error ? error.message : 'Bank verification failed.' }, { status: 500 })
  }
}
