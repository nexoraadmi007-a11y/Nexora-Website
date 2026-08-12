import { NextRequest, NextResponse } from 'next/server'
import { createRecord, escapeFormula, listRecords, updateRecord } from '@/lib/airtable'
import { sendEmail } from '@/lib/email'
import { sendTelegramMessage } from '@/lib/telegram'
import { codeFromName, compact, isRecruitmentStage, recruitmentActions, recruitmentStages, text } from '@/lib/growth-associate'

export const runtime = 'nodejs'

type Fields = Record<string, any>

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected
}

async function notify(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Growth admin Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

async function findRegistration(id: string) {
  const records = await listRecords<Fields>('Ambassador Registrations', {
    formula: `RECORD_ID()='${escapeFormula(id)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

async function createOfficialAssociate(recordId: string, fields: Fields, note: string) {
  const existing = fields['Created Ambassador']?.[0]
  if (existing) return existing

  const fullName = text(fields['Full Name'], 160)
  const email = text(fields.Email, 254).toLowerCase()
  const phone = text(fields['Phone Number'] || fields['WhatsApp Number'], 80)
  const referralCode = codeFromName(fullName, recordId)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink'
  const referralLink = `${baseUrl}/career-accelerator?ref=${encodeURIComponent(referralCode)}`
  const created = await createRecord<{ id: string; fields: Fields }>('Ambassadors', compact({
    'Ambassador Name': fullName,
    'Ambassador ID': `GA-${Date.now()}`,
    Contact: phone || email,
    Institution: text(fields['Institution or Organization'], 200),
    Location: text(fields.Location, 160),
    Email: email,
    'Phone Number': phone,
    'Telegram Username': text(fields['Telegram Username'], 120),
    'Start Date': new Date().toISOString().slice(0, 10),
    'Ambassador Status': 'Active',
    'Members Reached': Number(fields['Estimated Reach'] || 0),
    'Total Referral Leads': 0,
    'Paid Referral Count': 0,
    'Commission Rate Percent': 15,
    'Total Commission Earned': 0,
    'Commission Paid': 0,
    'Commission Balance': 0,
    'Referral Code': referralCode,
    'Ambassador Referral Link': referralLink,
    'Referral Link': referralLink,
    Active: true,
    'Daily Lead Quota': 10,
    'Monthly Intake Target': 30,
    'Onboarding Status': 'Invited',
    'Referral Status': 'Active',
    'Created At': new Date().toISOString(),
    'Updated At': new Date().toISOString(),
    'Discount Eligibility Status': 'Not Eligible',
    'Ambassador Score': Number(fields['AI Score'] || 0),
    'Ambassador Level': 'Bronze Ambassador',
    Notes: `Official Growth Associate activation from registration ${recordId}.${note ? `\n${note}` : ''}`,
  }))

  await updateRecord('Ambassador Registrations', recordId, compact({
    'Created Ambassador': [created.id],
    'Official Activation Date': new Date().toISOString().slice(0, 10),
    'Activation Notes': note,
  }))

  return created.id
}

function actionFields(action: string, stage: string, note: string) {
  const now = new Date().toISOString()
  const fields: Record<string, unknown> = {
    'Recruitment Stage': stage,
    'Admin Last Action': action,
    'Admin Last Action At': now,
  }

  if (stage === 'Interview Scheduled') {
    fields['Registration Status'] = 'Interview Scheduled'
    fields['Interview Status'] = 'Invited'
    fields['Calendly Invite Link'] = process.env.CALENDLY_EVENT_TYPE_URL || ''
  }
  if (stage === 'Interview Passed') {
    fields['Registration Status'] = 'Approved'
    fields['Processing Status'] = 'Processed'
    fields['Interview Status'] = 'Passed'
  }
  if (stage === 'Rejected') {
    fields['Registration Status'] = 'Rejected'
    fields['Processing Status'] = 'Processed'
    fields['Interview Status'] = 'Failed'
  }
  if (stage === 'Withdrawn') fields['Registration Status'] = 'Rejected'
  if (note) fields['Review Notes'] = note
  return compact(fields)
}

function applicantMessage(fields: Fields, stage: string, action: string, note: string) {
  const fullName = text(fields['Full Name'], 120) || 'there'
  const calendlyLink = process.env.CALENDLY_EVENT_TYPE_URL || text(fields['Calendly Invite Link'], 500)
  const groupInviteLink = process.env.GROWTH_ASSOCIATE_GROUP_INVITE_URL || process.env.WHATSAPP_GROUP_INVITE_URL || ''
  const signoff = '\n\nNEXORA Institute Recruitment Team'
  const extraNote = note ? `\n\nAdditional note from the recruitment team:\n${note}` : ''

  if (stage === 'Interview Scheduled') {
    return {
      subject: 'NEXORA Growth Associate Interview Invitation',
      text: `Hello ${fullName},\n\nYou have been selected for the interview stage of the NEXORA Growth Associate recruitment process.\n\n${calendlyLink ? `Please choose the interview date and time that works best for you using this Calendly link:\n${calendlyLink}` : 'Our team will contact you with the interview time and joining details.'}\n\nPlease attend the interview prepared to discuss your motivation, audience reach, promotion experience, and why you want to represent NEXORA.${extraNote}${signoff}`,
    }
  }

  if (stage === 'Interview Passed') {
    return {
      subject: 'NEXORA Growth Associate Interview Result',
      text: `Hello ${fullName},\n\nCongratulations. You passed the NEXORA Growth Associate interview.\n\n${groupInviteLink ? `Please join the official Growth Associate group using this invite link:\n${groupInviteLink}` : 'Our team will send your official group invite link shortly.'}\n\nFurther onboarding instructions will be shared in the group.${extraNote}${signoff}`,
    }
  }

  if (stage === 'Rejected') {
    return {
      subject: 'NEXORA Growth Associate Application Update',
      text: `Hello ${fullName},\n\nThank you for applying to become a NEXORA Growth Associate.\n\nWe are sorry to inform you that you did not pass this stage of the recruitment process. We appreciate your interest in NEXORA and encourage you to stay connected for future opportunities.${extraNote}${signoff}`,
    }
  }

  return null
}

async function notifyApplicant(fields: Fields, stage: string, action: string, note: string) {
  const email = text(fields.Email, 254).toLowerCase()
  if (!email) return 'No applicant email on record.'

  const message = applicantMessage(fields, stage, action, note)
  if (!message) return 'No applicant email template for this action.'

  const result = await sendEmail({
    to: email,
    subject: message.subject,
    text: message.text,
  })

  if (result.skipped) return result.reason || 'Email provider is not configured.'
  return `Email sent to ${email}${result.id ? ` (Resend ID: ${result.id})` : ''}.`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const stage = text(searchParams.get('stage') || '', 80)
  const query = text(searchParams.get('q') || '', 120).toLowerCase()
  const formula = stage && isRecruitmentStage(stage) ? `{Recruitment Stage}='${escapeFormula(stage)}'` : undefined
  const records = await listRecords<Fields>('Ambassador Registrations', {
    formula,
    sortField: 'Submitted At',
    direction: 'desc',
    maxRecords: 100,
  })
  const filtered = query ? records.filter((record) => JSON.stringify(record.fields).toLowerCase().includes(query)) : records

  return NextResponse.json({
    stages: recruitmentStages,
    applicants: filtered.map((record) => ({
      id: record.id,
      fields: record.fields,
    })),
  })
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await request.json()
  const id = text(body.id, 80)
  const action = text(body.action, 80)
  const note = text(body.note)
  const explicitStage = text(body.stage, 80)
  const nextStage = isRecruitmentStage(explicitStage) ? explicitStage : recruitmentActions[action]
  if (!id || !nextStage) return NextResponse.json({ error: 'A valid applicant id and action/stage are required.' }, { status: 400 })

  const registration = await findRegistration(id)
  if (!registration) return NextResponse.json({ error: 'Applicant not found.' }, { status: 404 })

  const fields = actionFields(action || nextStage, nextStage, note)
  await updateRecord('Ambassador Registrations', id, fields)
  if (nextStage === 'Interview Passed') await createOfficialAssociate(id, { ...registration.fields, ...fields }, note)

  let applicantNotification = ''
  try {
    applicantNotification = await notifyApplicant(registration.fields, nextStage, action || nextStage, note)
  } catch (error) {
    applicantNotification = error instanceof Error ? error.message : 'Applicant email failed.'
  }

  await notify([
    'Growth Associate recruitment update',
    `Applicant: ${registration.fields['Full Name'] || id}`,
    `Stage: ${nextStage}`,
    `Action: ${action || 'manual stage update'}`,
    `Applicant notification: ${applicantNotification}`,
    note ? `Note: ${note.slice(0, 400)}` : '',
  ].filter(Boolean).join('\n'))

  return NextResponse.json({ ok: true, id, stage: nextStage, applicantNotification })
}
