'use client'

import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

type LoginState = 'idle' | 'submitting' | 'error'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<LoginState>('idle')
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '').trim()

    if (!email || !password) {
      setStatus('error')
      setMessage('Enter your email and password to continue.')
      return
    }

    try {
      window.localStorage.setItem('nexora_v2_session', JSON.stringify({
        email,
        mode: 'preview',
        createdAt: new Date().toISOString(),
      }))
      router.push('/app')
    } catch {
      setStatus('error')
      setMessage('We could not start your preview session. Please try again.')
    }
  }

  return (
    <PublicShell>
      <Section eyebrow="Log In" title="Access your Nexora Institute workspace.">
        <Card>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" required />
            </label>
            <label className="field password-field">
              <span>Password</span>
              <span className="password-input">
                <input name="password" type={showPassword ? 'text' : 'password'} required />
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

            {message ? <p className="form-message error">{message}</p> : null}

            <button className="btn btn-primary" type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Logging in...' : 'Log in'}
            </button>
            <div className="actions">
              <Link href="/forgot-password">Forgot password?</Link>
              <Link href="/signup">Create account</Link>
            </div>
            <p className="muted">Preview login is enabled while durable authentication is being connected.</p>
          </form>
        </Card>
      </Section>
    </PublicShell>
  )
}
