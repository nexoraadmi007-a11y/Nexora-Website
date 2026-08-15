'use client'

import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

export default function AdminSetupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

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
      <Section eyebrow="Nexora Institute" title="Create Admin Access">
        <Card>
          <form className="form-grid" onSubmit={handleSubmit}>
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
                <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required />
                <button className="icon-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <p className="muted">Use at least 8 characters with a letter and a number.</p>
            <label className="field password-field">
              <span>Admin Setup Secret</span>
              <input name="secret" type="password" required />
            </label>
            {message ? <p className={`form-message ${success ? 'success' : 'error'}`}>{message}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating access...' : 'Create Admin Access'}</button>
            {success ? <Link className="btn btn-secondary" href="/admin/login">Go to Admin Login</Link> : null}
          </form>
        </Card>
      </Section>
    </PublicShell>
  )
}
