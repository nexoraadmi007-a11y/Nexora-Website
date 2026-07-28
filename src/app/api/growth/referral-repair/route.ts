import { NextRequest, NextResponse } from 'next/server'
import { repairMissingAssociateReferrals } from '@/lib/referral-repair'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected || request.headers.get('x-nexora-secret') === expected
}

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const result = await repairMissingAssociateReferrals({
      dryRun: body.apply ? false : true,
      associateId: text(body.associateId, 120),
      actor: text(body.actor, 120) || 'growth-admin',
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Referral repair failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Referral repair failed.' }, { status: 500 })
  }
}

