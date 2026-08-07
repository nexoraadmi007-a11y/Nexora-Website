import { NextRequest, NextResponse } from 'next/server'
import { businessLeadHealthSummary, runBusinessDiscoveryForAdminTest } from '@/lib/business-lead-discovery'
import { sendAdminBusinessLeadPreview } from '@/lib/telegram-admin-test'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected || request.headers.get('x-nexora-secret') === expected
}

function enabled(name: string, fallback: boolean) {
  const raw = process.env[name]
  if (!raw) return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  return NextResponse.json({
    engine: 'Lead Generation Health',
    leadDiscoveryScheduler: 'MANUAL_AND_RENDER_CRON_CONFIGURED',
    businessDiscovery: enabled('ENABLE_BUSINESS_LEAD_DISCOVERY', true) ? 'ENABLED' : 'DISABLED',
    individualDiscovery: enabled('ENABLE_INDIVIDUAL_LEAD_DISCOVERY', false) ? 'ENABLED' : 'DISABLED',
    associateLeadDelivery: enabled('ENABLE_ASSOCIATE_LEAD_DELIVERY', false) ? 'ENABLED' : 'DISABLED',
    adminLeadTestDelivery: enabled('ENABLE_ADMIN_LEAD_TEST_DELIVERY', true) ? 'ENABLED' : 'DISABLED',
    apifyConfigured: Boolean(process.env.APIFY_API_TOKEN),
    telegramAdminConfigured: Boolean(process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_USER_ID),
    lastError: '',
  })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const action = typeof body.action === 'string' ? body.action : 'dry_run'
  const count = Math.min(Math.max(Number(body.count || 5), 1), 10)

  if (!enabled('ENABLE_BUSINESS_LEAD_DISCOVERY', true)) {
    return NextResponse.json({ error: 'Business lead discovery is disabled.', code: 'API_CONFIGURATION_MISSING' }, { status: 403 })
  }
  if (enabled('ENABLE_ASSOCIATE_LEAD_DELIVERY', false)) {
    return NextResponse.json({ error: 'Associate lead delivery must remain disabled during admin testing.', code: 'TELEGRAM_DELIVERY_FAILED' }, { status: 409 })
  }

  if (action === 'send_admin_test') {
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_USER_ID || ''
    if (!chatId) return NextResponse.json({ error: 'Admin Telegram ID is not configured.', code: 'TELEGRAM_DELIVERY_FAILED' }, { status: 500 })
    const result = await sendAdminBusinessLeadPreview({ chatId, telegramUserId: chatId, count })
    return NextResponse.json({ ok: true, mode: 'ADMIN_TEST_ONLY', sent: result.sent })
  }

  const result = await runBusinessDiscoveryForAdminTest({ requestedCount: count, rawLimit: 10, store: action !== 'dry_run' })
  return NextResponse.json({ ok: result.ok, health: businessLeadHealthSummary(result), result })
}
