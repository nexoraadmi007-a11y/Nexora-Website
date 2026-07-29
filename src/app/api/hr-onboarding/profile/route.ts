import { NextRequest, NextResponse } from 'next/server'
import { updateRecord } from '@/lib/airtable'
import { text } from '@/lib/growth-associate'
import { associateEmail, associateName, findAssociateByToken, getLatestHrProfile, markHrSubmitted, upsertHrProfile, upsertPayrollDetails } from '@/lib/hr-onboarding'

export const runtime = 'nodejs'

function cleanBody(body: Record<string, unknown>) {
  return {
    legalName: text(body.legalName, 180),
    dateOfBirth: text(body.dateOfBirth, 40),
    residentialAddress: text(body.residentialAddress, 500),
    stateOfResidence: text(body.stateOfResidence, 120),
    emergencyContactName: text(body.emergencyContactName, 160),
    emergencyContactPhone: text(body.emergencyContactPhone, 80),
    educationDetails: text(body.educationDetails, 500),
    bankName: text(body.bankName, 160),
    accountName: text(body.accountName, 180),
    accountNumber: text(body.accountNumber, 20).replace(/\D/g, ''),
    confirmAccountNumber: text(body.confirmAccountNumber, 20).replace(/\D/g, ''),
  }
}

export async function GET(request: NextRequest) {
  const token = text(new URL(request.url).searchParams.get('token') || '', 300)
  const associate = token ? await findAssociateByToken(token) : null
  if (!associate) return NextResponse.json({ error: 'Invalid or expired onboarding link.' }, { status: 401 })
  const profile = await getLatestHrProfile(associate.id)
  return NextResponse.json({
    associate: {
      id: associate.id,
      name: associateName(associate.fields),
      email: associateEmail(associate.fields),
      hrStatus: associate.fields['HR Onboarding Status'] || '',
      employmentLetterStatus: associate.fields['Employment Letter Status'] || '',
    },
    profile: profile?.fields || null,
  })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const token = text(body.token, 300)
  const associate = token ? await findAssociateByToken(token) : null
  if (!associate) return NextResponse.json({ error: 'Invalid or expired onboarding link.' }, { status: 401 })

  const data = cleanBody(body)
  await upsertHrProfile(associate, data, false)
  await upsertPayrollDetails(associate, data)
  await updateRecord('Ambassadors', associate.id, {
    'HR Onboarding Status': 'In Progress',
    'Updated At': new Date().toISOString(),
  })
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const token = text(body.token, 300)
  const associate = token ? await findAssociateByToken(token) : null
  if (!associate) return NextResponse.json({ error: 'Invalid or expired onboarding link.' }, { status: 401 })

  const data = cleanBody(body)
  if (!data.legalName || !data.residentialAddress || !data.stateOfResidence || !data.emergencyContactName || !data.emergencyContactPhone || !data.bankName || !data.accountName || !data.accountNumber) {
    return NextResponse.json({ error: 'Please complete all required HR and payroll fields.' }, { status: 400 })
  }
  if (data.accountNumber !== data.confirmAccountNumber) {
    return NextResponse.json({ error: 'Account number confirmation does not match.' }, { status: 400 })
  }

  await upsertHrProfile(associate, data, true)
  await upsertPayrollDetails(associate, data)
  await markHrSubmitted(associate)
  return NextResponse.json({ ok: true })
}
