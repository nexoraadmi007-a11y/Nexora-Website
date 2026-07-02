import { NextRequest, NextResponse } from 'next/server'
import { escapeFormula, listRecords, updateRecord } from '@/lib/airtable'
import { sendTelegramMessage } from '@/lib/telegram'
import { text } from '@/lib/growth-associate'

export const runtime = 'nodejs'

type Fields = Record<string, unknown>
type CalendlyPayload = {
  event?: string
  payload?: {
    email?: string
    name?: string
    uri?: string
    scheduled_event?: {
      uri?: string
      start_time?: string
      end_time?: string
      location?: { location?: string; type?: string }
    }
  }
}

function authorized(request: NextRequest) {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET || process.env.TELEGRAM_QUEUE_SECRET || ''
  if (!secret) return false
  return request.headers.get('x-nexora-webhook-secret') === secret || request.nextUrl.searchParams.get('secret') === secret
}

async function notify(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Calendly Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = (await request.json()) as CalendlyPayload
  const email = text(body.payload?.email, 254).toLowerCase()
  const name = text(body.payload?.name, 160)
  const eventId = text(body.payload?.scheduled_event?.uri || body.payload?.uri, 500)
  const startTime = text(body.payload?.scheduled_event?.start_time, 100)

  if (!email) return NextResponse.json({ error: 'Invitee email is required.' }, { status: 400 })

  const records = await listRecords<Fields>('Ambassador Registrations', {
    formula: `{Email}='${escapeFormula(email)}'`,
    maxRecords: 1,
  })
  const record = records[0]
  if (!record) return NextResponse.json({ ok: true, matched: false })

  await updateRecord('Ambassador Registrations', record.id, {
    'Recruitment Stage': 'Interview Scheduled',
    'Interview Status': 'Scheduled',
    'Interview Date Time': startTime,
    'Calendly Event ID': eventId,
    'Admin Last Action': 'calendly_webhook',
    'Admin Last Action At': new Date().toISOString(),
  })

  await notify([
    'Growth Associate interview scheduled',
    `Applicant: ${record.fields['Full Name'] || name || email}`,
    `Email: ${email}`,
    startTime ? `Time: ${startTime}` : '',
  ].filter(Boolean).join('\n'))

  return NextResponse.json({ ok: true, matched: true, id: record.id })
}
