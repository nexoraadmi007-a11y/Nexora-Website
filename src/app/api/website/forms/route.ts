import { NextRequest, NextResponse } from 'next/server'
import { createRecord } from '@/lib/airtable'
import { captureLead } from '@/lib/lead-capture'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'

type Payload = Record<string, unknown>

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function phone(value: unknown) {
  return text(value, 80).replace(/[^0-9+]/g, '')
}

function utm(body: Payload) {
  return {
    'Source Page': text(body.sourcePage, 200),
    'UTM Source': text(body.utmSource, 120),
    'UTM Medium': text(body.utmMedium, 120),
    'UTM Campaign': text(body.utmCampaign, 120),
  }
}

async function notifyAdmin(message: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await sendTelegramMessage(chatId, message).catch((error) => {
    console.error('Website form Telegram notification failed', error instanceof Error ? error.message : error)
  })
}

function currentStatusFromCategory(category: string) {
  if (category === 'NYSC currently serving' || category === 'NYSC completed') return 'NYSC'
  if (category === 'Student') return 'Student'
  return 'Professional'
}

function nyscStatusFromCategory(category: string) {
  if (category === 'NYSC currently serving') return 'Serving'
  if (category === 'NYSC completed') return 'Completed'
  if (category === 'Student') return 'Student'
  return 'Not NYSC'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload
    const kind = text(body.kind, 40)
    const now = new Date().toISOString()

    if (kind === 'corporate') {
      const companyName = text(body.companyName, 180)
      const contactPerson = text(body.contactPerson, 160)
      const email = text(body.email, 254).toLowerCase()
      if (!companyName || !contactPerson || !email) {
        return NextResponse.json({ error: 'Company name, contact person, and email are required.' }, { status: 400 })
      }
      await createRecord('Corporate Inquiries', {
        'Company Name': companyName,
        'Contact Person': contactPerson,
        Role: text(body.role, 120),
        Email: email,
        Phone: phone(body.phone),
        Industry: text(body.industry, 120),
        Location: text(body.location, 160),
        'Training Interest': text(body.trainingInterest, 80) || 'Corporate AI Training',
        'Preferred Training Format': text(body.preferredTrainingFormat, 40) || 'Not Sure',
        'Training Need': text(body.message),
        Message: text(body.message),
        Status: 'New',
        'Date Submitted': now,
        ...utm(body),
      })
      const lead = await captureLead({
        ...body,
        platform: 'Website',
        programCode: 'BATP',
        currentStatus: 'Corporate Representative',
        interestAreas: ['BATP', 'Business AI Transformation', 'Corporate Training'],
        fullName: contactPerson,
        organization: companyName,
        employer: companyName,
        jobRole: text(body.role, 120),
        primaryGoal: 'Corporate AI training inquiry',
        biggestChallenge: text(body.message),
      })
      await notifyAdmin([
        'New NEXORA company inquiry',
        `Company: ${companyName}`,
        `Contact: ${contactPerson}`,
        `Email: ${email}`,
        `Interest: ${text(body.trainingInterest, 80) || 'Corporate AI Training'}`,
        `Lead score: ${lead.score}`,
        'Follow-up stage: New Corporate Inquiry',
        `AI summary: ${contactPerson} requested company AI training for ${companyName}. Need: ${text(body.message, 240)}.`,
      ].join('\n'))
      return NextResponse.json({ ok: true, message: 'Corporate inquiry submitted. Nexora will follow up.' }, { status: 201 })
    }

    const fullName = text(body.fullName, 160)
    const email = text(body.email, 254).toLowerCase()
    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 })
    }

    if (kind === 'webinar') {
      const programCode = text(body.programCode, 20).toUpperCase() === 'BATP' ? 'BATP' : text(body.programCode, 20).toUpperCase() === 'NGTP' ? 'NGTP' : ''
      await createRecord('Session Registrations', {
        'Full Name': fullName,
        Email: email,
        Phone: phone(body.phone),
        Occupation: text(body.occupation, 160),
        'NYSC Status': nyscStatusFromCategory(text(body.customerCategory, 60)),
        Webinar: text(body.webinarTitle, 200),
        'Audience Type': programCode === 'BATP' ? 'Business' : programCode === 'NGTP' ? 'Career' : 'Mixed',
        'CRM Sync Status': 'Synced',
        'Program Conversion Status': 'Interested',
        'Registration Date': new Date().toISOString().slice(0, 10),
        'Registration Source': 'Website',
        'Registration Status': 'Registered',
        'Attendance Status': 'Not Attended',
        'Engagement Points': 5,
        ...utm(body),
      })
      const lead = await captureLead({
        ...body,
        platform: 'Website',
        programCode,
        interestAreas: programCode === 'BATP' ? ['Webinars', 'BATP', 'Business AI Transformation'] : programCode === 'NGTP' ? ['Webinars', 'AI', 'NGTP'] : ['Webinars', 'AI'],
        currentStatus: text(body.customerCategory, 60),
        primaryGoal: 'Attend Nexora webinar',
      })
      await notifyAdmin([
        'New NEXORA webinar interest',
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Lead score: ${lead.score}`,
        'Follow-up stage: Webinar Interest',
        `AI summary: ${fullName} registered interest in a NEXORA AI session.`,
      ].join('\n'))
      return NextResponse.json({ ok: true, message: 'You are registered for the webinar.' }, { status: 201 })
    }

    const interestByKind: Record<string, string> = {
      accelerator: 'NGTP',
      batp: 'BATP',
      complete: 'Complete AI Accelerator',
      community: 'Community Membership',
      contact: text(body.inquiryType, 120) || 'General Inquiry',
    }
    const requestedCode = text(body.programCode, 20).toUpperCase()
    const programCode = kind === 'complete' || requestedCode === 'COMPLETE' ? 'COMPLETE' : kind === 'batp' || requestedCode === 'BATP' ? 'BATP' : kind === 'accelerator' || requestedCode === 'NGTP' ? 'NGTP' : ''
    const lead = await captureLead({
      ...body,
      platform: 'Website',
      programCode,
      currentStatus: text(body.customerCategory, 60),
      interestAreas: [
        kind === 'accelerator' ? 'NGTP' : '',
        kind === 'batp' ? 'BATP' : '',
        kind === 'batp' ? 'Business AI Transformation' : '',
        kind === 'complete' ? 'Complete AI Accelerator' : '',
        kind === 'complete' ? 'NGTP' : '',
        kind === 'complete' ? 'BATP' : '',
        kind === 'community' ? 'Community' : '',
        kind === 'contact' ? interestByKind[kind] : '',
      ].filter(Boolean),
      primaryGoal: kind === 'accelerator' ? 'Join the Nexura Institute AI Income Accelerator' : kind === 'batp' ? text(body.learningGoals || 'Join the Business Transformation Accelerator') : kind === 'complete' ? text(body.learningGoals || 'Join the Complete AI Accelerator') : text(body.message || body.communityInterest),
      biggestChallenge: text(body.biggestChallenge || body.businessChallenges),
      notes: [
        `Website form: ${kind}`,
        text(body.message),
        text(body.communityInterest),
        text(body.cohort) ? `Cohort: ${text(body.cohort)}` : '',
      ].filter(Boolean).join('\n'),
    })
    await notifyAdmin([
      'New NEXORA website inquiry',
      `Name: ${fullName}`,
      `Email: ${email}`,
      `Type: ${interestByKind[kind] || kind || 'General'}`,
      `Lead score: ${lead.score}`,
      `Follow-up stage: ${lead.status}`,
      `AI summary: ${fullName} submitted a ${kind || 'website'} inquiry. Goal/message: ${text(body.primaryGoal || body.learningGoals || body.message || body.communityInterest, 240)}.`,
    ].join('\n'))

    return NextResponse.json({ ok: true, message: 'Submitted successfully. Nexora will follow up.' }, { status: 201 })
  } catch (error) {
    console.error('Website form failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'We could not submit the form. Please try again.' }, { status: 500 })
  }
}
