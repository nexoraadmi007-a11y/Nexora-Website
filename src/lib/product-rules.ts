import { findProgramme } from '@/config/programmes'

export type PromoValidation =
  | { ok: true; code: string; description: string; listPrice: number; discount: number; finalPrice: number }
  | { ok: false; message: string; listPrice: number; discount: 0; finalPrice: number }

export const commissionRates = {
  L1: 0.15,
  L2: 0.10,
  L3: 0.05,
}

export const payoutPolicy = {
  mode: process.env.PAYOUT_MODE || 'FIXED_DAY',
  payoutDay: Number(process.env.PAYOUT_DAY || 30),
  requestWindowStartDay: Number(process.env.REQUEST_WINDOW_START_DAY || 28),
  requestCutoffDay: Number(process.env.REQUEST_CUTOFF_DAY || 29),
  requestCutoffTime: process.env.REQUEST_CUTOFF_TIME || '23:59',
  autoPayout: process.env.AUTO_PAYOUT === 'true',
}

const demoPromos = [
  {
    code: 'WEBINAR50',
    description: '50% webinar campaign discount',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    active: true,
    startsAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
]

export function programmeListPrice(programmeSlugOrCode: string) {
  const programme = findProgramme(programmeSlugOrCode)
  return programme?.listPriceNgn || programme?.priceNgn || 0
}

export function validatePromoCode(input: { programme: string; code?: string; userId?: string }): PromoValidation {
  const listPrice = programmeListPrice(input.programme)
  const rawCode = (input.code || '').trim().toUpperCase()
  if (!rawCode) return { ok: false, message: 'Enter a promo code to apply a discount.', listPrice, discount: 0, finalPrice: listPrice }

  const promo = demoPromos.find((item) => item.code === rawCode)
  if (!promo) return { ok: false, message: 'This promo code is invalid.', listPrice, discount: 0, finalPrice: listPrice }
  if (!promo.active) return { ok: false, message: 'This promo code is no longer active.', listPrice, discount: 0, finalPrice: listPrice }

  const now = Date.now()
  if (Date.parse(promo.startsAt) > now) return { ok: false, message: 'This promo code is not active yet.', listPrice, discount: 0, finalPrice: listPrice }
  if (Date.parse(promo.expiresAt) < now) return { ok: false, message: 'This promo code has expired.', listPrice, discount: 0, finalPrice: listPrice }

  const discount = promo.discountType === 'PERCENTAGE'
    ? Math.round(listPrice * (promo.discountValue / 100))
    : Math.min(listPrice, promo.discountValue)
  return {
    ok: true,
    code: promo.code,
    description: promo.description,
    listPrice,
    discount,
    finalPrice: Math.max(listPrice - discount, 0),
  }
}

export function calculateCheckoutPrice(input: { programme: string; promoCode?: string }) {
  const listPrice = programmeListPrice(input.programme)
  if (!input.promoCode) return { listPrice, discount: 0, finalPrice: listPrice, promoCode: '' }
  const promo = validatePromoCode({ programme: input.programme, code: input.promoCode })
  if (!promo.ok) return { listPrice, discount: 0, finalPrice: listPrice, promoCode: '', error: promo.message }
  return { listPrice: promo.listPrice, discount: promo.discount, finalPrice: promo.finalPrice, promoCode: promo.code }
}

export function commissionAmount(amountPaid: number, level: keyof typeof commissionRates) {
  return Math.round(amountPaid * commissionRates[level])
}

export function canRequestPayout(input: { approvedBalance: number; requestedAmount: number; hasVerifiedBank: boolean }) {
  if (!input.hasVerifiedBank) return { ok: false, message: 'Add and verify your bank account before requesting payout.' }
  if (input.requestedAmount < 1) return { ok: false, message: 'Enter a payout amount.' }
  if (input.requestedAmount > input.approvedBalance) return { ok: false, message: 'You cannot request more than your approved earnings.' }
  return { ok: true, message: 'Payout request accepted for review.' }
}

export function compareAccountName(profileName: string, accountName: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean).sort()
  const profile = normalize(profileName)
  const account = normalize(accountName)
  if (!profile.length || !account.length) return 'MANUAL_REVIEW'
  const overlap = profile.filter((part) => account.includes(part)).length
  const score = overlap / Math.max(profile.length, account.length)
  if (score >= 0.85) return 'VERIFIED'
  if (score >= 0.55) return 'POSSIBLE_MATCH'
  return 'MISMATCH'
}
