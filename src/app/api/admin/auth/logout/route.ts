import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions } from '@/lib/admin-session'

export async function POST() {
  const response = NextResponse.json({ ok: true, redirectTo: '/admin/login' })
  response.cookies.set(ADMIN_SESSION_COOKIE, '', adminSessionCookieOptions(0))
  return response
}
