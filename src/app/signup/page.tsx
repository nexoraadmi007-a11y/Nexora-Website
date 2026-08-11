'use client'

import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

const countries = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Rwanda',
  'Uganda',
  'United Kingdom',
  'United States',
  'Canada',
  'Other',
]

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
  }), [password])

  const passwordReady = passwordChecks.length && passwordChecks.letter && passwordChecks.number

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setStatus('submitting')
    setMessage('')

    const formData = new FormData(form)
    const fullName = `${formData.get('firstName') || ''} ${formData.get('lastName') || ''}`.trim()

    if (!passwordReady) {
      setStatus('error')
      setMessage('Please use a password with at least 8 characters, including a letter and a number.')
      return
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: formData.get('email'),
          whatsAppNumber: formData.get('whatsapp'),
          country: formData.get('country'),
          password,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Account request failed.')

      setStatus('success')
      setMessage('Your account request has been received. Nexora Institute will complete account access setup from the admin side.')
      form.reset()
      setPassword('')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'We could not create your account request. Please try again.')
    }
  }

  return (
    <PublicShell>
      <Section eyebrow="Create Account" title="Start with only the essentials.">
        <Card>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="grid-2">
              <label className="field">
                <span>First Name</span>
                <input name="firstName" required />
              </label>
              <label className="field">
                <span>Last Name</span>
                <input name="lastName" required />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" required />
              </label>
              <label className="field">
                <span>WhatsApp Number</span>
                <input name="whatsapp" inputMode="tel" placeholder="Use your WhatsApp number" required />
              </label>
              <label className="field">
                <span>Country</span>
                <select name="country" defaultValue="Nigeria" required>
                  {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </label>
              <label className="field password-field">
                <span>Password</span>
                <span className="password-input">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="icon-button"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                  >
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
            </div>

            {message ? <p className={`form-message ${status === 'success' ? 'success' : 'error'}`}>{message}</p> : null}

            <button className="btn btn-primary" type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Creating account...' : 'Create account'}
            </button>
            <p className="muted">Durable login sessions will be completed when the V2 authentication service is connected.</p>
            <Link href="/login">Already have an account?</Link>
          </form>
        </Card>
      </Section>
    </PublicShell>
  )
}
