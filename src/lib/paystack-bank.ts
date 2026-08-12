import { compareAccountName } from '@/lib/product-rules'

export type PaystackBank = {
  name: string
  code: string
  country?: string
  currency?: string
}

export function paystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured.')
  return secret
}

export async function listPaystackBanks() {
  const response = await fetch('https://api.paystack.co/bank?country=nigeria&perPage=100', {
    headers: { Authorization: `Bearer ${paystackSecret()}` },
    cache: 'no-store',
  })
  const payload = await response.json()
  if (!response.ok || !payload.status) throw new Error(payload.message || 'Paystack bank list failed.')
  return (payload.data || []).map((bank: Record<string, unknown>) => ({
    name: typeof bank.name === 'string' ? bank.name : '',
    code: typeof bank.code === 'string' ? bank.code : '',
    country: typeof bank.country === 'string' ? bank.country : '',
    currency: typeof bank.currency === 'string' ? bank.currency : '',
  })).filter((bank: PaystackBank) => bank.name && bank.code) as PaystackBank[]
}

export async function resolvePaystackAccount(input: { accountNumber: string; bankCode: string; profileName: string }) {
  const accountNumber = input.accountNumber.replace(/\D/g, '')
  if (accountNumber.length !== 10) throw new Error('Enter a valid 10-digit account number.')
  if (!input.bankCode) throw new Error('Select a bank.')

  const url = new URL('https://api.paystack.co/bank/resolve')
  url.searchParams.set('account_number', accountNumber)
  url.searchParams.set('bank_code', input.bankCode)
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${paystackSecret()}` },
    cache: 'no-store',
  })
  const payload = await response.json()
  if (!response.ok || !payload.status) throw new Error(payload.message || 'Paystack account resolution failed.')

  const accountName = String(payload.data?.account_name || '').trim()
  const status = compareAccountName(input.profileName, accountName)
  const normalizedProfile = input.profileName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  const normalizedAccount = accountName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  const overlap = normalizedProfile.filter((part) => normalizedAccount.includes(part)).length
  const score = normalizedProfile.length && normalizedAccount.length
    ? Math.round((overlap / Math.max(normalizedProfile.length, normalizedAccount.length)) * 100)
    : 0

  return {
    accountName,
    status,
    score,
    accountNumberLastFour: accountNumber.slice(-4),
  }
}
