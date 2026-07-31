const baseUrl = process.env.NEXORA_TEST_BASE_URL || 'http://127.0.0.1:3000'
const token = process.env.HR_ONBOARDING_TEST_TOKEN
const filePath = process.env.SIGNED_LETTER_TEST_FILE

if (!token || !filePath) {
  console.error('Set HR_ONBOARDING_TEST_TOKEN and SIGNED_LETTER_TEST_FILE before running this upload regression.')
  process.exit(1)
}

const fs = await import('node:fs/promises')
const path = await import('node:path')

const bytes = await fs.readFile(filePath)
const filename = path.basename(filePath)
const contentType = filename.toLowerCase().endsWith('.pdf')
  ? 'application/pdf'
  : filename.toLowerCase().match(/\.jpe?g$/)
    ? 'image/jpeg'
    : 'image/png'

const formData = new FormData()
formData.set('token', token)
formData.set('document_type', 'SIGNED_EMPLOYMENT_LETTER')
formData.set('signed_letter', new Blob([bytes], { type: contentType }), filename)

const response = await fetch(`${baseUrl}/api/hr-onboarding/signed-letter`, {
  method: 'POST',
  body: formData,
})

const responseText = await response.text()
const contentTypeHeader = response.headers.get('content-type') || ''
if (!contentTypeHeader.includes('application/json')) {
  throw new Error(`Expected JSON response, got ${contentTypeHeader || 'no content-type'}: ${responseText.slice(0, 200)}`)
}
if (!responseText.trim()) {
  throw new Error('Upload endpoint returned an empty body.')
}
const payload = JSON.parse(responseText)
if (!response.ok || payload.success !== true) {
  throw new Error(payload.message || payload.error || `Upload failed with status ${response.status}`)
}
if (payload.document?.status !== 'SIGNED_COPY_UNDER_REVIEW') {
  throw new Error(`Expected SIGNED_COPY_UNDER_REVIEW, got ${payload.document?.status || 'missing status'}`)
}

console.log(JSON.stringify({
  ok: true,
  status: response.status,
  contentType: contentTypeHeader,
  requestId: payload.request_id || response.headers.get('x-nexora-request-id') || '',
  documentStatus: payload.document.status,
}, null, 2))
