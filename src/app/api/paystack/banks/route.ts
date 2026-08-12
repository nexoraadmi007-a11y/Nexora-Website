import { NextResponse } from 'next/server'
import { listPaystackBanks } from '@/lib/paystack-bank'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const banks = await listPaystackBanks()
    return NextResponse.json({ ok: true, banks })
  } catch (error) {
    console.error('Paystack bank list failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: 'BANK_LIST_FAILED', message: 'We could not load banks right now.' }, { status: 500 })
  }
}
