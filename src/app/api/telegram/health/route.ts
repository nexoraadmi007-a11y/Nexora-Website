import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function isAuthorized(request: NextRequest) {
  const expected = process.env['TELEGRAM_QUEUE_SECRET'] || process.env['CRON_SECRET']
  if (!expected) return (process.env['NEXT_PUBLIC_SITE_URL'] || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-secret') === expected
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized Telegram health check.' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    telegramBotTokenConfigured: Boolean(process.env['TELEGRAM_BOT_TOKEN']),
    telegramWebhookSecretConfigured: Boolean(process.env['TELEGRAM_WEBHOOK_SECRET']),
    telegramQueueSecretConfigured: Boolean(process.env['TELEGRAM_QUEUE_SECRET']),
    telegramAdminChatIdConfigured: Boolean(process.env['TELEGRAM_ADMIN_CHAT_ID']),
    airtableTokenConfigured: Boolean(process.env['AIRTABLE_TOKEN']),
  })
}
