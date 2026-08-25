import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { publicSiteUrl } from '@/lib/growth-associate-urls'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.redirect(new URL(`/growth-associate/login?associate=${encodeURIComponent(id)}`, publicSiteUrl()))
  const db = createSupabaseAdminClient()
  const { data: partner } = await db.from('partners').select('id,user_id,email,status').eq('partner_id', id).maybeSingle()
  if (!partner || partner.status !== 'ACTIVE' || (partner.user_id && partner.user_id !== user.id) || (!partner.user_id && partner.email?.toLowerCase() !== user.email?.toLowerCase())) {
    return NextResponse.redirect(new URL('/growth-associate/login?error=unauthorized', publicSiteUrl()))
  }
  if (!partner.user_id) await db.from('partners').update({ user_id: user.id }).eq('id', partner.id)
  return NextResponse.redirect(new URL('/growth-associate', publicSiteUrl()))
}
