import { NextRequest, NextResponse } from 'next/server'
import { finalizeSuccessfulPaystackPayment } from '@/lib/paystack-fulfillment'

export const runtime = 'nodejs'

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function GET(request: NextRequest) {
  const reference = text(request.nextUrl.searchParams.get('reference'), 160)
  if (!reference) {
    return NextResponse.json({ ok: false, error: 'PAYMENT_REFERENCE_REQUIRED', message: 'Payment reference is required.' }, { status: 400 })
  }

  try {
    const result = await finalizeSuccessfulPaystackPayment(reference)
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        error: 'PAYMENT_NOT_SUCCESSFUL',
        message: 'This payment has not been confirmed yet.',
        reference,
        status: result.status,
      }, { status: 409 })
    }
    return NextResponse.json({ ok: true, payment: result })
  } catch (error) {
    console.error('Paystack verification endpoint failed', error instanceof Error ? error.message : error)
    return NextResponse.json({
      ok: false,
      error: 'PAYMENT_VERIFICATION_FAILED',
      message: 'We could not verify this payment yet. Please contact Nexora support with your payment reference.',
      reference,
    }, { status: 500 })
  }
}
