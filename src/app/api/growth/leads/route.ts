import { NextRequest, NextResponse } from 'next/server'
import { assignLeadsToAssociate, formatLeadCard, getAssociateLeads } from '@/lib/growth-actions'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected
}

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const associateId = text(searchParams.get('associateId'), 120)
  if (!associateId) return NextResponse.json({ error: 'associateId is required.' }, { status: 400 })
  const leads = await getAssociateLeads(associateId, 25)
  return NextResponse.json({
    ok: true,
    leads: leads.map((lead, index) => ({ id: lead.id, fields: lead.fields, card: formatLeadCard(lead, index + 1) })),
  })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  try {
    const body = await request.json()
    const associateId = text(body.associateId, 120)
    const count = Number(body.count || 5)
    if (!associateId) return NextResponse.json({ error: 'associateId is required.' }, { status: 400 })
    const assigned = await assignLeadsToAssociate({ associateId, count, adminUserId: 'web-admin' })
    return NextResponse.json({
      ok: true,
      assignedCount: assigned.length,
      leads: assigned.map((lead, index) => ({ id: lead.id, fields: lead.fields, card: formatLeadCard(lead, index + 1) })),
    })
  } catch (error) {
    console.error('Lead assignment failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Lead assignment failed.' }, { status: 500 })
  }
}
