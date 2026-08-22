export const coursePriceNgn = 10_000

export const COURSE_CATALOGUE = [
  { code: 'AI_FINANCE', slug: 'business-analysis-with-ai', name: 'Business Analysis with AI', summary: 'Use AI and practical analysis methods to understand business needs, data and decisions.' },
  { code: 'AI_NO_CODE', slug: 'ai-no-code-vibe-coding', name: 'AI No-Code & Vibe Coding', summary: 'Build useful websites, workflows and digital products with AI-assisted no-code tools.' },
  { code: 'AI_CONTENT_CREATION', slug: 'ai-content-creation', name: 'AI Content Creation', summary: 'Plan, create and publish effective content with modern AI tools.' },
] as const

export type CourseCode = typeof COURSE_CATALOGUE[number]['code']

export function normalizeProductToken(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[_\s]+/g, '-') : ''
}

export function findCourse(value: unknown) {
  const token = normalizeProductToken(value)
  const aliases: Record<string, CourseCode> = {
    'ai-finance': 'AI_FINANCE',
    'ai-financial-business-analysis': 'AI_FINANCE',
    'ai-no-code': 'AI_NO_CODE',
    'ai-automation-no-code-solutions': 'AI_NO_CODE',
  }
  const resolved = aliases[token] || token.toUpperCase().replace(/-/g, '_')
  return COURSE_CATALOGUE.find((course) => course.code === resolved || course.slug === token) || null
}

export function validateCourseSelection(value: unknown) {
  const raw = Array.isArray(value) ? value : [value]
  const courses = Array.from(new Map(raw.map(findCourse).filter(Boolean).map((course) => [course!.code, course!])).values())
  if (!courses.length) return { ok: false as const, error: 'Select at least one valid course.' }
  return { ok: true as const, courses, amount: courses.length * coursePriceNgn }
}
