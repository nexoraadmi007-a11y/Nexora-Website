import { NextRequest, NextResponse } from 'next/server'
import { findAssociateByTelegramUserId, recordLeadActivity } from '@/lib/growth-actions'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  const adminOk = expected && request.headers.get('x-nexora-admin-secret') === expected
  const associateTelegramId = request.headers.get('x-nexora-telegram-user-id') || ''
  return { adminOk, associateTelegramId }
}

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: NextRequest) {
  try {
    const auth = authorized(request)
    const body = await request.json()
    let associateId = text(body.associateId, 120)
    if (!associateId && auth.associateTelegramId) {
      const associate = await findAssociateByTelegramUserId(auth.associateTelegramId)
      associateId = associate?.id || ''
    }
    if (!auth.adminOk && !associateId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const result = await recordLeadActivity({
      leadId: text(body.leadId, 120),
      associateId,
      action: text(body.action, 80),
      channel: text(body.channel, 80) || (auth.associateTelegramId ? 'Telegram' : 'Admin'),
      verificationType: auth.adminOk ? 'ADMIN_CONFIRMED' : 'ASSOCIATE_REPORTED',
      note: text(body.note),
      nextFollowUpAt: text(body.nextFollowUpAt, 80),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Lead activity failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Lead activity failed.' }, { status: 500 })
  }
}
