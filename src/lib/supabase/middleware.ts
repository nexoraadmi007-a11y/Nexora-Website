import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const SESSION_REFRESH_TIMEOUT_MS = 1800

export async function updateSupabaseSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return response

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

  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((resolve) => setTimeout(resolve, SESSION_REFRESH_TIMEOUT_MS)),
    ])
  } catch (error) {
    console.warn('Supabase session refresh skipped in middleware', error instanceof Error ? error.message : error)
  }

  return response
}