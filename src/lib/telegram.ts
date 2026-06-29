const TELEGRAM_API = 'https://api.telegram.org'

function botToken() {
  const token = process.env['TELEGRAM_BOT_TOKEN']
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  return token
}

export type TelegramMessage = {
  message_id?: number
  text?: string
  chat?: { id?: number | string; type?: string }
  from?: {
    id?: number | string
    is_bot?: boolean
    first_name?: string
    last_name?: string
    username?: string
  }
}

export type TelegramUpdate = {
  update_id?: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
}

export function telegramName(message: TelegramMessage) {
  return [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ').trim()
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const response = await fetch(`${TELEGRAM_API}/bot${botToken()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) {
    const description = typeof data?.description === 'string' ? data.description : response.statusText
    throw new Error(`Telegram sendMessage failed: ${description}`)
  }

  return data as { ok: boolean; result?: { message_id?: number } }
}
