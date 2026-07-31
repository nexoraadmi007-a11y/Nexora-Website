import { NextRequest, NextResponse } from 'next/server'
import { text } from '@/lib/growth-associate'
import { getLatestSignedLetterDocument, logHrAudit, safeOriginalFilename, signedLetterFileData } from '@/lib/hr-onboarding'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const { id } = await context.params
  const document = await getLatestSignedLetterDocument(id)
  if (!document) return NextResponse.json({ error: 'No signed letter found for this associate.' }, { status: 404 })
  const data = await signedLetterFileData(id, document)
  if (!data) return NextResponse.json({ error: 'Signed letter file data is missing.' }, { status: 404 })
  await logHrAudit({
    actor: 'admin',
    action: 'SIGNED_LETTER_DOWNLOADED_BY_ADMIN',
    associateId: id,
    documentReference: document.id,
    documentVersion: document.fields['Employment Letter Version'],
    statusAfter: text(document.fields['Signed Letter Status'], 80),
  })
  return new NextResponse(Buffer.from(data, 'base64'), {
    headers: {
      'Content-Type': text(document.fields['Mime Type'], 80) || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeOriginalFilename(text(document.fields['Original Filename'], 160) || 'signed-employment-letter.pdf')}"`,
      'Cache-Control': 'no-store',
    },
  })
}
