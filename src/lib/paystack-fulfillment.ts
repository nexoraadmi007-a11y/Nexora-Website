import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from '@/lib/airtable'
import { getGrowthOverview, upsertMonthlyPerformance } from '@/lib/growth-operations'
import { resolveProgrammeGroup } from '@/lib/programme-groups'
import { sendTelegramMessage } from '@/lib/telegram'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { recordSupabaseReferralEvent, resolveSupabaseReferral } from '@/lib/supabase-referrals'

type Fields = Record<string, any>

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => text(item, 180)).filter(Boolean)
  const raw = text(value)
  if (!raw) return []
  return raw.split(',').map((item) => text(item, 180)).filter(Boolean)
}

function normalizePhone(value: string) {
  return value.replace(/[^0-9]/g, '')
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

export async function verifyPaystackReference(reference: string) {
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

async function findAssignedAssociate(input: { email?: string; phone?: string }) {
  const email = text(input.email, 254).toLowerCase()
  const phoneDigits = normalizePhone(text(input.phone, 80))

  if (email) {
    const byEmail = await listRecords<Fields>('Growth Leads', {
      formula: `LOWER({Email})='${escapeFormula(email)}'`,
      maxRecords: 1,
    }).catch(() => [])
    if (byEmail[0]?.fields?.['Assigned Associate']?.[0]) {
      return byEmail[0].fields['Assigned Associate'][0] as string
    }
  }

  if (!phoneDigits) return ''
  const candidates = await listRecords<Fields>('Growth Leads', {
    maxRecords: 100,
    sortField: 'Assigned At',
    direction: 'desc',
  }).catch(() => [])
  const byPhone = candidates.find((record) => normalizePhone(text(record.fields.Phone, 80)) === phoneDigits)
  return byPhone?.fields?.['Assigned Associate']?.[0] || ''
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

async function findProgrammesByNames(names: string[]) {
  const found: Array<AirtableRecord<Fields>> = []
  for (const name of names) {
    const records = await listRecords<Fields>('Programmes', {
      formula: `{Programme Name}='${escapeFormula(name)}'`,
      maxRecords: 1,
    }).catch(() => [])
    if (records[0]) found.push(records[0])
  }
  return found
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
  programmeIds?: string[]
  paymentPlanId?: string
  amount: number
  paymentDate: string
  ambassadorId?: string
  selectedTracks?: string[]
}) {
  const existing = await findByReference<Fields>('Enrollments', 'Website Checkout ID', input.reference)
  const fields = compact({
    ...(input.contactId ? { Contact: [input.contactId] } : {}),
    ...(input.applicationId ? { Application: [input.applicationId] } : {}),
    ...(input.programmeIds?.length ? { Programme: input.programmeIds } : {}),
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
    Notes: `Auto-confirmed by Paystack for ${input.reference}.${input.selectedTracks?.length ? ` Selected tracks: ${input.selectedTracks.join(', ')}` : ''}`,
  })

  if (existing) return updateRecord<AirtableRecord<Fields>>('Enrollments', existing.id, fields)
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
    'Confirmed By': 'Paystack',
    'Confirmed At': new Date().toISOString(),
    'Receipt Link': input.receiptUrl,
    Notes: `Auto-created from successful Paystack charge ${input.reference}.`,
  })

  if (existing) return updateRecord<AirtableRecord<Fields>>('Payments', existing.id, fields)
  return createRecord<AirtableRecord<Fields>>('Payments', {
    'Payment ID': `PAY-${Date.now()}`,
    ...fields,
  })
}

async function createReferralEvent(input: {
  reference: string
  referralCode: string
  ambassadorId?: string
  contactId?: string
  programmeIds?: string[]
  eventType: string
}) {
  if (!input.referralCode && !input.ambassadorId) return null
  const eventId = `REVT-${input.reference}-${input.eventType}`
  const existing = await findByReference<Fields>('Referral Events', 'Referral Event ID', eventId).catch(() => null)
  const fields = compact({
    'Referral Event ID': eventId,
    'Referral Code': input.referralCode,
    ...(input.ambassadorId ? { Associate: [input.ambassadorId] } : {}),
    ...(input.contactId ? { Lead: [input.contactId] } : {}),
    'Event Type': input.eventType,
    ...(input.programmeIds?.length ? { Programme: [input.programmeIds[0]] } : {}),
    'Occurred At': new Date().toISOString(),
  })
  if (existing) return updateRecord('Referral Events', existing.id, fields)
  return createRecord('Referral Events', fields)
}

async function upsertConversionAttribution(input: {
  reference: string
  ambassadorId?: string
  contactId?: string
  applicationId?: string
  paymentId?: string
  enrollmentId?: string
  amount: number
  source: string
  status?: string
  conflictReason?: string
}) {
  if (!input.ambassadorId) return null
  const existing = await findByReference<Fields>('Conversion Attribution', 'Payment Reference', input.reference).catch(() => null)
  const now = new Date().toISOString()
  const fields = compact({
    ...(input.ambassadorId ? { Associate: [input.ambassadorId] } : {}),
    ...(input.contactId ? { Lead: [input.contactId] } : {}),
    ...(input.applicationId ? { Application: [input.applicationId] } : {}),
    ...(input.paymentId ? { Payment: [input.paymentId] } : {}),
    ...(input.enrollmentId ? { Enrollment: [input.enrollmentId] } : {}),
    'Payment Reference': input.reference,
    'Attribution Source': input.source,
    'Attribution Status': input.status || 'APPROVED',
    'Conflict Reason': input.conflictReason,
    'Attributed Amount': input.amount,
    'Net Amount': input.amount,
    'Updated At': now,
  })
  if (existing) return updateRecord('Conversion Attribution', existing.id, fields)
  return createRecord('Conversion Attribution', {
    'Attribution ID': `ATTR-${input.reference}`,
    ...fields,
    'Created At': now,
  })
}

async function updateAssociateReferralStats(ambassadorId: string, amount: number) {
  if (!ambassadorId) return
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `RECORD_ID()='${escapeFormula(ambassadorId)}'`,
    maxRecords: 1,
  }).catch(() => [])
  const ambassador = records[0]
  if (!ambassador) return
  const paidCount = number(ambassador.fields['Paid Referral Count']) + 1
  const commissionRate = number(ambassador.fields['Commission Rate Percent']) || 15
  const earned = number(ambassador.fields['Total Commission Earned']) + Math.round(amount * (commissionRate / 100))
  const paid = number(ambassador.fields['Commission Paid'])
  await updateRecord('Ambassadors', ambassadorId, compact({
    'Paid Referral Count': paidCount,
    'Total Commission Earned': earned,
    'Commission Balance': Math.max(earned - paid, 0),
    'Updated At': new Date().toISOString(),
  })).catch(() => undefined)
}

async function refreshMonthlyPerformance() {
  const overview = await getGrowthOverview()
  await upsertMonthlyPerformance(overview)
}

async function notifyAdmin(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Paystack fulfillment Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

async function finalizeSupabasePayment(input: {
  reference: string
  amount: number
  paidAt: string
  referralCode: string
  transaction: Record<string, any>
}) {
  if (!hasSupabaseAdminConfig()) return { paymentId: '', enrolmentId: '' }
  const supabase = createSupabaseAdminClient()
  const referral = input.referralCode ? await resolveSupabaseReferral(input.referralCode).catch(() => null) : null
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .update({
      amount_ngn: input.amount,
      status: 'PAID',
      paid_at: input.paidAt,
      referral_code_id: referral?.id || null,
      raw_payload: input.transaction,
      updated_at: new Date().toISOString(),
    })
    .eq('paystack_reference', input.reference)
    .select('id, enrolment_id')
    .maybeSingle()
  if (paymentError) throw new Error(`Supabase payment finalization failed: ${paymentError.message}`)

  if (payment?.enrolment_id) {
    const { error: enrolmentError } = await supabase
      .from('enrolments')
      .update({
        status: 'ENROLLED',
        referral_code_id: referral?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.enrolment_id)
    if (enrolmentError) throw new Error(`Supabase enrolment finalization failed: ${enrolmentError.message}`)
  }

  if (referral?.partner_id && payment?.id) {
    const commission = Math.round(input.amount * 0.15)
    await supabase.from('commissions').upsert({
      partner_id: referral.partner_id,
      payment_id: payment.id,
      level: 'L1',
      rate: 15,
      amount_ngn: commission,
      status: 'PENDING',
    }, { onConflict: 'partner_id,payment_id,level' }).throwOnError()
  }

  if (input.referralCode) {
    await recordSupabaseReferralEvent({
      referralCode: input.referralCode,
      eventType: 'PAYMENT_SUCCEEDED',
      paymentReference: input.reference,
      pageUrl: '/payment/success',
    }).catch((error) => console.error('Supabase payment referral event failed', error instanceof Error ? error.message : error))
  }

  return { paymentId: payment?.id || '', enrolmentId: payment?.enrolment_id || '' }
}

async function upsertBusinessParticipant(input: {
  reference: string
  fullName: string
  email: string
  phone: string
  businessName: string
  industry: string
  businessStage: string
  staffSize: string
  state: string
  website: string
}) {
  if (!input.businessName && !input.email) return null
  const existing = input.email
    ? await findByReference<Fields>('Business Participants', 'Email', input.email).catch(() => null)
    : null
  const fields = compact({
    'Business Name': input.businessName || `${input.fullName} Business`,
    'Owner Name': input.fullName,
    Industry: input.industry,
    'Business Stage': input.businessStage,
    'Staff Size': input.staffSize,
    State: input.state,
    Phone: input.phone,
    Email: input.email,
    'Enrollment Status': 'Payment Confirmed',
    'Programme Status': 'Enrolled',
    'Payment Reference': input.reference,
  })

  if (existing) return updateRecord<AirtableRecord<Fields>>('Business Participants', existing.id, fields)
  return createRecord<AirtableRecord<Fields>>('Business Participants', fields)
}

async function createBusinessDeliverables(input: {
  reference: string
  businessName: string
  ownerName: string
  email: string
}) {
  const existing = await findByReference<Fields>('Business Deliverables', 'Payment Reference', input.reference).catch(() => null)
  const fields = compact({
    'Business Name': input.businessName || `${input.ownerName} Business`,
    'Owner Name': input.ownerName,
    Email: input.email,
    Branding: 'Not Started',
    Website: 'Not Started',
    'Marketing Engine': 'Not Started',
    'Sales Engine': 'Not Started',
    'Operating System': 'Not Started',
    Dashboard: 'Not Started',
    Automation: 'Not Started',
    'Growth Plan': 'Not Started',
    'Payment Reference': input.reference,
  })

  if (existing) return updateRecord('Business Deliverables', existing.id, fields)
  return createRecord('Business Deliverables', fields)
}

export async function finalizeSuccessfulPaystackPayment(reference: string, eventPayload?: Record<string, any>) {
  const transaction = await verifyPaystackReference(reference)
  if (transaction.status !== 'success') {
    return { ok: false as const, status: transaction.status || 'unknown', reference }
  }

  const amount = Math.round(number(transaction.amount) / 100)
  const email = text(transaction.customer?.email || eventPayload?.data?.customer?.email, 254).toLowerCase()
  const paidAt = text(transaction.paid_at || transaction.paidAt || new Date().toISOString(), 40).slice(0, 10)
  const metadata = transaction.metadata || {}
  const requestedCode = text(metadata.program_code, 20).toUpperCase()
  const programCode = requestedCode === 'COMPLETE' ? 'COMPLETE' : requestedCode === 'BATP' ? 'BATP' : 'NGTP'
  const programName = text(metadata.program, 160)
  const fullName = text(metadata.full_name, 160)
  const phone = text(metadata.phone, 80)
  const selectedTracks = stringArray(metadata.selected_tracks)
  const selectedTrackSlugs = stringArray(metadata.selected_track_slugs)
  const receiptUrl = text(transaction.receipt_url || transaction.log?.receipt_url, 500)

  const websiteEvent = await findByReference<Fields>('Website Payment Events', 'Payment Reference', reference)
  const contact = await findContact(email)
  const programme = await findProgramme(programCode, programName)
  const trackProgrammes = selectedTracks.length ? await findProgrammesByNames(selectedTracks) : []
  const programmeIds = Array.from(new Set([
    programme?.id || '',
    ...trackProgrammes.map((record) => record.id),
  ].filter(Boolean)))
  const paymentPlan = await findPaymentPlan(amount)
  const application = await findApplication(reference, contact?.id)
  const referralCode = text(metadata.referral_code || websiteEvent?.fields?.['Referral Code'], 120)
  const ambassadorId = websiteEvent?.fields?.Ambassador?.[0] || text(metadata.ambassador_record_id, 120)
  const assignedAssociateId = await findAssignedAssociate({ email, phone })
  const attributionConflict = Boolean(ambassadorId && assignedAssociateId && ambassadorId !== assignedAssociateId)
  const attributionAssociateId = ambassadorId || assignedAssociateId
  const attributionSource = attributionConflict
    ? 'CONFLICT_REVIEW'
    : ambassadorId
      ? 'DIRECT_REFERRAL'
      : assignedAssociateId
        ? 'ASSIGNED_LEAD'
        : 'ADMIN_CONFIRMED'
  const existingAttribution = attributionAssociateId
    ? await findByReference<Fields>('Conversion Attribution', 'Payment Reference', reference).catch(() => null)
    : null
  const attributionAlreadyCounted = Boolean(
    existingAttribution
    && text(existingAttribution.fields['Attribution Status']) === 'APPROVED'
    && existingAttribution.fields.Associate?.[0] === attributionAssociateId,
  )

  const supabaseFinalized = await finalizeSupabasePayment({
    reference,
    amount,
    paidAt,
    referralCode,
    transaction,
  }).catch((error) => {
    console.error('Supabase payment finalization failed', error instanceof Error ? error.message : error)
    return { paymentId: '', enrolmentId: '' }
  })

  if (attributionConflict) {
    await notifyAdmin([
      'Growth attribution conflict detected',
      `Payment reference: ${reference}`,
      `Applicant: ${fullName || email || 'Unknown'}`,
      `Amount: NGN ${amount.toLocaleString()}`,
      `Referral ambassador: ${ambassadorId}`,
      `Assigned associate: ${assignedAssociateId}`,
      'Action needed: Open Growth Associate Admin and review attribution.',
    ].join('\n'))
  }

  if (websiteEvent) {
    await updateRecord('Website Payment Events', websiteEvent.id, compact({
      'Payment Status': 'Successful',
      Amount: amount,
      Currency: 'NGN',
      'Verified At': new Date().toISOString(),
      'Raw Response': JSON.stringify({ event: eventPayload, transaction }).slice(0, 9000),
    }))
  }

  if (contact) {
    await updateRecord('Master Contacts', contact.id, compact({
      'Lifecycle Stage': 'Enrolled',
      'Enrollment Status': 'Enrolled',
      'Program Applied': programCode,
      'Last Interaction': new Date().toISOString().slice(0, 10),
      Notes: `Payment confirmed by Paystack. Reference: ${reference}`,
    })).catch(async () => {
      await updateRecord('Master Contacts', contact.id, compact({
        'Enrollment Status': 'Enrolled',
        'Last Interaction': new Date().toISOString().slice(0, 10),
        Notes: `Payment confirmed by Paystack. Reference: ${reference}`,
      }))
    })
  }

  const enrollment = await upsertEnrollment({
    reference,
    contactId: contact?.id,
    applicationId: application?.id,
    programmeIds,
    paymentPlanId: paymentPlan?.id,
    amount,
    paymentDate: paidAt,
    ambassadorId: attributionConflict ? undefined : attributionAssociateId,
    selectedTracks,
  })

  const payment = await createPaymentIfMissing({
    reference,
    enrollmentId: enrollment.id,
    amount,
    paymentDate: paidAt,
    receiptUrl,
  })

  if (programCode === 'BATP') {
    const businessName = text(metadata.business_name, 180)
    await upsertBusinessParticipant({
      reference,
      fullName,
      email,
      phone,
      businessName,
      industry: text(metadata.business_industry, 120),
      businessStage: text(metadata.business_stage, 120),
      staffSize: text(metadata.staff_size, 80),
      state: text(metadata.state, 120),
      website: text(metadata.website, 300),
    })
    await createBusinessDeliverables({ reference, businessName, ownerName: fullName, email })
  }

  const referral = await findByReference<Fields>('Ambassador Referrals', 'Payment Reference', reference)
  if (referral) {
    await updateRecord('Ambassador Referrals', referral.id, compact({
      Enrollment: [enrollment.id],
      'Referral Status': attributionConflict ? 'Conflict Review' : 'Payment Confirmed',
      'Commission Status': attributionConflict ? 'On Hold' : 'Earned',
      'Qualifying Referral': !attributionConflict,
      'Qualification Date': paidAt,
      Notes: attributionConflict
        ? `Payment confirmed, but attribution conflict needs admin review. Referral ambassador ${ambassadorId}; assigned associate ${assignedAssociateId}. Reference: ${reference}`
        : `Payment confirmed automatically by Paystack. Reference: ${reference}`,
    }))
  }

  await createReferralEvent({
    reference,
    referralCode,
    ambassadorId,
    contactId: contact?.id,
    programmeIds,
    eventType: 'PAYMENT_SUCCEEDED',
  }).catch((error) => console.error('Referral event write failed', error instanceof Error ? error.message : error))

  await upsertConversionAttribution({
    reference,
    ambassadorId: attributionAssociateId,
    contactId: contact?.id,
    applicationId: application?.id,
    paymentId: (payment as AirtableRecord<Fields>)?.id,
    enrollmentId: enrollment.id,
    amount,
    source: attributionSource,
    status: attributionConflict ? 'CONFLICT' : 'APPROVED',
    conflictReason: attributionConflict ? `Referral ambassador ${ambassadorId} differs from assigned associate ${assignedAssociateId}.` : '',
  }).catch((error) => console.error('Conversion attribution write failed', error instanceof Error ? error.message : error))

  if (ambassadorId && !attributionConflict && !attributionAlreadyCounted) {
    await updateAssociateReferralStats(ambassadorId, amount).catch((error) => console.error('Associate stats update failed', error instanceof Error ? error.message : error))
  }
  await refreshMonthlyPerformance().catch((error) => console.error('Monthly performance refresh failed', error instanceof Error ? error.message : error))

  const group = resolveProgrammeGroup({ programCode, selectedTrackSlugs })

  return {
    ok: true as const,
    reference,
    enrollmentId: enrollment.id,
    amount,
    paidAt,
    programme: {
      code: programCode,
      name: programName || (programCode === 'BATP' ? 'AI Business Transformation Programme' : 'AI Career Accelerator'),
      selectedTracks,
      selectedTrackSlugs,
    },
    customer: {
      fullName,
      firstName: fullName.split(/\s+/).filter(Boolean)[0] || 'there',
      email,
    },
    referral: {
      referralCode,
      ambassadorId,
      attributionStatus: attributionConflict ? 'CONFLICT' : attributionAssociateId ? 'APPROVED' : 'UNATTRIBUTED',
      attributionSource,
    },
    group,
  }
}
