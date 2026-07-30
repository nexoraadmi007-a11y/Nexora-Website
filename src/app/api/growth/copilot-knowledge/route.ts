import { NextRequest, NextResponse } from 'next/server'
import { getApprovedKnowledgeSnapshot, getKnowledgeReport } from '@/lib/commercial-knowledge'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  return Boolean(expected && request.headers.get('x-nexora-admin-secret') === expected)
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  if (searchParams.get('sync') === 'website') {
    const report = await getKnowledgeReport()
    return NextResponse.json({ ok: true, mode: 'MANUAL_SYNC', ...report })
  }
  return NextResponse.json({ ok: true, mode: 'APPROVED_SNAPSHOT', snapshot: getApprovedKnowledgeSnapshot() })
}
