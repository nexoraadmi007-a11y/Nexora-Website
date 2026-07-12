export const recruitmentStages = [
  'Application Received',
  'Interview Scheduled',
  'Interview Passed',
  'Rejected',
  'Withdrawn',
] as const

export type RecruitmentStage = (typeof recruitmentStages)[number]

export const recruitmentActions: Record<string, RecruitmentStage> = {
  reject: 'Rejected',
  schedule_interview: 'Interview Scheduled',
  pass_interview: 'Interview Passed',
  fail_interview: 'Rejected',
  withdraw: 'Withdrawn',
}

export function isRecruitmentStage(value: string): value is RecruitmentStage {
  return recruitmentStages.includes(value as RecruitmentStage)
}

export function text(value: unknown, max = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function integer(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0
}

export function codeFromName(name: string, fallback: string) {
  const letters = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  const prefix = (letters[0]?.slice(0, 3) || 'NEX') + (letters[1]?.slice(0, 2) || '')
  const suffix = fallback.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase() || Math.random().toString(36).slice(2, 7).toUpperCase()
  return `NEX-${prefix}-${suffix}`
}

export function screenGrowthAssociate(input: Record<string, unknown>) {
  const fullName = text(input.fullName, 160)
  const email = text(input.email, 254)
  const phone = text(input.phoneNumber || input.whatsAppNumber, 80)
  const whatsApp = text(input.whatsAppNumber, 80)
  const gender = text(input.gender, 80)
  const state = text(input.state, 120)

  let score = 35
  if (fullName) score += 10
  if (email) score += 15
  if (phone) score += 15
  if (whatsApp) score += 10
  if (gender) score += 5
  if (state) score += 10
  score = Math.min(score, 100)

  const recommendation = score >= 80 ? 'Complete Contact Profile' : score >= 60 ? 'Contact Profile Needs Review' : 'Incomplete Contact Profile'
  const strengths = [
    email ? 'Email address provided.' : '',
    phone ? 'Phone number provided.' : '',
    whatsApp ? 'WhatsApp number provided.' : '',
    state ? `State provided: ${state}.` : '',
  ].filter(Boolean)

  const weaknesses = [
    !email ? 'Email address was not provided.' : '',
    !whatsApp ? 'WhatsApp number was not provided.' : '',
    !gender ? 'Gender was not provided.' : '',
    !state ? 'State was not provided.' : '',
  ].filter(Boolean)

  const questions = [
    'Tell us about a time you convinced people to join a program, event, product, or community.',
    'How would you explain NEXORA Institute to a final-year student or business owner in 60 seconds?',
    'How would you consistently generate qualified applications as a paid Growth Associate?',
    'How would you handle a prospect who is interested but unsure about paying for AI training?',
  ]

  const roleFit = score >= 80
    ? 'Ready for interview screening'
    : score >= 60
      ? 'Contact details require admin review'
      : 'Incomplete first-stage application'

  return {
    score,
    recommendation,
    strengths: strengths.length ? strengths.join('\n') : 'No strong signal detected yet.',
    weaknesses: weaknesses.length ? weaknesses.join('\n') : 'No major weakness detected from submitted fields.',
    questions: questions.join('\n'),
    roleFit,
    summary: `AI screening score ${score}/100. Recommendation: ${recommendation}. Suggested fit: ${roleFit}.`,
  }
}

export function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}
