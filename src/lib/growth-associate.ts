export const recruitmentStages = [
  'Application Received',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Selected for Bootcamp',
  'Bootcamp In Progress',
  'Probation',
  'Official Growth Associate',
  'Rejected',
  'Withdrawn',
] as const

export type RecruitmentStage = (typeof recruitmentStages)[number]

export const recruitmentActions: Record<string, RecruitmentStage> = {
  review: 'Under Review',
  shortlist: 'Shortlisted',
  reject: 'Rejected',
  schedule_interview: 'Interview Scheduled',
  pass_interview: 'Selected for Bootcamp',
  fail_interview: 'Rejected',
  move_bootcamp: 'Bootcamp In Progress',
  move_probation: 'Probation',
  approve_official: 'Official Growth Associate',
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
  const leadership = text(input.leadershipExperience)
  const motivation = text(input.whyAmbassador)
  const choose = text(input.whyChooseYou)
  const sales = text(input.salesExperience || input.promotionExperience)
  const achievement = text(input.greatestAchievement)
  const video = text(input.videoAssessmentLink)
  const laptop = text(input.hasLaptop).toLowerCase()
  const internet = text(input.hasInternetAccess).toLowerCase()
  const status = text(input.currentStatus).toLowerCase()
  const reach = integer(input.estimatedReach)
  const weeklyHours = integer(input.weeklyHoursAvailable)
  const socialTotal = integer(input.facebookFollowers) + integer(input.tiktokFollowers) + integer(input.instagramFollowers) + integer(input.linkedInConnections)

  let score = 20
  if (motivation.length >= 80) score += 12
  if (choose.length >= 80) score += 10
  if (leadership.length >= 40) score += 10
  if (sales.length >= 40) score += 10
  if (achievement.length >= 40) score += 6
  if (video) score += 10
  if (laptop === 'yes') score += 6
  if (internet === 'yes') score += 6
  if (weeklyHours >= 5) score += 5
  if (reach >= 100) score += 6
  else if (reach >= 30) score += 3
  if (socialTotal >= 1000) score += 5
  else if (socialTotal >= 300) score += 3
  if (status.includes('serving') || status.includes('student') || status.includes('completed')) score += 4
  score = Math.min(score, 100)

  const recommendation = score >= 75 ? 'Strong Candidate' : score >= 50 ? 'Potential Candidate' : 'Not Recommended'
  const strengths = [
    motivation.length >= 80 ? 'Clear motivation for joining NEXORA.' : '',
    leadership.length >= 40 ? 'Shows leadership or community experience.' : '',
    sales.length >= 40 ? 'Has promotion, sales, or community-building exposure.' : '',
    video ? 'Submitted a video assessment link.' : '',
    laptop === 'yes' && internet === 'yes' ? 'Has basic digital readiness: laptop and internet access.' : '',
    reach >= 30 ? `Claims reachable audience of about ${reach} people.` : '',
  ].filter(Boolean)

  const weaknesses = [
    motivation.length < 80 ? 'Motivation answer needs more depth.' : '',
    !video ? 'No video assessment link provided.' : '',
    laptop !== 'yes' ? 'Laptop readiness is not confirmed.' : '',
    internet !== 'yes' ? 'Internet readiness is not fully confirmed.' : '',
    weeklyHours < 5 ? 'Weekly availability may be limited.' : '',
    socialTotal < 300 ? 'Social reach appears limited or was not provided.' : '',
  ].filter(Boolean)

  const questions = [
    'Tell us about a time you convinced people to join a program, event, product, or community.',
    'How would you explain NEXORA Institute to a final-year student or business owner in 60 seconds?',
    'What weekly activities can you commit to during the Growth Associate bootcamp?',
    'How would you handle a prospect who is interested but unsure about paying for AI training?',
  ]

  const roleFit = score >= 75
    ? 'Campus or community growth lead'
    : score >= 50
      ? 'Growth trainee with interview validation'
      : 'Needs further review before field activity'

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
