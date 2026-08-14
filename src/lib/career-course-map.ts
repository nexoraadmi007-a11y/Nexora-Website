export const careerCourseMappings = [
  {
    programmeCode: 'AI_CONTENT_DIGITAL_MARKETING',
    canonicalSlug: 'ai-content-creation',
    supabaseSlug: 'ai-content-digital-marketing',
    legacySlugs: ['ai-content-digital-marketing'],
    legacyCodes: ['NGTP-CONTENT'],
    names: ['AI Content Creation', 'AI Content & Digital Marketing', 'Content Creation'],
  },
  {
    programmeCode: 'AI_UI_UX_DIGITAL_DESIGN',
    canonicalSlug: 'ui-ux-designer',
    supabaseSlug: 'ai-ui-ux-digital-design',
    legacySlugs: ['ai-ui-ux-digital-design'],
    legacyCodes: ['NGTP-UX'],
    names: ['Certified UI/UX Designer (AI-Powered)', 'AI UI/UX & Digital Design', 'UI/UX Designer'],
  },
  {
    programmeCode: 'AI_FINANCIAL_BUSINESS_ANALYSIS',
    canonicalSlug: 'ai-financial-analyst',
    supabaseSlug: 'ai-financial-business-analysis',
    legacySlugs: ['ai-financial-business-analysis'],
    legacyCodes: ['NGTP-FIN'],
    names: ['AI Financial Analyst', 'AI Financial & Business Analysis', 'Financial Analyst'],
  },
  {
    programmeCode: 'AI_AUTOMATION_NO_CODE',
    canonicalSlug: 'ai-automation-no-code',
    supabaseSlug: 'ai-automation-no-code-solutions',
    legacySlugs: ['ai-automation-no-code-solutions'],
    legacyCodes: ['NGTP-AUTO'],
    names: ['AI Automation & No-Code Solutions', 'AI Automation', 'No-Code Solutions'],
  },
] as const

export type CareerCourseProgrammeCode = typeof careerCourseMappings[number]['programmeCode']

export function normalizeCareerCourseSlug(value: unknown) {
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
