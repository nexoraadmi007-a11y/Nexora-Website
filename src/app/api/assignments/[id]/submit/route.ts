import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createSupabaseServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
  const body = await request.json()
  const submissionText = typeof body.submissionText === 'string' ? body.submissionText.trim().slice(0, 10000) : ''
  const submissionUrl = typeof body.submissionUrl === 'string' ? body.submissionUrl.trim().slice(0, 1000) : ''
  if (!submissionText && !submissionUrl) return NextResponse.json({ error: 'Add a submission note or link.' }, { status: 400 })
  const { error } = await db.from('assignment_submissions').upsert({ assignment_id: id, user_id: user.id, submission_text: submissionText || null, submission_url: submissionUrl || null, status: 'SUBMITTED', submitted_at: new Date().toISOString() }, { onConflict: 'assignment_id,user_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
