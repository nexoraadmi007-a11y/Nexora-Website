import { NextResponse } from 'next/server'
import { createSupabaseServerClient, hasSupabaseServerConfig } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST() {
  if (hasSupabaseServerConfig()) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
  }
  return NextResponse.json({ ok: true })
}
