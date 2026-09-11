'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui'

type Bank = { name: string; code: string }

export default function GrowthRegisterPage() {
  const router = useRouter()
  const [banks, setBanks] = useState<Bank[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
  }), [password])

  useEffect(() => {
    fetch('/api/paystack/banks')
      .then((response) => response.json())
      .then((body) => setBanks(body.banks || []))
      .catch(() => setMessage('Banks could not be loaded. Please refresh.'))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('Creating your account...')
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries())
    const response = await fetch('/api/growth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setMessage(body.message || 'Registration failed. Please try again.')
      setBusy(false)
      return
    }
    setMessage(`Account created. Your Growth ID is ${body.growthId}.`)
    router.replace('/growth-associate')
    router.refresh()
  }

  return (
    <main className="associate-login auth-standalone">
      <Card>
        <Link className="brand" href="/">Nexora Institute</Link>
        <p className="eyebrow">Growth Associate</p>
        <h1>Create associate login details</h1>
        <p className="muted">Create the WhatsApp number and password that will be used to access the associate portal.</p>
        <form className="form-grid" onSubmit={submit}>
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
              <option value="" disabled>{banks.length ? 'Select your bank' : 'Loading banks...'}</option>
              {banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Account Number</span>
            <input name="accountNumber" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit account number" />
          </label>
          <label className="field password-field">
            <span>Password</span>
            <span className="password-input">
              <input name="password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button className="icon-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <div className="password-guide" aria-live="polite">
            <p>Password guide</p>
            <span className={passwordChecks.length ? 'ok' : ''}>At least 8 characters</span>
            <span className={passwordChecks.letter ? 'ok' : ''}>Include a letter</span>
            <span className={passwordChecks.number ? 'ok' : ''}>Include a number</span>
          </div>
          <label className="field password-field">
            <span>Confirm Password</span>
            <span className="password-input">
              <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" />
              <button className="icon-button" type="button" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} onClick={() => setShowConfirmPassword((value) => !value)}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {message ? <p className={`form-message ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('could not') ? 'error' : 'success'}`} aria-live="polite">{message}</p> : null}
          <button className="btn btn-primary" disabled={busy || banks.length === 0}>{busy ? 'Creating account...' : 'Create Growth Associate account'}</button>
        </form>
        <p>Already registered? <Link href="/growth/login">Sign in</Link></p>
      </Card>
    </main>
  )
}
