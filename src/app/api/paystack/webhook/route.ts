import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { finalizeSuccessfulPaystackPayment } from '@/lib/paystack-fulfillment'

export const runtime = 'nodejs'

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signature) return false
  const digest = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  if (digest.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  if (!verifySignature(rawBody, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid Paystack signature.' }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as Record<string, any>
  if (event.event !== 'charge.success') {
    return NextResponse.json({ ok: true, ignored: event.event || 'unknown' })
  }

  const reference = text(event.data?.reference, 160)
  if (!reference) {
    return NextResponse.json({ error: 'Missing Paystack reference.' }, { status: 400 })
  }

  try {
    const result = await finalizeSuccessfulPaystackPayment(reference, event)
    if (!result.ok) {
      return NextResponse.json({ ok: true, ignored: `Transaction status ${result.status}` })
    }
    return NextResponse.json({ ok: true, reference, enrollmentId: result.enrollmentId })
  } catch (error) {
    console.error('Paystack webhook processing failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Paystack webhook processing failed.' }, { status: 500 })
  }
}
