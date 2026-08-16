import { NextRequest, NextResponse } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase/middleware'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'

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
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/setup') && !pathname.startsWith('/admin/access-denied')) {
    const session = await verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
    if (!session) return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  return nextResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|nexora-mark.png).*)'],
}
