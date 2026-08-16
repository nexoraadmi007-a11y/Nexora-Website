'use client'

import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password'), remember: rememberDevice }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Admin sign in failed.')
      router.replace(result.redirectTo || '/admin')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Admin sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicShell>
      <Section eyebrow="NEXORA Admin" title="Administration sign in">
        <Card>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field"><span>Email / Admin ID</span><input name="email" type="email" autoComplete="username" required /></label>
            <label className="field password-field">
              <span>Password</span>
              <span className="password-input">
                <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required />
                <button className="icon-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </span>
            </label>
            <label className="inline-choice"><input type="checkbox" checked={rememberDevice} onChange={(event) => setRememberDevice(event.target.checked)} /> Remember this device</label>
            {message ? <p className="form-message error">{message}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <p className="muted">Administrator credentials are validated on the server and do not use the student verification flow.</p>
          </form>
        </Card>
      </Section>
    </PublicShell>
  )
}
