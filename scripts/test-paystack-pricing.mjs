import assert from 'node:assert/strict'
import { calculateGrossPaymentAmount } from '../src/lib/paystack-pricing.ts'

for (const [subtotal, total] of [[10000, 10254], [20000, 20407], [30000, 30559]]) {
  const quote = calculateGrossPaymentAmount(subtotal)
  assert.equal(quote.subtotal, subtotal)
  assert.equal(quote.total, total)
  assert.equal(quote.processingFee, total - subtotal)
  const paystackFee = Math.min(total * 0.015 + 100, 2000)
  assert.ok(total - paystackFee >= subtotal, `NGN ${total} must net at least NGN ${subtotal}`)
}
assert.deepEqual(calculateGrossPaymentAmount(200000), { subtotal: 200000, processingFee: 2000, total: 202000 })
assert.throws(() => calculateGrossPaymentAmount(0))
console.log('Paystack gross-up tests passed.')
