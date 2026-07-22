import { NextRequest, NextResponse } from 'next/server'
import { getGrowthOverview, upsertMonthlyPerformance } from '@/lib/growth-operations'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected
}

function month(value: string | null) {
  return value && /^\d{4}-\d{2}$/.test(value) ? value : undefined
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const overview = await getGrowthOverview(month(searchParams.get('month')))
    return NextResponse.json(overview)
  } catch (error) {
    console.error('Growth performance load failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Growth performance could not be loaded.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({})) as { month?: string; persist?: boolean }
    const overview = await getGrowthOverview(month(body.month || null))
    if (body.persist) await upsertMonthlyPerformance(overview)
    return NextResponse.json({ ok: true, persisted: Boolean(body.persist), overview })
  } catch (error) {
    console.error('Growth performance calculation failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Growth performance could not be calculated.' }, { status: 500 })
  }
}
