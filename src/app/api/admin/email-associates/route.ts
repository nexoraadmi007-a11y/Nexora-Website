import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

type Recipient = {
  fullName?: string
  email?: string
  whatsapp?: string
  gender?: string
  [key: string]: unknown
}

const MAX_RECIPIENTS = 150

function clean(value: unknown, limit = 500) {
  return String(value || '').trim().slice(0, limit)
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function renderTemplate(template: string, recipient: Recipient) {
  const fullName = clean(recipient.fullName || recipient.name || recipient['Full Name'] || recipient['Full name'], 200)
  const firstName = fullName.split(/\s+/).filter(Boolean)[0] || 'there'
  const values: Record<string, string> = {
    name: fullName || firstName,
    firstName,
    email: clean(recipient.email || recipient['Email'] || recipient['Email address'], 200),
    whatsapp: clean(recipient.whatsapp || recipient['WhatsApp'] || recipient['WhatsApp number'], 80),
    gender: clean(recipient.gender || recipient['Gender'], 80),
    calendlyLink: process.env.CALENDLY_EVENT_TYPE_URL || 'https://calendly.com/nexoraadmi007/interview-session',
    senderEmail: process.env.NEXORA_EMAIL_FROM || 'NEXORA Institute <admin@nexoragroup.ink>',
  }
  return template.replace(/\{\{\s*(name|firstName|email|whatsapp|gender|calendlyLink|senderEmail)\s*\}\}/gi, (_, key: string) => values[key] || '')
}

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin || !['SUPER_ADMIN', 'ADMIN', 'TALENT_ADMIN', 'SUPPORT_ADMIN'].includes(admin.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const recipients = Array.isArray(body.recipients) ? body.recipients.slice(0, MAX_RECIPIENTS) as Recipient[] : []
    const subjectTemplate = clean(body.subject, 200)
    const messageTemplate = clean(body.message, 5000)
    const mode = clean(body.mode, 20) || 'bulk'
    const testEmail = clean(body.testEmail, 200)

    if (!subjectTemplate || !messageTemplate) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
    }

    const targetRecipients = mode === 'test'
      ? [{ fullName: 'Nexora Admin', email: testEmail || admin.user.email }]
      : recipients

    if (!targetRecipients.length) {
      return NextResponse.json({ error: 'Add at least one recipient.' }, { status: 400 })
    }

    const results = []
    for (const recipient of targetRecipients) {
      const email = clean(recipient.email || recipient['Email'] || recipient['Email address'], 200).toLowerCase()
      const fullName = clean(recipient.fullName || recipient.name || recipient['Full Name'] || recipient['Full name'], 200)
      if (!validEmail(email)) {
        results.push({ email, fullName, ok: false, error: 'INVALID_EMAIL' })
        continue
      }
      try {
        const subject = renderTemplate(subjectTemplate, { ...recipient, email, fullName })
        const text = renderTemplate(messageTemplate, { ...recipient, email, fullName })
        const sent = await sendEmail({ to: email, subject, text })
        results.push({ email, fullName, ok: true, id: sent.id || null })
      } catch (error) {
        results.push({ email, fullName, ok: false, error: error instanceof Error ? error.message : 'EMAIL_SEND_FAILED' })
      }
    }

    const summary = {
      total: targetRecipients.length,
      sent: results.filter((item) => item.ok).length,
      failed: results.filter((item) => !item.ok).length,
      mode,
    }

    createSupabaseAdminClient().from('admin_audit_logs').insert({
      admin_user_id: admin.user.id,
      admin_email: admin.user.email,
      action: mode === 'test' ? 'ASSOCIATE_EMAIL_TEST_SENT' : 'ASSOCIATE_EMAIL_BULK_SENT',
      entity: 'associate_email_campaign',
      entity_id: null,
      new_value: summary,
      metadata: { subject: subjectTemplate, recipient_count: targetRecipients.length },
    }).then(() => undefined)

    return NextResponse.json({ ok: true, summary, results })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Email action failed.' }, { status: 400 })
  }
}
