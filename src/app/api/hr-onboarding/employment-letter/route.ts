import { NextRequest, NextResponse } from 'next/server'
import { text } from '@/lib/growth-associate'
import { employmentLetterHtml, findAssociateByToken, getLatestHrProfile } from '@/lib/hr-onboarding'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token = text(url.searchParams.get('token') || '', 300)
  const associate = token ? await findAssociateByToken(token) : null
  if (!associate) return NextResponse.json({ error: 'Invalid or expired onboarding link.' }, { status: 401 })
  const profile = await getLatestHrProfile(associate.id)
  return new NextResponse(employmentLetterHtml({
    associate,
    profile,
    startDate: text(url.searchParams.get('startDate') || '', 40),
    workMode: text(url.searchParams.get('workMode') || '', 80),
  }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
