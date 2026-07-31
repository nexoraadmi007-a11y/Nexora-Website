import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
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

function requestId() {
  return `req_${randomUUID().slice(0, 8)}`
}

function jsonResponse(body: Record<string, unknown>, status = 200, id = requestId()) {
  return NextResponse.json({ ...body, request_id: id }, {
    status,
    headers: { 'x-nexora-request-id': id },
  })
}

function uploadError(error: unknown, id: string) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('Signed letter upload error', { requestId: id, error: message })
  if (/already been approved/i.test(message)) {
    return jsonResponse({
      success: false,
      error: 'SIGNED_COPY_ALREADY_APPROVED',
      message: 'This signed letter has already been approved. Contact HR before uploading another copy.',
    }, 409, id)
  }
  if (/Airtable/i.test(message)) {
    return jsonResponse({
      success: false,
      error: 'AIRTABLE_SYNC_FAILED',
      message: 'Your file was received, but the record could not be completed. The HR team has been notified.',
    }, 502, id)
  }
  return jsonResponse({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'We could not process your document at the moment. Please try again.',
  }, 500, id)
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
  const id = requestId()
  try {
    const formData = await request.formData().catch(() => null)
    if (!formData) {
      return jsonResponse({
        success: false,
        error: 'MALFORMED_MULTIPART',
        message: 'The upload request was not formed correctly. Please select the file again and retry.',
      }, 400, id)
    }
    const token = text(formData.get('token'), 300)
    const associate = token ? await findAssociateByToken(token) : null
    if (!associate) {
      return jsonResponse({
        success: false,
        error: 'UNAUTHORISED',
        message: 'Please sign in again before uploading your document.',
      }, 401, id)
    }
    const agreement = await getLatestEmploymentAgreement(associate.id)
    if (!agreement) {
      return jsonResponse({
        success: false,
        error: 'EMPLOYMENT_LETTER_NOT_READY',
        message: 'Employment letter has not been generated yet.',
      }, 400, id)
    }
    const file = formData.get('signed_letter') || formData.get('file')
    if (!(file instanceof File)) {
      return jsonResponse({
        success: false,
        error: 'MISSING_FILE',
        message: 'Please select a signed employment letter file.',
      }, 400, id)
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    const validationError = allowedSignedLetterFile({ name: file.name, type: file.type, size: file.size }, bytes)
    if (validationError) {
      return jsonResponse({
        success: false,
        error: validationError.toLowerCase().includes('large') ? 'FILE_TOO_LARGE' : 'INVALID_FILE_TYPE',
        message: validationError,
      }, validationError.toLowerCase().includes('large') ? 413 : 400, id)
    }

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
    return jsonResponse({
      success: true,
      ok: true,
      message: 'Signed employment letter submitted successfully. Status: Awaiting HR verification.',
      document: {
        id: document.id,
        status: 'SIGNED_COPY_UNDER_REVIEW',
        file_name: file.name,
        uploaded_at: document.fields['Uploaded At'] || new Date().toISOString(),
      },
    }, 200, id)
  } catch (error) {
    return uploadError(error, id)
  }
}
