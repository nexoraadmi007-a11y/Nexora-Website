import { NextRequest, NextResponse } from 'next/server'
import { createRecord, escapeFormula, listRecords } from '@/lib/airtable'
import { captureLead } from '@/lib/lead-capture'

export const runtime = 'nodejs'

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function phone(value: unknown) {
  return text(value, 80).replace(/[^0-9+]/g, '')
}

async function findAmbassador(referralCode: string) {
  if (!referralCode) return null
  const records = await listRecords<Record<string, any>>('Ambassadors', {
    formula: `{Referral Code}='${escapeFormula(referralCode)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

async function findProgram(code: string) {
  const records = await listRecords<Record<string, any>>('Programmes', {
    formula: `{Programme Code}='${escapeFormula(code)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

async function createApplication(body: Record<string, unknown>, contactId: string, programId: string | undefined, programCode: string, reference: string) {
  const isBusiness = programCode === 'BATP'
  return createRecord('NGTP Applications', compact({
    'Application ID': `APP-${Date.now()}`,
    Applicant: [contactId],
    ...(programId ? { 'Selected Programme': [programId] } : {}),
    'Application Program': programCode,
    'Application Track': isBusiness ? 'Business' : 'Career',
    'Application Stage': 'Submitted',
    'Submitted At': new Date().toISOString().slice(0, 10),
    'Career Vision': isBusiness ? text(body.growthGoals || body.learningGoals) : text(body.primaryGoal),
    'Professional Challenges': isBusiness ? text(body.businessChallenges) : text(body.biggestChallenge),
    'Why NEXORA?': text(body.learningGoals || body.primaryGoal || body.message),
    'Problem-Solving Example': text(body.problemSolvingExample || body.currentTechnologyUsage || body.currentAIUsage),
    'Relevant Experience': text(body.relevantExperience || body.currentMarketing),
    'Business Name': text(body.businessName),
    'Years in Business': Number(text(body.yearsInBusiness, 8)) || undefined,
    'Number of Employees': Number(text(body.numberOfEmployees, 8)) || undefined,
    'Monthly Customers': Number(text(body.monthlyCustomers, 8)) || undefined,
    'Business Challenges': text(body.businessChallenges),
    'Current Marketing': text(body.currentMarketing),
    'Current Technology Usage': text(body.currentTechnologyUsage || body.currentAIUsage),
    'Growth Goals': text(body.growthGoals || body.learningGoals),
    'Website Submission ID': reference,
    'Website Source URL': text(body.sourcePage, 200),
    'Communications Consent': true,
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fullName = text(body.fullName, 160)
    const email = text(body.email, 254).toLowerCase()
    const amount = Number(body.amount || 25000)
    const programCode = text(body.programCode, 20).toUpperCase() === 'BATP' ? 'BATP' : 'NGTP'
    const programName = text(body.programName, 160) || (programCode === 'BATP' ? 'Business AI Transformation Program' : 'NEXORA Graduate Training Program')
    const sourcePage = text(body.sourcePage, 200)
    const referralCode = text(body.referralCode, 120)
    const ambassador = await findAmbassador(referralCode)
    const program = await findProgram(programCode)
    const commissionPercent = ambassador ? 5 : 0
    const commissionAmount = ambassador ? Math.round(amount * 0.05) : 0
    const reference = `NEXORA-${programCode}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 })
    }

    const lead = await captureLead({
      ...body,
      email,
      fullName,
      platform: 'Website',
      programCode,
      programApplied: programCode,
      interestAreas: programCode === 'BATP' ? ['BATP', 'Business AI Transformation'] : ['NGTP', 'Career Accelerator'],
      currentStatus: text(body.customerCategory, 80),
      primaryGoal: text(body.primaryGoal || body.learningGoals || body.growthGoals),
      biggestChallenge: text(body.biggestChallenge || body.businessChallenges),
      notes: `Payment/application initialized for ${programCode}. Reference: ${reference}`,
    })

    await createApplication(body, lead.contact.id, program?.id, programCode, reference)

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      if (ambassador) {
        await createRecord('Ambassador Referrals', compact({
          'Referral ID': `REF-${Date.now()}`,
          Ambassador: [ambassador.id],
          'Referred Contact': [lead.contact.id],
          ...(program ? { Programme: [program.id] } : {}),
          'Referral Code': referralCode,
          'Referral Date': new Date().toISOString().slice(0, 10),
          'Referral Status': 'Submitted',
          'Programme Fee': amount,
          'Commission Percent': commissionPercent,
          'Commission Amount': commissionAmount,
          'Commission Status': 'Pending',
          'Source Page': sourcePage,
          'Payment Reference': reference,
          Notes: `${programCode} application captured before Paystack was configured.`,
        }))
      }
      return NextResponse.json({ error: `Online payment is not configured yet. Nexora has received your ${programCode} application interest.` }, { status: 503 })
    }

    const slug = programCode === 'BATP' ? 'business-ai-transformation' : 'career-accelerator'
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        currency: 'NGN',
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink'}/${slug}?payment=complete&reference=${reference}`,
        metadata: {
          full_name: fullName,
          phone: phone(body.phone),
          program: programName,
          program_code: programCode,
          cohort: text(body.cohort, 160),
          source_page: sourcePage,
          referral_code: referralCode,
          ambassador_record_id: ambassador?.id || '',
          commission_percent: commissionPercent,
          commission_amount: commissionAmount,
        },
      }),
      cache: 'no-store',
    })
    const data = await response.json()
    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Paystack initialization failed')
    }

    await createRecord('Website Payment Events', compact({
      'Payment Reference': reference,
      'Full Name': fullName,
      Email: email,
      Phone: phone(body.phone),
      Program: programName,
      Cohort: text(body.cohort, 160),
      'Referral Code': referralCode,
      ...(ambassador ? { Ambassador: [ambassador.id] } : {}),
      'Commission Percent': commissionPercent,
      'Commission Amount': commissionAmount,
      Amount: amount,
      Currency: 'NGN',
      'Payment Status': 'Initialized',
      'Paystack Authorization URL': data.data.authorization_url,
      'Paystack Access Code': data.data.access_code,
      'Source Page': sourcePage,
      'Date Submitted': new Date().toISOString(),
      'Raw Response': JSON.stringify(data).slice(0, 9000),
    }))

    if (ambassador) {
      await createRecord('Ambassador Referrals', compact({
        'Referral ID': `REF-${Date.now()}`,
        Ambassador: [ambassador.id],
        'Referred Contact': [lead.contact.id],
        ...(program ? { Programme: [program.id] } : {}),
        'Referral Code': referralCode,
        'Referral Date': new Date().toISOString().slice(0, 10),
        'Referral Status': 'Submitted',
        'Programme Fee': amount,
        'Commission Percent': commissionPercent,
        'Commission Amount': commissionAmount,
        'Commission Status': 'Pending',
        'Source Page': sourcePage,
        'Payment Reference': reference,
        Notes: `${programCode} website payment initialized through Paystack.`,
      }))
    }

    return NextResponse.json({ ok: true, authorizationUrl: data.data.authorization_url, reference })
  } catch (error) {
    console.error('Paystack initialization failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Payment could not be initialized. Please try again.' }, { status: 500 })
  }
}
