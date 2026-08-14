import assert from 'node:assert/strict'
import {
  AI_INCOME_ACCELERATOR_PROGRAM,
  BUSINESS_ACCELERATOR_PROGRAM,
  validateAcceleratorSelection,
} from '../src/lib/accelerator-products.ts'

function pass(program, track, expected) {
  const result = validateAcceleratorSelection({ program, track })
  assert.equal(result.ok, true, `${program}/${track} should pass`)
  assert.deepEqual(result.product, expected)
}

function fail(program, track) {
  const result = validateAcceleratorSelection({ program, track })
  assert.equal(result.ok, false, `${program}/${track} should fail`)
}

pass(AI_INCOME_ACCELERATOR_PROGRAM, 'ai_finance', {
  program: AI_INCOME_ACCELERATOR_PROGRAM,
  track: 'ai_finance',
  amount: 10000,
})
pass(AI_INCOME_ACCELERATOR_PROGRAM, 'ai_content_creation', {
  program: AI_INCOME_ACCELERATOR_PROGRAM,
  track: 'ai_content_creation',
  amount: 10000,
})
pass(AI_INCOME_ACCELERATOR_PROGRAM, 'ai_no_code', {
  program: AI_INCOME_ACCELERATOR_PROGRAM,
  track: 'ai_no_code',
  amount: 10000,
})
pass(AI_INCOME_ACCELERATOR_PROGRAM, 'ai_business', {
  program: AI_INCOME_ACCELERATOR_PROGRAM,
  track: 'ai_business',
  amount: 10000,
})

fail(AI_INCOME_ACCELERATOR_PROGRAM, null)
fail(AI_INCOME_ACCELERATOR_PROGRAM, '')
fail(AI_INCOME_ACCELERATOR_PROGRAM, 'AI Income Accelerator Program')
fail(AI_INCOME_ACCELERATOR_PROGRAM, 'AI Income Accelerator')

pass(BUSINESS_ACCELERATOR_PROGRAM, null, {
  program: BUSINESS_ACCELERATOR_PROGRAM,
  track: null,
  amount: 25000,
})

const switchedToBusiness = validateAcceleratorSelection({
  program: BUSINESS_ACCELERATOR_PROGRAM,
  track: 'ai_finance',
})
assert.equal(switchedToBusiness.ok, true, 'Business Accelerator should not retain an AI track')
assert.equal(switchedToBusiness.product.track, null)

const switchedBackToAi = validateAcceleratorSelection({
  program: AI_INCOME_ACCELERATOR_PROGRAM,
  track: null,
})
assert.equal(switchedBackToAi.ok, false, 'AI Income Accelerator should require a new track after switching back')

console.log('Accelerator product selection tests passed.')
