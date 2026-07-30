import { NextRequest, NextResponse } from 'next/server'
import { updateRecord } from '@/lib/airtable'
import { text } from '@/lib/growth-associate'
import { employmentLetterHtml, findAssociateById, getLatestHrProfile, ensureEmploymentAgreement } from '@/lib/hr-onboarding'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected
}

async function render(request: NextRequest, id: string, save = false) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const associate = await findAssociateById(id)
  if (!associate) return NextResponse.json({ error: 'Associate not found.' }, { status: 404 })
  const body = save ? await request.json().catch(() => ({})) : {}
  const url = new URL(request.url)
  const startDate = text(body.startDate || url.searchParams.get('startDate') || '', 40)
  const workMode = text(body.workMode || url.searchParams.get('workMode') || '', 80)
  const profile = await getLatestHrProfile(id)

  if (save) {
    const agreement = await ensureEmploymentAgreement(associate, { startDate, workMode, actor: 'admin' })
    await updateRecord('Ambassadors', id, {
      'Employment Letter Status': 'LETTER_READY',
      'Employment Start Date': startDate || new Date().toISOString().slice(0, 10),
      'Work Mode': workMode || 'Hybrid',
      'Updated At': new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, agreementId: agreement.id, status: 'LETTER_READY' })
  }

  return new NextResponse(employmentLetterHtml({ associate, profile, startDate, workMode }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return render(request, id)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return render(request, id, true)
}
