export const PAYSTACK_LOCAL_PERCENT = 0.015
export const PAYSTACK_LOCAL_FIXED_NGN = 100
export const PAYSTACK_LOCAL_FIXED_WAIVER_NGN = 2500
export const PAYSTACK_LOCAL_CAP_NGN = 2000

export type PaymentQuote = { subtotal: number; processingFee: number; total: number }

// Paystack Nigeria local pricing: 1.5% + NGN 100 (fixed fee waived below
// NGN 2,500), capped at NGN 2,000. Gross-up makes the merchant net the subtotal.
export function calculateGrossPaymentAmount(subtotal: number): PaymentQuote {
  if (!Number.isInteger(subtotal) || subtotal < 1) throw new Error('Subtotal must be a positive whole Naira amount.')
  const uncapped = Math.ceil((subtotal + PAYSTACK_LOCAL_FIXED_NGN) / (1 - PAYSTACK_LOCAL_PERCENT))
  const total = uncapped - subtotal >= PAYSTACK_LOCAL_CAP_NGN ? subtotal + PAYSTACK_LOCAL_CAP_NGN : uncapped
  return { subtotal, processingFee: total - subtotal, total }
}
