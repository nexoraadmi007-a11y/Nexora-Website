import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await createSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ authenticated: false })
  if (user.app_metadata?.role === 'growth_associate') {
    return NextResponse.json({ authenticated: false, associateSession: true })
  }
  const { data: profile } = await createSupabaseAdminClient().from('profiles').select('full_name,email,whatsapp,signup_referral_code').eq('id', user.id).maybeSingle()
  return NextResponse.json({ authenticated: true, identity: { fullName: profile?.full_name || user.user_metadata?.full_name || '', email: profile?.email || user.email || '', whatsapp: profile?.whatsapp || user.user_metadata?.whatsapp || '', referralCode: profile?.signup_referral_code || '' } })
}
