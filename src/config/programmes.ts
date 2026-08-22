import { COURSE_CATALOGUE, CourseCode, coursePriceNgn, findCourse } from '@/lib/accelerator-products'

export type ProgrammeCode = CourseCode
export type TrackCode = never
export type ProgrammeTrack = { code: string; slug: string; name: string; summary: string; learn: string[]; projects: string[]; services: string[]; tools: string[] }
export type Programme = { code: ProgrammeCode; legacyCode: string; slug: string; name: string; priceNgn: number; listPriceNgn: number; duration: string; audience: string[]; proposition: string; outcomes: string[]; tracks: ProgrammeTrack[] }

const detail: Record<CourseCode, Pick<Programme, 'duration' | 'audience' | 'proposition' | 'outcomes'>> = {
  AI_FINANCE: { duration: 'Instructor-led course', audience: ['Students', 'Professionals', 'Career switchers', 'Business owners'], proposition: 'Learn practical business analysis and use AI to turn information into better decisions.', outcomes: ['Business analysis foundations', 'AI-supported research', 'Requirements and process skills', 'Portfolio-ready work'] },
  AI_NO_CODE: { duration: 'Instructor-led course', audience: ['Beginners', 'Creators', 'Founders', 'Career switchers'], proposition: 'Build useful digital products and automations with AI, no-code tools and vibe coding.', outcomes: ['Working digital products', 'AI-assisted building workflow', 'Automation foundations', 'Portfolio-ready work'] },
  AI_CONTENT_CREATION: { duration: 'Instructor-led course', audience: ['Creators', 'Marketers', 'Business owners', 'Career switchers'], proposition: 'Create stronger content faster with practical strategy and modern AI tools.', outcomes: ['Content strategy', 'AI-assisted production', 'Publishing workflow', 'Portfolio-ready work'] },
}

export const programmes: Programme[] = COURSE_CATALOGUE.map((course) => ({ code: course.code, legacyCode: course.code, slug: course.slug, name: course.name, priceNgn: coursePriceNgn, listPriceNgn: coursePriceNgn, tracks: [], ...detail[course.code] }))
export const aiIncomeTracks: ProgrammeTrack[] = []
export const skillToIncomeModule = { title: 'From Skill to Income', topics: ['Positioning your skill', 'Building proof of work', 'Finding opportunities', 'Client delivery'] }
export function formatNaira(value: number) { return `₦${value.toLocaleString('en-NG')}` }
export function findProgramme(value: string) { const course = findCourse(value); return course ? programmes.find((item) => item.code === course.code) : undefined }
export function findTrack() { return undefined }
