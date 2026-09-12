import { NextRequest, NextResponse } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase/middleware'

const protectedSupabasePrefixes = ['/app', '/growth-associate', '/associate']

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
}

function needsSupabaseSessionRefresh(pathname: string) {
  return protectedSupabasePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
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

  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/admin')) return response
  if (!needsSupabaseSessionRefresh(pathname)) return response
  if (!hasSupabaseAuthCookie(request)) return response

  return updateSupabaseSession(request, response)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|nexora-mark.png).*)'],
}