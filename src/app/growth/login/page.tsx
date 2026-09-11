'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui'

export default function GrowthLoginPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('Signing in...')
    const response = await fetch('/api/growth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setMessage(body.message || 'Sign in failed.')
      setBusy(false)
      return
    }
    router.replace('/growth-associate')
    router.refresh()
  }

  return (
    <main className="associate-login auth-standalone">
      <Card>
        <Link className="brand" href="/">Nexora Institute</Link>
        <p className="eyebrow">Growth Associate Portal</p>
        <h1>Sign in to your associate account</h1>
        <p className="muted">Use the WhatsApp number and password created during associate registration.</p>
        <form className="form-grid" onSubmit={submit}>
          <label className="field">
            <span>WhatsApp Number</span>
            <input name="whatsapp" required inputMode="tel" autoComplete="tel" placeholder="08012345678" />
          </label>
          <label className="field password-field">
            <span>Password</span>
            <span className="password-input">
              <input name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" />
              <button className="icon-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {message ? <p className={`form-message ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('incorrect') ? 'error' : 'success'}`} aria-live="polite">{message}</p> : null}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p>New Growth Associate? <Link href="/growth/register">Create an account</Link></p>
        <p className="muted">Password recovery will be available when verified WhatsApp messaging is enabled.</p>
      </Card>
    </main>
  )
}
