import { NextRequest, NextResponse } from 'next/server'
import { growthAssociateAuthEmail, normalizeWhatsAppNumber } from '@/lib/growth-associate-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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

export async function POST(request: NextRequest) {
  const parsed = await readBody(request)
  try {
    const body = parsed.data
    const phone = normalizeWhatsAppNumber(String(body.whatsapp || ''))
    const auth = await createSupabaseServerClient()
    const result = await auth.auth.signInWithPassword({ email: growthAssociateAuthEmail(phone), password: String(body.password || '') })
    if (result.error || !result.data.user) throw new Error('Incorrect WhatsApp number or password.')
    const { data: partner } = await createSupabaseAdminClient().from('partners').select('id,status').eq('user_id', result.data.user.id).maybeSingle()
    if (!partner || partner.status !== 'ACTIVE') {
      await auth.auth.signOut()
      throw new Error('This Growth Associate account is not active.')
    }
    if (parsed.form) return NextResponse.redirect(new URL('/growth-associate', request.url), 303)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed.'
    if (parsed.form) return redirectWith('/growth/login', 'error', message, request)
    return NextResponse.json({ ok: false, message }, { status: 401 })
  }
}
