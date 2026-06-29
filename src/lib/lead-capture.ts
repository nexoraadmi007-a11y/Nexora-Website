import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from '@/lib/airtable'

type LeadInput = Record<string, unknown>
type ContactFields = Record<string, any>

const platformToLeadSource: Record<string, string> = {
  Website: 'Website',
  'Landing Page': 'Website',
  Instagram: 'Instagram',
  Facebook: 'Facebook',
  LinkedIn: 'LinkedIn',
  TikTok: 'TikTok',
  YouTube: 'Other',
  Telegram: 'Other',
  WhatsApp: 'WhatsApp',
  'QR Code': 'Event',
  'Referral Link': 'Referral',
  'Campus Outreach': 'Event',
  'NYSC Event': 'Event',
  'Corporate Partnership': 'Partner Campaign',
  'Ambassador Campaign': 'Ambassador',
  Manual: 'Other',
}

export function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function phone(value: unknown) {
  return text(value, 80).replace(/[^0-9+]/g, '')
}

function normalizeDigits(value: unknown) {
  return text(value, 80).replace(/[^0-9]/g, '')
}

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => text(item, 80)).filter(Boolean)
  const raw = text(value)
  if (!raw) return []
  return raw.split(',').map((item) => item.trim()).filter(Boolean)
}

function currentStatus(category: string) {
  if (category.includes('NYSC')) return 'NYSC'
  if (category === 'Undergraduate' || category === 'Student') return 'Student'
  if (category === 'Graduate') return 'Graduate'
  if (category === 'Business Owner' || category === 'Business owner' || category === 'Entrepreneur') return 'Entrepreneur'
  return 'Professional'
}

function professionalCategory(category: string) {
  const map: Record<string, string> = {
    'Business owner': 'Business Owner',
    Entrepreneur: 'Business Owner',
    'Corporate representative': 'Corporate Representative',
    'Young professional': 'Young Professional',
    'Working professional': 'Working Professional',
    Graduate: 'Graduate',
    'Final-year student': 'Undergraduate',
    Student: 'Undergraduate',
  }
  return map[category] || category
}

function industry(value: unknown) {
  const raw = text(value, 80)
  const allowed = new Set(['Banking', 'Risk', 'Accounting', 'Finance', 'Marketing', 'Technology', 'Healthcare', 'Education', 'Government', 'Entrepreneurship', 'Other'])
  if (allowed.has(raw)) return raw
  if (['Fintech', 'Insurance', 'Consulting', 'Logistics', 'Professional Services'].includes(raw)) return 'Finance'
  if (raw) return 'Other'
  return ''
}

function mapInterests(values: string[]) {
  const mapped = new Set<string>()
  for (const value of values) {
    if (value === 'NGTP' || value === 'Career Accelerator') mapped.add('NGTP')
    if (value === 'BATP' || value === 'Business AI Transformation' || value === 'Business AI Transformation Program') mapped.add('Partnerships')
    if (value === 'Corporate Training') mapped.add('Partnerships')
    if (value === 'Community') mapped.add('Community Membership')
    if (value === 'Webinars' || value === 'AI') mapped.add('NEXORA Intelligence Sessions')
  }
  return Array.from(mapped)
}

function programCode(input: LeadInput, interests: string[]) {
  const explicit = text(input.programCode || input.program || input.programApplied, 40).toUpperCase()
  if (explicit.includes('BATP')) return 'BATP'
  if (explicit.includes('NGTP')) return 'NGTP'
  const haystack = [
    ...interests,
    text(input.businessName),
    text(input.companyName),
    text(input.organizationType),
    text(input.businessChallenges),
    text(input.learningGoals),
    text(input.currentStatus),
    text(input.customerCategory),
  ].join(' ').toLowerCase()
  if (haystack.includes('batp') || haystack.includes('business') || haystack.includes('sme') || haystack.includes('startup') || haystack.includes('entrepreneur') || haystack.includes('corporate')) return 'BATP'
  return 'NGTP'
}

function qualificationScore(input: LeadInput, interests: string[]) {
  let score = 0
  if (text(input.fullName) && (text(input.email) || phone(input.phone) || phone(input.whatsAppNumber))) score += 10
  if (interests.includes('NGTP') || interests.includes('Career Accelerator')) score += 25
  if (interests.includes('Community') || interests.includes('Webinars')) score += 10
  if (interests.includes('Corporate Training') || text(input.currentStatus) === 'Corporate Representative') score += 30
  if (text(input.referralCode)) score += 15
  if (text(input.primaryGoal) || text(input.biggestChallenge)) score += 10
  return score
}

function careerScore(input: LeadInput, interests: string[]) {
  let score = 0
  const category = text(input.currentStatus || input.customerCategory, 120)
  if (['NYSC currently serving', 'NYSC completed', 'Final-year student', 'Graduate', 'Young Professional', 'Working Professional'].includes(category)) score += 25
  if (interests.some((interest) => ['NGTP', 'Career Accelerator', 'Webinars', 'Career Growth'].includes(interest))) score += 25
  if (text(input.primaryGoal) || text(input.professionalGoals)) score += 15
  if (text(input.biggestChallenge) || text(input.careerChallenges)) score += 10
  if (text(input.institution) || text(input.courseOfStudy) || text(input.jobRole || input.jobTitle)) score += 10
  if (text(input.email) && phone(input.phone || input.whatsAppNumber)) score += 15
  return Math.min(score, 100)
}

function businessScore(input: LeadInput, interests: string[]) {
  let score = 0
  const category = text(input.currentStatus || input.customerCategory, 120)
  if (['Business owner', 'Business Owner', 'Entrepreneur', 'Corporate representative', 'Corporate Representative'].includes(category)) score += 25
  if (interests.some((interest) => ['BATP', 'Business AI Transformation', 'Business AI Transformation Program', 'Corporate Training'].includes(interest))) score += 25
  if (text(input.businessName || input.companyName || input.organization)) score += 15
  if (text(input.businessChallenges) || text(input.biggestChallenge)) score += 15
  if (text(input.learningGoals) || text(input.primaryGoal)) score += 10
  if (text(input.currentAIUsage)) score += 5
  if (text(input.website) || text(input.linkedIn)) score += 5
  return Math.min(score, 100)
}

function corporateOpportunityScore(input: LeadInput, business: number) {
  let score = Math.floor(business * 0.5)
  const size = text(input.businessSize, 40)
  const employees = Number(text(input.numberOfEmployees || input.employeeCount, 8)) || 0
  if (['11-50', '51-200', '201+'].includes(size) || employees >= 11) score += 25
  if (text(input.organizationType).toLowerCase().includes('corporate')) score += 20
  if (text(input.preferredTrainingFormat) || text(input.trainingInterest)) score += 10
  return Math.min(score, 100)
}

function enrollmentProbability(score: number, career: number, business: number) {
  return Math.min(100, Math.round((score + Math.max(career, business)) / 2))
}

function qualificationStatus(score: number) {
  if (score >= 70) return 'High Potential'
  if (score >= 40) return 'Qualified'
  if (score >= 15) return 'Partially Qualified'
  return 'Unqualified'
}

async function findAmbassador(referralCode: string) {
  if (!referralCode) return null
  const records = await listRecords<ContactFields>('Ambassadors', {
    formula: `{Referral Code}='${escapeFormula(referralCode)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

async function findProgram(code: string) {
  if (!code) return null
  const records = await listRecords<ContactFields>('Programmes', {
    formula: `{Programme Code}='${escapeFormula(code)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

async function findExistingContact(input: LeadInput) {
  const email = text(input.email, 254).toLowerCase()
  const phoneDigits = normalizeDigits(input.phone || input.whatsAppNumber)

  if (email) {
    const byEmail = await listRecords<ContactFields>('Master Contacts', {
      formula: `LOWER({Email})='${escapeFormula(email)}'`,
      maxRecords: 1,
    })
    if (byEmail[0]) return byEmail[0]
  }

  if (phoneDigits) {
    const contacts = await listRecords<ContactFields>('Master Contacts', { maxRecords: 100 })
    return contacts.find((contact) => {
      const phoneMatch = normalizeDigits(contact.fields['Phone Number']) === phoneDigits
      const whatsAppMatch = normalizeDigits(contact.fields['WhatsApp Number']) === phoneDigits
      return phoneMatch || whatsAppMatch
    }) || null
  }

  return null
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

export async function captureLead(input: LeadInput) {
  const platform = text(input.platform, 80) || 'Website'
  const sourcePage = text(input.sourcePage || input.landingPage, 240)
  const category = text(input.currentStatus || input.customerCategory, 80)
  const interests = arr(input.interestAreas || input.interests)
  const selectedProgramCode = programCode(input, interests)
  const score = qualificationScore(input, interests)
  const career = careerScore(input, interests)
  const business = businessScore(input, interests)
  const corporate = corporateOpportunityScore(input, business)
  const probability = enrollmentProbability(score, career, business)
  const referralCode = text(input.referralCode, 120)
  const ambassador = await findAmbassador(referralCode)
  const program = await findProgram(selectedProgramCode)
  const existing = await findExistingContact(input)
  const now = new Date()
  const nowIso = now.toISOString()
  const nowDate = nowIso.slice(0, 10)
  const leadSource = ambassador ? 'Ambassador' : platformToLeadSource[platform] || 'Other'
  const nexoraInterests = mapInterests(interests)

  const fields = compact({
    'Full Name': text(input.fullName, 160),
    Email: text(input.email, 254).toLowerCase(),
    'Phone Number': phone(input.phone || input.whatsAppNumber),
    'WhatsApp Number': phone(input.whatsAppNumber || input.phone),
    'Telegram Username': text(input.telegramUsername, 120),
    'Telegram Chat ID': text(input.telegramChatId || (platform === 'Telegram' ? input.platformUserId : ''), 120),
    Gender: text(input.gender, 40),
    Location: text(input.location || input.state, 160),
    'Current Status': currentStatus(category),
    Institution: text(input.institution, 200),
    'Course of Study': text(input.courseOfStudy, 200),
    'Graduation Year': Number(text(input.graduationYear, 4)) || undefined,
    Employer: text(input.employer, 200),
    'Job Title': text(input.jobRole || input.jobTitle, 160),
    Organization: text(input.employer || input.organization, 200),
    Industry: industry(input.industry),
    'Years of Experience': Number(text(input.yearsOfExperience, 3)) || undefined,
    'Primary Goal': text(input.primaryGoal),
    'Biggest Challenge': text(input.biggestChallenge),
    'Primary Program Interest': selectedProgramCode,
    'Program Applied': text(input.programApplied, 40).toUpperCase().includes(selectedProgramCode) ? selectedProgramCode : undefined,
    'Business Name': text(input.businessName, 200),
    'Business Size': text(input.businessSize, 80),
    'Company Name': text(input.companyName || input.organization, 200),
    'Organization Type': text(input.organizationType, 120),
    'Business Challenges': text(input.businessChallenges || input.biggestChallenge),
    'Learning Goals': text(input.learningGoals || input.primaryGoal),
    'Current AI Usage': text(input.currentAIUsage, 80),
    Website: text(input.website, 240).startsWith('http') ? text(input.website, 240) : undefined,
    LinkedIn: text(input.linkedIn, 240).startsWith('http') ? text(input.linkedIn, 240) : undefined,
    'Enrollment Status': 'Interested',
    'Corporate Lead': selectedProgramCode === 'BATP' || corporate >= 50,
    'Career Score': career,
    'Business Score': business,
    'Corporate Opportunity Score': corporate,
    'Enrollment Probability': probability,
    'Priority Score': Math.max(score, career, business, corporate),
    'Career Challenges': text(input.biggestChallenge),
    'Professional Goals': text(input.primaryGoal),
    'First Contact Platform': platform,
    'Campaign Source': text(input.campaignSource || input.campaign, 160),
    'Landing Page': sourcePage.startsWith('http') ? sourcePage : undefined,
    'Ad Identifier': text(input.adIdentifier, 160),
    'Referral Partner': text(input.referralPartner, 160),
    'QR Campaign': text(input.qrCampaign, 160),
    'Organic Source': text(input.organicSource, 160),
    'UTM Source': text(input.utmSource, 120),
    'UTM Medium': text(input.utmMedium, 120),
    'UTM Campaign': text(input.utmCampaign, 120),
    'Date Joined': nowDate,
    'Community Notes': interests.length ? `Interest areas: ${interests.join(', ')}` : undefined,
    'Professional Category': professionalCategory(category),
    'Qualification Score': score,
    'Lead Qualification Status': qualificationStatus(score),
    'Conversation Memory Status': 'In Progress',
    'Lifecycle Stage': nexoraInterests.includes('Community Membership') ? 'Member' : 'Lead',
    'Engagement Score': Math.max(5, score),
    'Lead Capture Status': 'New Submission',
    'Website Source URL': sourcePage.startsWith('http') ? sourcePage : undefined,
    'Referral Code Used': referralCode,
    ...(ambassador ? { 'Referred By Ambassador': [ambassador.id] } : {}),
    ...(program ? { 'Programme Interests': [program.id] } : {}),
    'Referral Attribution Date': ambassador ? nowDate : undefined,
    'Communications Consent': true,
    'WhatsApp Opt-In': Boolean(phone(input.whatsAppNumber || input.phone)),
    Notes: [
      existing ? 'Omnichannel lead update.' : 'Omnichannel lead captured.',
      text(input.notes),
      referralCode ? `Referral code: ${referralCode}` : '',
    ].filter(Boolean).join('\n'),
  })

  const contact = existing
    ? await updateRecord<AirtableRecord<ContactFields>>('Master Contacts', existing.id, fields)
    : await createRecord<AirtableRecord<ContactFields>>('Master Contacts', fields)

  await createRecord('Lead Source Attributions', compact({
    'Attribution ID': `ATTR-${Date.now()}`,
    Contact: [contact.id],
    Platform: platform,
    Campaign: text(input.campaignSource || input.campaign, 160),
    'Landing Page': sourcePage.startsWith('http') ? sourcePage : undefined,
    'Ad Identifier': text(input.adIdentifier, 160),
    ...(ambassador ? { Ambassador: [ambassador.id] } : {}),
    'Referral Code': referralCode,
    'Referral Partner': text(input.referralPartner, 160),
    'QR Campaign': text(input.qrCampaign, 160),
    'Organic Source': text(input.organicSource, 160),
    'UTM Source': text(input.utmSource, 120),
    'UTM Medium': text(input.utmMedium, 120),
    'UTM Campaign': text(input.utmCampaign, 120),
    'Captured At': nowIso,
  }))

  await createRecord('Lead Capture Conversations', compact({
    'Conversation ID': text(input.conversationId, 160) || `CONV-${Date.now()}`,
    Contact: [contact.id],
    Platform: platform,
    'Platform User ID': text(input.platformUserId, 160),
    'Conversation Status': score >= 40 ? 'Qualified' : 'In Progress',
    'Last Message At': nowIso,
    'Last User Message': text(input.lastUserMessage || input.message),
    'Known Fields': [
      text(input.fullName) ? 'Full Name' : '',
      phone(input.whatsAppNumber || input.phone) ? 'WhatsApp Number' : '',
      text(input.email) ? 'Email Address' : '',
      text(input.gender) ? 'Gender' : '',
      category ? 'Current Status' : '',
      text(input.institution) ? 'Institution' : '',
      text(input.courseOfStudy) ? 'Course of Study' : '',
      text(input.graduationYear) ? 'Graduation Year' : '',
      text(input.employer) ? 'Employer' : '',
      text(input.jobRole || input.jobTitle) ? 'Job Role' : '',
      text(input.industry) ? 'Industry' : '',
      text(input.yearsOfExperience) ? 'Years of Experience' : '',
      text(input.location || input.state) ? 'Location' : '',
      interests.length ? 'Interest Areas' : '',
      text(input.primaryGoal) ? 'Primary Goal' : '',
      text(input.biggestChallenge) ? 'Biggest Challenge' : '',
      arr(input.preferredWebinarTopics).length ? 'Preferred Webinar Topics' : '',
      referralCode ? 'Referral Code' : '',
      text(input.campaignSource || input.campaign) ? 'Campaign Source' : '',
    ].filter(Boolean),
    'Missing Fields': ['Full Name', 'WhatsApp Number', 'Email Address', 'Current Status', 'Location', 'Interest Areas', 'Primary Goal', 'Biggest Challenge'].filter((field) => {
      const key = field.toLowerCase().replaceAll(' ', '')
      const payload = JSON.stringify(input).toLowerCase().replaceAll(' ', '')
      return !payload.includes(key)
    }),
    'Conversation Summary': text(input.conversationSummary || input.notes),
    'Next Question': score >= 40 ? 'Invite to the most relevant next step.' : 'Ask one missing qualification question naturally.',
    'Raw Payload': JSON.stringify(input).slice(0, 9000),
  }))

  return { contact, created: !existing, score, status: qualificationStatus(score) }
}
