import assert from 'node:assert/strict'
import { COURSE_CATALOGUE, coursePriceNgn, findCourse, validateCourseSelection } from '../src/lib/accelerator-products.ts'

assert.equal(COURSE_CATALOGUE.length, 3)
assert.equal(coursePriceNgn, 10000)
assert.equal(findCourse('ai-finance')?.name, 'Business Analysis with AI')
assert.equal(findCourse('ai-no-code')?.name, 'AI No-Code & Vibe Coding')

for (const course of COURSE_CATALOGUE) {
  const result = validateCourseSelection([course.code])
  assert.equal(result.ok, true)
  assert.equal(result.amount, 10000)
}

const all = validateCourseSelection(COURSE_CATALOGUE.map((course) => course.code))
assert.equal(all.ok, true)
assert.equal(all.courses.length, 3)
assert.equal(all.amount, 30000)
assert.equal(validateCourseSelection([]).ok, false)
console.log('Independent course selection tests passed.')
