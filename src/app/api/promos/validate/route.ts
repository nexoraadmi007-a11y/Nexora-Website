import { NextRequest, NextResponse } from 'next/server'
import { validatePromoCode } from '@/lib/product-rules'

export const runtime = 'nodejs'

function text(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const programme = text(body.programme || body.programmeCode)
    const code = text(body.code)
    if (!programme) return NextResponse.json({ error: 'Programme is required.' }, { status: 400 })
    const result = validatePromoCode({ programme, code })
    if (!result.ok) return NextResponse.json({ ok: false, message: result.message, listPrice: result.listPrice, discount: 0, finalPrice: result.finalPrice }, { status: 200 })
    return NextResponse.json({ ok: true, code: result.code, description: result.description, listPrice: result.listPrice, discount: result.discount, finalPrice: result.finalPrice })
  } catch {
    return NextResponse.json({ error: 'Promo code could not be validated.' }, { status: 500 })
  }
}
