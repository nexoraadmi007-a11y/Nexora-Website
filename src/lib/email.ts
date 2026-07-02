type EmailInput = {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(input: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, skipped: true, reason: 'RESEND_API_KEY is not configured.' }
  }

  const from = process.env.NEXORA_EMAIL_FROM || 'NEXORA Institute <onboarding@resend.dev>'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html || input.text.replace(/\n/g, '<br />'),
    }),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof data?.message === 'string' ? data.message : response.statusText
    throw new Error(`Email send failed: ${detail}`)
  }

  return { ok: true, skipped: false, id: data?.id as string | undefined }
}
