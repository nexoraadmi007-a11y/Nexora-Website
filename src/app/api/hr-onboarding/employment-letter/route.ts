import { NextRequest, NextResponse } from 'next/server'
import { updateRecord } from '@/lib/airtable'
import { text } from '@/lib/growth-associate'
import { associateName, employmentLetterFilename, employmentLetterHtml, employmentLetterPdf, findAssociateByToken, getLatestHrProfile, logHrAudit, ensureEmploymentAgreement } from '@/lib/hr-onboarding'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token = text(url.searchParams.get('token') || '', 300)
  const associate = token ? await findAssociateByToken(token) : null
  if (!associate) return NextResponse.json({ error: 'Invalid or expired onboarding link.' }, { status: 401 })
  const profile = await getLatestHrProfile(associate.id)
  if (!profile && url.searchParams.get('preview') !== '1') {
    return NextResponse.json({ error: 'Complete and submit HR onboarding before downloading the employment letter.' }, { status: 409 })
  }
  const payload = {
    associate,
    profile,
    startDate: text(url.searchParams.get('startDate') || '', 40),
    workMode: text(url.searchParams.get('workMode') || '', 80),
  }
  if (url.searchParams.get('preview') === '1') {
    return new NextResponse(employmentLetterHtml(payload), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  const agreement = await ensureEmploymentAgreement(associate, {
    startDate: payload.startDate,
    workMode: payload.workMode,
    actor: `associate:${associate.id}`,
  })
  const pdf = await employmentLetterPdf(payload)
  if (!pdf.length) return NextResponse.json({ error: 'Employment letter PDF could not be generated.' }, { status: 500 })
  await updateRecord('Employment Agreements', agreement.id, {
    'Downloaded At': new Date().toISOString(),
    'Verification Status': 'Awaiting Signature',
    'Completion Status': 'Awaiting Signature',
    'Generated File Reference': `generated-on-demand:${agreement.id}`,
    'Updated At': new Date().toISOString(),
  })
  await updateRecord('Ambassadors', associate.id, {
    'Employment Letter Status': 'Downloaded',
    'Updated At': new Date().toISOString(),
  })
  await logHrAudit({
    actor: `associate:${associate.id}`,
    action: 'EMPLOYMENT_LETTER_DOWNLOADED',
    associateId: associate.id,
    documentReference: agreement?.id || '',
    documentVersion: agreement?.fields['Document Version'] || 1,
    statusBefore: text(associate.fields['Employment Letter Status'], 80),
    statusAfter: 'LETTER_DOWNLOADED',
  })
  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${employmentLetterFilename(associateName(associate.fields))}"`,
      'Cache-Control': 'private, no-store',
      'Content-Length': String(pdf.length),
    },
  })
}
