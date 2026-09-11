import Link from 'next/link'
import { Card } from '@/components/ui'

export const dynamic = 'force-dynamic'

const banks = [
  { name: 'Access Bank', code: '044' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay Digital Services', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'UBA', code: '033' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
]

export default async function GrowthRegisterPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams
  const error = params?.error || ''
  const message = params?.message || ''

  return (
    <main className="associate-login auth-standalone">
      <Card>
        <Link className="brand" href="/">Nexora Institute</Link>
        <p className="eyebrow">Growth Associate</p>
        <h1>Create associate login details</h1>
        <p className="muted">Create the WhatsApp number and password that will be used to access the associate portal.</p>
        <form className="form-grid" method="post" action="/api/growth/register">
          <label className="field">
            <span>Full Name</span>
            <input name="fullName" required autoComplete="name" />
          </label>
          <label className="field">
            <span>WhatsApp Number</span>
            <input name="whatsapp" required inputMode="tel" autoComplete="tel" placeholder="08012345678" />
          </label>
          <label className="field">
            <span>Account Name</span>
            <input name="accountName" required placeholder="Name on bank account" />
          </label>
          <label className="field">
            <span>Bank Name</span>
            <select name="bankCode" required defaultValue="">
              <option value="" disabled>Select your bank</option>
              {banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Account Number</span>
            <input name="accountNumber" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit account number" />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <p className="muted">Use at least 8 characters with a letter and a number.</p>
          <label className="field">
            <span>Confirm Password</span>
            <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          {error ? <p className="form-message error" aria-live="polite">{error}</p> : null}
          {message ? <p className="form-message success" aria-live="polite">{message}</p> : null}
          <button className="btn btn-primary" type="submit">Create Growth Associate account</button>
        </form>
        <p>Already registered? <Link href="/growth/login">Sign in</Link></p>
      </Card>
    </main>
  )
}
