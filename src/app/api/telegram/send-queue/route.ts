import { NextRequest, NextResponse } from 'next/server'
import { listRecords, updateRecord, type AirtableRecord } from '@/lib/airtable'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

type QueueFields = Record<string, any>

function isAuthorized(request: NextRequest) {
  const expected = process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-secret') === expected
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized queue sender.' }, { status: 401 })
  }

  const processed: Array<{ id: string; status: string; error?: string }> = []
  const records = await listRecords<QueueFields>('Conversation Message Queue', {
    formula: "AND({Channel}='Telegram',{Direction}='Outbound',{Queue Status}='Ready to Send')",
    maxRecords: 10,
    sortField: 'Scheduled For',
    direction: 'asc',
  })

  for (const record of records) {
    const chatId = String(record.fields['Recipient Chat ID'] || '').trim()
    const body = String(record.fields['Message Body'] || '').trim()

    if (!chatId || !body) {
      await updateRecord('Conversation Message Queue', record.id, {
        'Queue Status': 'Manual Review',
        'Error Message': 'Missing Recipient Chat ID or Message Body.',
      })
      processed.push({ id: record.id, status: 'Manual Review', error: 'Missing recipient or body' })
      continue
    }

    try {
      const response = await sendTelegramMessage(chatId, body)
      await updateRecord<AirtableRecord<QueueFields>>('Conversation Message Queue', record.id, {
        'Queue Status': 'Sent',
        'Sent At': new Date().toISOString(),
        'Provider Message ID': response.result?.message_id ? String(response.result.message_id) : '',
        'Error Message': '',
      })
      processed.push({ id: record.id, status: 'Sent' })
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      await updateRecord('Conversation Message Queue', record.id, {
        'Queue Status': 'Failed',
        'Error Message': detail.slice(0, 2000),
      })
      processed.push({ id: record.id, status: 'Failed', error: detail })
    }
  }

  return NextResponse.json({ ok: true, processed })
}
