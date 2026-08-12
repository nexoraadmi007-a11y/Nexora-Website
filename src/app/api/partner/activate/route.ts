import { NextRequest, NextResponse } from 'next/server'
import { activatePartner } from '@/lib/partner-system'

export const runtime = 'nodejs'

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dashboard = await activatePartner({
      fullName: text(body.fullName, 180),
      email: text(body.email, 254),
      whatsapp: text(body.whatsapp, 80),
      location: text(body.location, 120),
      bankName: text(body.bankName, 120),
      accountNumber: text(body.accountNumber, 40),
    })
    return NextResponse.json({ ok: true, ...dashboard })
  } catch (error) {
    console.error('Partner activation failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Partner activation failed.' }, { status: 500 })
  }
}
