import { NextRequest, NextResponse } from 'next/server'
import { ensureAssociateReferral, getGrowthSystemHealth } from '@/lib/referral-repair'
import { escapeFormula, listRecords } from '@/lib/airtable'

export const runtime = 'nodejs'

type Fields = Record<string, any>

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

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    return NextResponse.json(await getGrowthSystemHealth())
  } catch (error) {
    console.error('System health failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'System health check failed.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const action = text(body.action, 80)
    const associateId = text(body.associateId, 120)
    if (action !== 'generate_missing_referral') return NextResponse.json({ error: 'Unsupported system-health action.' }, { status: 400 })
    if (!associateId) return NextResponse.json({ error: 'associateId is required.' }, { status: 400 })
    const associate = (await listRecords<Fields>('Ambassadors', {
      formula: `RECORD_ID()='${escapeFormula(associateId)}'`,
      maxRecords: 1,
    }))[0]
    if (!associate) return NextResponse.json({ error: 'Associate was not found.' }, { status: 404 })
    const result = await ensureAssociateReferral(associate, {
      dryRun: false,
      actor: text(body.actor, 120) || 'growth-admin',
      reason: text(body.reason) || 'Manual system health repair.',
    })
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error('System health action failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'System health action failed.' }, { status: 500 })
  }
}

