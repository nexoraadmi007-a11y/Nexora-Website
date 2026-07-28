import { NextRequest, NextResponse } from 'next/server'
import { runApifyIndividualLeadImport, runApifyLeadImport } from '@/lib/apify-leads'
import { sendTelegramMessage } from '@/lib/telegram'
import { growthConfig } from '@/lib/growth-config'

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

async function notify(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Apify lead Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const requestedType = text(body.leadType || body.pipeline || body.programCode, 120).toUpperCase()
    const requestedText = `${text(body.sector, 200)} ${text(body.query, 200)} ${requestedType}`.toLowerCase()
    const businessRequested = ['business', 'restaurant', 'sme', 'corporate', 'company', 'batp'].some((term) => requestedText.includes(term))
    if (businessRequested && !growthConfig.enableSmeGrowthEngine && !growthConfig.enableCorporateGrowthEngine) {
      return NextResponse.json({ error: 'Business/SME/corporate discovery is disabled in Individual Growth Engine Version 1.' }, { status: 403 })
    }
    const importInput = {
      actorId: text(body.actorId, 200),
      taskId: text(body.taskId, 200),
      query: text(body.query, 200),
      location: text(body.location, 200),
      sector: text(body.sector, 200),
      limit: Number(body.limit || 20),
      actorInput: typeof body.actorInput === 'object' && body.actorInput ? body.actorInput : undefined,
    }
    const result = businessRequested
      ? await runApifyLeadImport(importInput)
      : await runApifyIndividualLeadImport(importInput)

    await notify([
      'NEXORA Apify lead import completed',
      `Actor/task: ${result.actorOrTask}`,
      `Received: ${result.received}`,
      `Imported: ${result.imported.length}`,
      `Skipped duplicates: ${result.skipped.length}`,
      'failed' in result ? `Failed: ${result.failed.length}` : '',
    ].filter(Boolean).join('\n'))

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('Apify lead import failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Apify lead import failed.' }, { status: 500 })
  }
}
