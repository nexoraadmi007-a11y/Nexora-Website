import { NextRequest, NextResponse } from 'next/server'
import { createRecord, escapeFormula, listRecords, updateRecord } from '@/lib/airtable'
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
  const created = await createRecord<{ id: string; fields: Fields }>('Ambassadors', compact({
    'Ambassador Name': fullName,
    'Ambassador ID': `GA-${Date.now()}`,
    Contact: phone || email,
    Institution: text(fields['Institution or Organization'], 200),
    'NYSC State': text(fields['NYSC State'], 120),
    Location: text(fields.Location, 160),
    Email: email,
    'Phone Number': phone,
    'Telegram Username': text(fields['Telegram Username'], 120),
    'Start Date': new Date().toISOString().slice(0, 10),
    'Ambassador Status': 'Active',
    'Members Reached': Number(fields['Estimated Reach'] || 0),
    'Total Referral Leads': 0,
    'Paid Referral Count': 0,
    'Commission Rate Percent': 5,
    'Total Commission Earned': 0,
    'Commission Paid': 0,
    'Commission Balance': 0,
    'Referral Code': referralCode,
    'Ambassador Referral Link': `${baseUrl}/career-accelerator?ref=${encodeURIComponent(referralCode)}`,
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

  if (stage === 'Under Review') fields['Registration Status'] = 'Under Review'
  if (stage === 'Shortlisted') {
    fields['Registration Status'] = 'Under Review'
    fields['Interview Status'] = 'Invited'
    fields['Calendly Invite Link'] = process.env.CALENDLY_EVENT_TYPE_URL || ''
  }
  if (stage === 'Interview Scheduled') fields['Interview Status'] = 'Scheduled'
  if (stage === 'Interview Completed') fields['Interview Status'] = 'Completed'
  if (stage === 'Selected for Bootcamp') {
    fields['Interview Status'] = 'Passed'
    fields['Bootcamp Status'] = 'Invited'
  }
  if (stage === 'Bootcamp In Progress') fields['Bootcamp Status'] = 'In Progress'
  if (stage === 'Probation') fields['Probation Status'] = 'In Progress'
  if (stage === 'Official Growth Associate') {
    fields['Registration Status'] = 'Approved'
    fields['Processing Status'] = 'Processed'
    fields['Probation Status'] = 'Passed'
  }
  if (stage === 'Rejected') {
    fields['Registration Status'] = 'Rejected'
    fields['Interview Status'] = action === 'fail_interview' ? 'Failed' : undefined
  }
  if (stage === 'Withdrawn') fields['Registration Status'] = 'Rejected'
  if (note) fields['Review Notes'] = note
  return compact(fields)
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
  if (nextStage === 'Official Growth Associate') await createOfficialAssociate(id, registration.fields, note)

  await notify([
    'Growth Associate recruitment update',
    `Applicant: ${registration.fields['Full Name'] || id}`,
    `Stage: ${nextStage}`,
    `Action: ${action || 'manual stage update'}`,
    note ? `Note: ${note.slice(0, 400)}` : '',
  ].filter(Boolean).join('\n'))

  return NextResponse.json({ ok: true, id, stage: nextStage })
}
