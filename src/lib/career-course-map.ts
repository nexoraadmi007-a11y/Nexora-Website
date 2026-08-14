import { AI_INCOME_ACCELERATOR_TRACKS, findAiIncomeTrack } from './accelerator-products'

export const careerCourseMappings = [
  {
    programmeCode: 'AI_FINANCE',
    canonicalSlug: 'ai-finance',
    supabaseSlug: 'ai-finance',
    legacySlugs: ['ai-financial-analyst', 'ai-financial-business-analysis'],
    legacyCodes: ['NGTP-FIN', 'AI_FINANCIAL_BUSINESS_ANALYSIS'],
    names: ['AI Finance', 'AI Financial Analyst', 'AI Financial & Business Analysis'],
  },
  {
    programmeCode: 'AI_CONTENT_CREATION',
    canonicalSlug: 'ai-content-creation',
    supabaseSlug: 'ai-content-creation',
    legacySlugs: ['ai-content-digital-marketing'],
    legacyCodes: ['NGTP-CONTENT', 'AI_CONTENT_DIGITAL_MARKETING'],
    names: ['AI Content Creation', 'AI Content & Digital Marketing', 'Content Creation'],
  },
  {
    programmeCode: 'AI_NO_CODE',
    canonicalSlug: 'ai-no-code',
    supabaseSlug: 'ai-no-code',
    legacySlugs: ['ai-automation-no-code', 'ai-automation-no-code-solutions'],
    legacyCodes: ['NGTP-AUTO', 'AI_AUTOMATION_NO_CODE'],
    names: ['AI No-Code', 'AI Automation & No-Code Solutions', 'No-Code Solutions'],
  },
  {
    programmeCode: 'AI_BUSINESS',
    canonicalSlug: 'ai-business',
    supabaseSlug: 'ai-business',
    legacySlugs: ['ui-ux-designer', 'ai-ui-ux-digital-design'],
    legacyCodes: ['NGTP-UX', 'AI_UI_UX_DIGITAL_DESIGN'],
    names: ['AI Business', 'AI UI/UX & Digital Design', 'UI/UX Designer'],
  },
] as const

export type CareerCourseProgrammeCode = typeof careerCourseMappings[number]['programmeCode']

export function normalizeCareerCourseSlug(value: unknown) {
  const productTrack = findAiIncomeTrack(value)
  if (productTrack) return productTrack.slug
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!raw) return ''
  const match = careerCourseMappings.find((item) => {
    const candidates = [
      item.programmeCode,
      item.canonicalSlug,
      item.supabaseSlug,
      ...item.legacySlugs,
      ...item.legacyCodes,
      ...item.names,
    ].map((candidate) => candidate.toLowerCase())
    return candidates.includes(raw)
  })
  return match?.canonicalSlug || raw
}

export function careerCourseBySlug(value: unknown) {
  const slug = normalizeCareerCourseSlug(value)
  return careerCourseMappings.find((item) => item.canonicalSlug === slug) || null
}

export function careerCourseByName(value: unknown) {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!raw) return null
  return careerCourseMappings.find((item) => item.names.some((name) => name.toLowerCase() === raw)) || null
}

export function courseOptionsFromSourceOfTruth() {
  return AI_INCOME_ACCELERATOR_TRACKS.map((track) => ({
    code: track.programmeCode,
    slug: track.slug,
    name: track.label,
    summary: track.summary,
  }))
}
