import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { text } from '@/lib/growth-associate'
import { associateEmail, associateName, findAssociateById, reviewSignedLetter } from '@/lib/hr-onboarding'

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
  const body = await request.json().catch(() => ({}))
  const action = text(body.action, 40) as 'approve' | 'request-correction' | 'reject'
  const note = text(body.note, 1000)
  if (!['approve', 'request-correction', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Choose approve, request-correction or reject.' }, { status: 400 })
  }
  const result = await reviewSignedLetter({ associateId: id, action, actor: 'admin', note })
  const associate = await findAssociateById(id)
  if (associate) {
    const email = associateEmail(associate.fields)
    const name = associateName(associate.fields)
    if (email) {
      const subject = action === 'approve'
        ? 'NEXORA Employment Onboarding Completed'
        : action === 'request-correction'
          ? 'NEXORA Signed Employment Letter Correction Required'
          : 'NEXORA Signed Employment Letter Update'
      const message = action === 'approve'
        ? `Hello ${name},\n\nYour signed employment letter has been approved. Your employment onboarding is now complete.\n\nNEXORA Institute HR`
        : action === 'request-correction'
          ? `Hello ${name},\n\nYour signed employment letter needs correction before approval.${note ? `\n\nAdmin note:\n${note}` : ''}\n\nPlease return to your onboarding link and upload a corrected signed copy.\n\nNEXORA Institute HR`
          : `Hello ${name},\n\nYour signed employment letter was rejected.${note ? `\n\nReason:\n${note}` : ''}\n\nNEXORA Institute HR`
      await sendEmail({ to: email, subject, text: message }).catch(() => null)
    }
  }
  return NextResponse.json({ ok: true, status: result.status })
}
