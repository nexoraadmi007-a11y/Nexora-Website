import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await createSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await request.formData()
  const clean = (key: string, max = 160) => String(form.get(key) || '').trim().slice(0, max) || null
  const db = createSupabaseAdminClient()
  let { data: partner } = await db.from('partners').select('id,user_id,email').eq('user_id', user.id).maybeSingle()
  if (!partner && user.email) partner = (await db.from('partners').select('id,user_id,email').ilike('email', user.email).maybeSingle()).data
  if (!partner || (partner.user_id && partner.user_id !== user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await db.from('partners').update({ user_id: user.id, whatsapp: clean('whatsapp', 40), gender: clean('gender', 40), institution: clean('institution'), field_of_study: clean('field_of_study'), graduation_information: clean('graduation_information', 300), nysc_information: clean('nysc_information', 300), location: clean('location'), date_of_birth: clean('date_of_birth', 10), telegram_username: clean('telegram_username', 120), updated_at: new Date().toISOString() }).eq('id', partner.id).throwOnError()
  return NextResponse.redirect(new URL('/growth-associate#profile', request.url), 303)
}
