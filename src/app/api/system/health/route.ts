import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const checks = [
  ['airtable', ['AIRTABLE_BASE_ID', 'AIRTABLE_TOKEN']],
  ['paystack', ['PAYSTACK_SECRET_KEY']],
  ['telegram', ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID']],
  ['email', ['RESEND_API_KEY', 'NEXORA_EMAIL_FROM']],
  ['apify', ['APIFY_API_TOKEN']],
] as const

export function GET() {
  return NextResponse.json({
    status: 'FOUNDATION_READY',
    message: 'Nexura Institute V2 foundation is running. This endpoint checks configuration presence only and performs no external writes.',
    generatedAt: new Date().toISOString(),
    integrations: Object.fromEntries(checks.map(([name, keys]) => [
      name,
      {
        configured: keys.every((key) => Boolean(process.env[key])),
        requiredEnvironment: keys,
      },
    ])),
  })
}
