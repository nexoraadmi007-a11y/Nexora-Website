import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from '@/lib/airtable'

export const runtime = 'nodejs'

type Fields = Record<string, any>

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signature) return false
  const digest = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  if (digest.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

async function verifyPaystackReference(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  })
  const payload = await response.json()
  if (!response.ok || !payload.status) {
    throw new Error(payload.message || 'Paystack verification failed')
  }
  return payload.data as Record<string, any>
}

async function findByReference<T extends Fields>(table: string, field: string, reference: string) {
  const records = await listRecords<T>(table, {
    formula: `{${field}}='${escapeFormula(reference)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

async function findContact(email: string) {
  if (!email) return null
  return findByReference<Fields>('Master Contacts', 'Email', email)
}

async function findProgramme(programCode: string, programName: string) {
  const code = programCode === 'COMPLETE' ? 'COMPLETE' : programCode === 'BATP' ? 'BATP' : 'NGTP'
  const byCode = await listRecords<Fields>('Programmes', {
    formula: `{Programme Code}='${escapeFormula(code)}'`,
    maxRecords: 1,
  })
  if (byCode[0]) return byCode[0]

  if (!programName) return null
  const byName = await listRecords<Fields>('Programmes', {
    formula: `{Programme Name}='${escapeFormula(programName)}'`,
    maxRecords: 1,
  })
  return byName[0] || null
}

async function findPaymentPlan(amount: number) {
  const records = await listRecords<Fields>('Payment Plans', {
    formula: `{Total Amount}=${amount}`,
    maxRecords: 1,
  }).catch(() => [])
  return records[0] || null
}

async function findApplication(reference: string, contactId?: string) {
  const byReference = await findByReference<Fields>('NGTP Applications', 'Website Submission ID', reference)
  if (byReference) return byReference
  if (!contactId) return null
  const records = await listRecords<Fields>('NGTP Applications', {
    formula: `FIND('${escapeFormula(contactId)}', ARRAYJOIN({Applicant}))`,
    maxRecords: 1,
  }).catch(() => [])
  return records[0] || null
}

async function upsertEnrollment(input: {
  reference: string
  contactId?: string
  applicationId?: string
  programmeId?: string
  paymentPlanId?: string
  amount: number
  paymentDate: string
  ambassadorId?: string
}) {
  const existing = await findByReference<Fields>('Enrollments', 'Website Checkout ID', input.reference)
  const fields = compact({
    ...(input.contactId ? { Contact: [input.contactId] } : {}),
    ...(input.applicationId ? { Application: [input.applicationId] } : {}),
    ...(input.programmeId ? { Programme: [input.programmeId] } : {}),
    ...(input.paymentPlanId ? { 'Payment Plan': [input.paymentPlanId] } : {}),
    ...(input.ambassadorId ? { 'Referred By Ambassador': [input.ambassadorId] } : {}),
    'Enrollment Status': 'Payment Confirmed',
    'Enrollment Date': input.paymentDate,
    'Total Amount Due': input.amount,
    'Total Amount Paid': input.amount,
    Balance: 0,
    'Installment Count': 1,
    'Payment Confirmation Date': input.paymentDate,
    'Website Checkout ID': input.reference,
    Notes: `Auto-confirmed by Paystack webhook for ${input.reference}.`,
  })

  if (existing) {
    return updateRecord<AirtableRecord<Fields>>('Enrollments', existing.id, fields)
  }

  return createRecord<AirtableRecord<Fields>>('Enrollments', {
    'Enrollment ID': `ENR-${Date.now()}`,
    ...fields,
  })
}

async function createPaymentIfMissing(input: {
  reference: string
  enrollmentId: string
  amount: number
  paymentDate: string
  receiptUrl?: string
}) {
  const existing = await findByReference<Fields>('Payments', 'Payment Reference', input.reference)
  const fields = compact({
    Enrollment: [input.enrollmentId],
    'Payment Date': input.paymentDate,
    'Amount Paid': input.amount,
    'Payment Method': 'Paystack',
    'Payment Reference': input.reference,
    'Installment Number': 1,
    'Payment Status': 'Confirmed',
    'Confirmed By': 'Paystack Webhook',
    'Confirmed At': new Date().toISOString(),
    'Receipt Link': input.receiptUrl,
    Notes: `Auto-created from Paystack successful charge ${input.reference}.`,
  })

  if (existing) {
    return updateRecord('Payments', existing.id, fields)
  }

  return createRecord('Payments', {
    'Payment ID': `PAY-${Date.now()}`,
    ...fields,
  })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  if (!verifySignature(rawBody, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid Paystack signature.' }, { status: 401 })
  }

  const event = JSON.parse(rawBody) as Record<string, any>
  if (event.event !== 'charge.success') {
    return NextResponse.json({ ok: true, ignored: event.event || 'unknown' })
  }

  const reference = text(event.data?.reference, 160)
  if (!reference) {
    return NextResponse.json({ error: 'Missing Paystack reference.' }, { status: 400 })
  }

  try {
    const transaction = await verifyPaystackReference(reference)
    if (transaction.status !== 'success') {
      return NextResponse.json({ ok: true, ignored: `Transaction status ${transaction.status}` })
    }

    const amount = Math.round(number(transaction.amount) / 100)
    const email = text(transaction.customer?.email || event.data?.customer?.email, 254).toLowerCase()
    const paidAt = text(transaction.paid_at || transaction.paidAt || new Date().toISOString(), 40).slice(0, 10)
    const metadata = transaction.metadata || {}
    const requestedCode = text(metadata.program_code, 20).toUpperCase()
    const programCode = requestedCode === 'COMPLETE' ? 'COMPLETE' : requestedCode === 'BATP' ? 'BATP' : 'NGTP'
    const programName = text(metadata.program, 160)
    const receiptUrl = text(transaction.receipt_url || transaction.log?.receipt_url, 500)

    const websiteEvent = await findByReference<Fields>('Website Payment Events', 'Payment Reference', reference)
    const contact = await findContact(email)
    const programme = await findProgramme(programCode, programName)
    const paymentPlan = await findPaymentPlan(amount)
    const application = await findApplication(reference, contact?.id)
    const ambassadorId = websiteEvent?.fields?.Ambassador?.[0] || text(metadata.ambassador_record_id, 120)

    if (websiteEvent) {
      await updateRecord('Website Payment Events', websiteEvent.id, compact({
        'Payment Status': 'Successful',
        Amount: amount,
        Currency: 'NGN',
        'Verified At': new Date().toISOString(),
        'Raw Response': JSON.stringify({ event, transaction }).slice(0, 9000),
      }))
    }

    if (contact) {
      await updateRecord('Master Contacts', contact.id, compact({
        'Lifecycle Stage': 'Enrolled',
        'Enrollment Status': 'Enrolled',
        'Program Applied': programCode,
        'Last Interaction': new Date().toISOString().slice(0, 10),
        Notes: `Payment confirmed by Paystack webhook. Reference: ${reference}`,
      })).catch(async () => {
        await updateRecord('Master Contacts', contact.id, compact({
          'Enrollment Status': 'Enrolled',
          'Last Interaction': new Date().toISOString().slice(0, 10),
          Notes: `Payment confirmed by Paystack webhook. Reference: ${reference}`,
        }))
      })
    }

    const enrollment = await upsertEnrollment({
      reference,
      contactId: contact?.id,
      applicationId: application?.id,
      programmeId: programme?.id,
      paymentPlanId: paymentPlan?.id,
      amount,
      paymentDate: paidAt,
      ambassadorId,
    })

    await createPaymentIfMissing({
      reference,
      enrollmentId: enrollment.id,
      amount,
      paymentDate: paidAt,
      receiptUrl,
    })

    const referral = await findByReference<Fields>('Ambassador Referrals', 'Payment Reference', reference)
    if (referral) {
      await updateRecord('Ambassador Referrals', referral.id, compact({
        Enrollment: [enrollment.id],
        'Referral Status': 'Payment Confirmed',
        'Commission Status': 'Earned',
        'Qualifying Referral': true,
        'Qualification Date': paidAt,
        Notes: `Payment confirmed automatically by Paystack webhook. Reference: ${reference}`,
      }))
    }

    return NextResponse.json({ ok: true, reference, enrollmentId: enrollment.id })
  } catch (error) {
    console.error('Paystack webhook processing failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Paystack webhook processing failed.' }, { status: 500 })
  }
}
