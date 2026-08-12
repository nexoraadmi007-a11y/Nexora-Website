import { NextRequest, NextResponse } from 'next/server'
import { getPartnerDashboard } from '@/lib/partner-system'

export const runtime = 'nodejs'

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboard = await getPartnerDashboard({
      email: text(searchParams.get('email'), 254),
      referralCode: text(searchParams.get('code'), 120),
    })
    if (!dashboard) return NextResponse.json({ error: 'Partner profile was not found. Activate your partner profile first.' }, { status: 404 })
    return NextResponse.json({ ok: true, ...dashboard })
  } catch (error) {
    console.error('Partner dashboard failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Partner dashboard could not be loaded.' }, { status: 500 })
  }
}
