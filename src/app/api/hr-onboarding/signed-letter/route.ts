import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'
import { text } from '@/lib/growth-associate'
import { allowedSignedLetterFile, associateName, findAssociateByToken, getLatestEmploymentAgreement, getLatestSignedLetterDocument, hrConfig, logHrAudit, storeSignedLetter } from '@/lib/hr-onboarding'

export const runtime = 'nodejs'

function statusLabel(status: string) {
  if (status === 'SIGNED_COPY_APPROVED' || status === 'Approved') return 'Employment documentation completed'
  if (status === 'CORRECTION_REQUIRED' || status === 'Needs Correction') return 'Correction required'
  if (status === 'SIGNED_COPY_UNDER_REVIEW' || status === 'Pending Review') return 'Signed copy submitted'
  if (status === 'REJECTED' || status === 'Rejected') return 'Document rejected'
  return 'Signed copy required'
}

function hasReadyEmploymentLetter(status: unknown, agreement: unknown) {
  const value = text(status, 80)
  return Boolean(agreement) || ['LETTER_READY', 'Generated', 'Sent', 'Downloaded', 'Signed Uploaded', 'Approved'].includes(value)
}

export async function GET(request: NextRequest) {
  const token = text(new URL(request.url).searchParams.get('token') || '', 300)
  const associate = token ? await findAssociateByToken(token) : null
  if (!associate) return NextResponse.json({ error: 'Invalid or expired onboarding link.' }, { status: 401 })
  const [agreement, document] = await Promise.all([
    getLatestEmploymentAgreement(associate.id),
    getLatestSignedLetterDocument(associate.id),
  ])
  const signedStatus = text(document?.fields['Signed Letter Status'] || document?.fields['Verification Status'], 80)
  const letterGenerated = hasReadyEmploymentLetter(associate.fields['Employment Letter Status'], agreement)
  return NextResponse.json({
    letterGenerated,
    employmentLetterStatus: associate.fields['Employment Letter Status'] || '',
    signedLetter: document ? {
      id: document.id,
      filename: document.fields['Original Filename'] || 'Signed employment letter',
      mimeType: document.fields['Mime Type'] || '',
      size: document.fields['File Size'] || 0,
      uploadedAt: document.fields['Uploaded At'] || '',
      status: signedStatus,
      statusLabel: statusLabel(signedStatus),
      reviewNote: document.fields['Review Note'] || document.fields.Notes || '',
      canReplace: !['SIGNED_COPY_APPROVED', 'Approved'].includes(signedStatus),
    } : null,
    maxBytes: hrConfig.maxSignedLetterBytes,
  })
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const token = text(formData.get('token'), 300)
  const associate = token ? await findAssociateByToken(token) : null
  if (!associate) return NextResponse.json({ error: 'Invalid or expired onboarding link.' }, { status: 401 })
  const agreement = await getLatestEmploymentAgreement(associate.id)
  if (!agreement) return NextResponse.json({ error: 'Employment letter has not been generated yet.' }, { status: 400 })
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Select a signed employment letter file.' }, { status: 400 })
  const bytes = Buffer.from(await file.arrayBuffer())
  const validationError = allowedSignedLetterFile({ name: file.name, type: file.type, size: file.size }, bytes)
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  await logHrAudit({
    actor: `associate:${associate.id}`,
    action: 'SIGNED_LETTER_UPLOAD_STARTED',
    associateId: associate.id,
    documentReference: agreement.id,
    documentVersion: agreement.fields['Document Version'] || 1,
  })
  const document = await storeSignedLetter({
    associate,
    agreement,
    file: { name: file.name, type: file.type, size: file.size, bytes },
    actor: `associate:${associate.id}`,
  })
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (chatId) {
    await sendTelegramMessage(chatId, [
      'Signed employment letter uploaded',
      `Associate: ${associateName(associate.fields)}`,
      `Document: ${document.id}`,
      'Status: Under review',
    ].join('\n')).catch(() => null)
  }
  return NextResponse.json({
    ok: true,
    message: 'Your signed employment letter has been submitted successfully and is awaiting verification.',
    documentId: document.id,
    status: 'SIGNED_COPY_UNDER_REVIEW',
  })
}
