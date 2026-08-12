import { NextRequest, NextResponse } from 'next/server'
import { listRecords } from '@/lib/airtable'

export const runtime = 'nodejs'

function authorized(request: NextRequest) {
  const expected = process.env.GROWTH_ADMIN_SECRET || process.env.CRON_SECRET || process.env.TELEGRAM_QUEUE_SECRET || ''
  if (!expected) return false
  return request.headers.get('x-nexora-admin-secret') === expected || request.headers.get('x-nexora-secret') === expected
}

async function checkAirtable() {
  if (!process.env.AIRTABLE_TOKEN) return { status: 'FAILED', detail: 'AIRTABLE_TOKEN missing' }
  await listRecords('Programmes', { maxRecords: 1 })
  return { status: 'HEALTHY', detail: 'Programmes table readable' }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const checks: Record<string, { status: string; detail: string }> = {
    database: { status: 'DEGRADED', detail: 'No first-party SQL database configured; Airtable is the current operational store.' },
    paystack: { status: process.env.PAYSTACK_SECRET_KEY ? 'HEALTHY' : 'FAILED', detail: process.env.PAYSTACK_SECRET_KEY ? 'Secret configured' : 'PAYSTACK_SECRET_KEY missing' },
    telegram: { status: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID ? 'HEALTHY' : 'DEGRADED', detail: 'Bot token and admin chat ID required' },
    openai: { status: process.env.OPENAI_API_KEY ? 'HEALTHY' : 'DEGRADED', detail: process.env.OPENAI_API_KEY ? 'Configured' : 'OPENAI_API_KEY missing' },
    storage: { status: 'DEGRADED', detail: 'No dedicated production object storage variable detected in this app.' },
    domain: { status: process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://www.nexoragroup.ink') ? 'HEALTHY' : 'DEGRADED', detail: process.env.NEXT_PUBLIC_SITE_URL || 'NEXT_PUBLIC_SITE_URL missing' },
    backgroundJobs: { status: process.env.CRON_SECRET ? 'HEALTHY' : 'DEGRADED', detail: 'Render cron configured in render.yaml; CRON_SECRET required at runtime' },
  }

  try {
    checks.airtable = await checkAirtable()
  } catch (error) {
    checks.airtable = { status: 'FAILED', detail: error instanceof Error ? error.message : 'Airtable check failed' }
  }

  return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), checks })
}
