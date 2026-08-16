import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { adminRoles, isAdminRole } from '@/lib/admin-auth'
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions, createAdminSessionToken } from '@/lib/admin-session'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : ''
    const password = typeof body.password === 'string' ? body.password.slice(0, 200) : ''
    const remember = body.remember === true
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!email || !password) return NextResponse.json({ error: 'Enter your admin email and password.' }, { status: 400 })
    if (!url || !anonKey || !hasSupabaseAdminConfig()) {
      return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 })
    }

    const auth = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await auth.auth.signInWithPassword({ email, password })
    if (error || !data.user) return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 })

    const admin = createSupabaseAdminClient()
    const { data: roles, error: roleError } = await admin
      .from('admin_roles')
      .select('role, status')
      .eq('user_id', data.user.id)
      .eq('status', 'ACTIVE')
    const role = roles?.find((item) => isAdminRole(item.role))?.role
    if (roleError || !role || !adminRoles.includes(role)) {
      await auth.auth.signOut().catch(() => undefined)
      return NextResponse.json({ error: 'This account does not have active administrator access.' }, { status: 403 })
    }

    const maxAge = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 8
    const token = await createAdminSessionToken({ userId: data.user.id, email, role }, maxAge)
    const response = NextResponse.json({ ok: true, redirectTo: '/admin' })
    response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions(maxAge))
    await Promise.all([
      admin.from('admin_roles').update({ last_login_at: new Date().toISOString() }).eq('user_id', data.user.id).eq('role', role),
      admin.from('admin_audit_logs').insert({ admin_user_id: data.user.id, admin_email: email, action: 'ADMIN_LOGIN', entity: 'admin_session', entity_id: data.user.id }),
      auth.auth.signOut(),
    ]).catch(() => undefined)
    return response
  } catch (error) {
    console.error('Admin login failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Admin sign in failed.' }, { status: 500 })
  }
}
