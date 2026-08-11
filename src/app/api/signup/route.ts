import { NextRequest, NextResponse } from 'next/server'
import { captureLead, phone, text } from '@/lib/lead-capture'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

type SignupPayload = Record<string, unknown>

function hasValidPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value)
}

async function notifyAdmin(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Signup Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupPayload
    const fullName = text(body.fullName, 160)
    const email = text(body.email, 254).toLowerCase()
    const whatsapp = phone(body.whatsAppNumber || body.whatsapp)
    const country = text(body.country, 80)
    const password = text(body.password, 200)

    if (!fullName || !email || !whatsapp || !country || !password) {
      return NextResponse.json({ error: 'Full name, email, WhatsApp number, country, and password are required.' }, { status: 400 })
    }

    if (!hasValidPassword(password)) {
      return NextResponse.json({ error: 'Password must contain at least 8 characters, including a letter and a number.' }, { status: 400 })
    }

    captureLead({
      platform: 'Website',
      sourcePage: '/signup',
      fullName,
      email,
      phone: whatsapp,
      whatsAppNumber: whatsapp,
      location: country,
      currentStatus: 'Professional',
      interestAreas: ['Career Accelerator'],
      primaryGoal: 'Create Nexora Institute account',
      notes: 'Signup intent captured from the V2 public account page.',
    }).catch((error) => {
      console.error('Signup CRM capture failed', error instanceof Error ? error.message : error)
    })

    notifyAdmin([
      'New Nexora Institute account signup request',
      `Name: ${fullName}`,
      `Email: ${email}`,
      `WhatsApp: ${whatsapp}`,
      `Country: ${country}`,
    ].join('\n')).catch(() => undefined)

    return NextResponse.json({
      ok: true,
      message: 'Account request received. Nexora Institute will complete access setup.',
    }, { status: 201 })
  } catch (error) {
    console.error('Signup request failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'We could not process the account request. Please try again.' }, { status: 500 })
  }
}
