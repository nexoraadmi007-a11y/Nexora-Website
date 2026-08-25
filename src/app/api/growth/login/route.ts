import { NextRequest, NextResponse } from 'next/server'
import { growthAssociateAuthEmail, normalizeWhatsAppNumber } from '@/lib/growth-associate-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const phone = normalizeWhatsAppNumber(String(body.whatsapp || ''))
    const auth = await createSupabaseServerClient()
    const result = await auth.auth.signInWithPassword({ email: growthAssociateAuthEmail(phone), password: String(body.password || '') })
    if (result.error || !result.data.user) throw new Error('Incorrect WhatsApp number or password.')
    const { data: partner } = await createSupabaseAdminClient().from('partners').select('id,status').eq('user_id', result.data.user.id).maybeSingle()
    if (!partner || partner.status !== 'ACTIVE') {
      await auth.auth.signOut()
      throw new Error('This Growth Associate account is not active.')
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Sign in failed.' }, { status: 401 })
  }
}
