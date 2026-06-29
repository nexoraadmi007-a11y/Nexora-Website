import { NextRequest, NextResponse } from 'next/server'
import { handleInboundConversation } from '@/lib/conversation-engine'
import { telegramName, type TelegramUpdate } from '@/lib/telegram'

export const runtime = 'nodejs'

function isAuthorized(request: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expected) return true
  return request.headers.get('x-telegram-bot-api-secret-token') === expected
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized Telegram webhook.' }, { status: 401 })
  }

  try {
    const update = (await request.json()) as TelegramUpdate
    const message = update.message || update.edited_message
    const chatId = message?.chat?.id ? String(message.chat.id) : ''
    const text = message?.text || ''

    if (!message || !chatId) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fullName = telegramName(message)
    const username = message.from?.username ? `@${message.from.username}` : ''
    const result = await handleInboundConversation({
      platform: 'Telegram',
      platformUserId: chatId,
      telegramChatId: chatId,
      telegramUsername: username,
      conversationId: `TG-${chatId}`,
      eventId: update.update_id ? String(update.update_id) : '',
      message: text,
      lastUserMessage: text,
      fullName,
      campaignSource: 'Telegram Bot',
      interestAreas: text.toLowerCase().includes('ambassador') ? ['Ambassador Programme'] : text.toLowerCase().includes('corporate') ? ['Corporate Training'] : [],
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('Telegram webhook failed', detail)
    const localDebug = (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
    return NextResponse.json({ error: 'Telegram webhook failed.', ...(localDebug ? { detail } : {}) }, { status: 500 })
  }
}
