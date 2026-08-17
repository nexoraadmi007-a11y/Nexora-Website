'use client'

import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

export default function AdminSetupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const passwordChecks = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setSuccess(false)
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.get('fullName'),
        email: form.get('email'),
        password: form.get('password'),
        secret: form.get('secret'),
      }),
    })
    const result = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok) {
      setMessage(result.error || 'Admin access could not be created.')
      return
    }
    setSuccess(true)
    setMessage(result.message || 'Admin login access is ready.')
  }

  return (
    <PublicShell>
      <Section eyebrow="Nexora Institute" title="Set or Reset Admin Access">
        <Card>
          <form className="form-grid" onSubmit={handleSubmit}>
            <p className="muted">
              Set a new admin password below. For an existing approved admin email, this securely replaces the old password. The setup secret is the private admin setup code configured on the server.
            </p>
            <label className="field">
              <span>Full Name</span>
              <input name="fullName" defaultValue="Nexora Admin" required />
            </label>
            <label className="field">
              <span>Admin Email</span>
              <input name="email" type="email" defaultValue="admin@nexoragroup.ink" required />
            </label>
            <label className="field password-field">
              <span>Password</span>
              <span className="password-input">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create your own password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
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
              <span>Admin Setup Secret</span>
              <span className="password-input">
                <input name="secret" type={showSecret ? 'text' : 'password'} placeholder="Enter the admin setup secret" required />
                <button className="icon-button" type="button" aria-label={showSecret ? 'Hide setup secret' : 'Show setup secret'} onClick={() => setShowSecret((value) => !value)}>
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <p className="muted">
              After access is created, use this email and the password you chose on the admin login page.
            </p>
            {message ? <p className={`form-message ${success ? 'success' : 'error'}`}>{message}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving admin access...' : 'Set or Reset Password'}</button>
            {success ? <Link className="btn btn-secondary" href="/admin/login">Go to Admin Login</Link> : null}
          </form>
        </Card>
      </Section>
    </PublicShell>
  )
}
