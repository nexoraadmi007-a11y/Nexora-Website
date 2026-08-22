import { COURSE_CATALOGUE, findCourse } from './accelerator-products'

export const careerCourseMappings = COURSE_CATALOGUE.map((course) => ({
  programmeCode: course.code,
  canonicalSlug: course.slug,
  supabaseSlug: course.slug,
  legacySlugs: [],
  legacyCodes: [],
  names: [course.name],
}))

export type CareerCourseProgrammeCode = typeof COURSE_CATALOGUE[number]['code']

export function normalizeCareerCourseSlug(value: unknown) {
  return findCourse(value)?.slug || (typeof value === 'string' ? value.trim().toLowerCase() : '')
}

export function careerCourseBySlug(value: unknown) {
  const course = findCourse(value)
  return course ? careerCourseMappings.find((item) => item.programmeCode === course.code) || null : null
}

export function careerCourseByName(value: unknown) { return careerCourseBySlug(value) }

export function courseOptionsFromSourceOfTruth() { return COURSE_CATALOGUE.map((course) => ({ ...course })) }
