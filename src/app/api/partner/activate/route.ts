import { NextResponse } from 'next/server'

export function POST() {
  return NextResponse.json({ error: 'Growth Associate activation is managed by an administrator.' }, { status: 403 })
}
