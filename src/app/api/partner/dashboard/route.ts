import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ error: 'This legacy endpoint has been retired. Use the authenticated Growth Associate portal.' }, { status: 410 })
}
