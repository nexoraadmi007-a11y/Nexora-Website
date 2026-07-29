import { NextRequest, NextResponse } from 'next/server'
import { updateRecord } from '@/lib/airtable'
import { findAssociateById } from '@/lib/hr-onboarding'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { id } = await context.params
  const associate = await findAssociateById(id)
  if (!associate) return NextResponse.json({ error: 'Associate not found.' }, { status: 404 })
  await updateRecord('Ambassadors', id, {
    'HR Onboarding Link Revoked': true,
    'HR Onboarding Status': 'Revoked',
    'Updated At': new Date().toISOString(),
  })
  return NextResponse.json({ ok: true })
}
