import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSupabaseSession } from '@/lib/supabase/middleware'

const adminRoles = new Set(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN', 'FINANCE_ADMIN', 'TALENT_ADMIN', 'SUPPORT_ADMIN'])
const bootstrapAdminEmails = new Set(
  (process.env.NEXORA_BOOTSTRAP_ADMIN_EMAILS || 'admin@nexoragroup.ink,nexoraadmi007@gmail.com')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
)

async function adminRoleFor(user: { id: string; email?: string | null }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) return null
  const headers = {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    'Content-Type': 'application/json',
  }
  const roleUrl = `${url}/rest/v1/admin_roles?select=role,status&user_id=eq.${encodeURIComponent(user.id)}&status=eq.ACTIVE`
  const response = await fetch(roleUrl, { headers, cache: 'no-store' })
  const roles = response.ok ? await response.json() as Array<{ role?: string; status?: string }> : []
  const role = roles.find((item) => item.role && adminRoles.has(item.role))?.role
  if (role) return role

  const email = (user.email || '').toLowerCase()
  if (!bootstrapAdminEmails.has(email)) return null
  const insertResponse = await fetch(`${url}/rest/v1/admin_roles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: user.id, role: 'SUPER_ADMIN', status: 'ACTIVE' }),
    cache: 'no-store',
  })
  if (!insertResponse.ok && insertResponse.status !== 409) return null
  return 'SUPER_ADMIN'
}

async function getMiddlewareUser(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data } = await supabase.auth.getUser()
  return data.user || null
}

export async function middleware(request: NextRequest) {
  const referralCode = request.nextUrl.searchParams.get('ref')?.trim()
  const response = NextResponse.next()
  if (referralCode) {
    response.cookies.set('nexora_referral_code', referralCode, {
      httpOnly: false,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    response.cookies.set('nexora_referral_seen_at', new Date().toISOString(), {
      httpOnly: false,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
  }
  const nextResponse = await updateSupabaseSession(request, response)
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/access-denied')) {
    const user = await getMiddlewareUser(request, nextResponse)
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    const role = await adminRoleFor(user)
    if (!role) return NextResponse.redirect(new URL('/admin/access-denied', request.url))
  }
  return nextResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|nexora-mark.png).*)'],
}
