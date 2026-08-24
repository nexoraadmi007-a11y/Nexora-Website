import { NextRequest, NextResponse } from 'next/server'
import { authoritativeCourseQuote } from '@/lib/course-checkout'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAdminConfig()) return NextResponse.json({ error: 'Course pricing is temporarily unavailable.' }, { status: 503 })
    const body = await request.json()
    const quote = await authoritativeCourseQuote(createSupabaseAdminClient(), body.courseCodes)
    return NextResponse.json({ ...quote, courses: quote.courses.map(({ programme_code, name, price_ngn }) => ({ code: programme_code, name, price: price_ngn })) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not calculate payment total.' }, { status: 400 })
  }
}
