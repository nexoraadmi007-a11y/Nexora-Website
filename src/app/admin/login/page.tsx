'use client'

import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

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
    const email = String(form.get('email') || '').trim().toLowerCase()
    const password = String(form.get('password') || '')
    try {
      if (!isSupabaseConfigured()) throw new Error('Admin authentication is not configured.')
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (!data.user?.email_confirmed_at && !data.user?.confirmed_at) {
        await supabase.auth.signOut().catch(() => undefined)
        throw new Error('Verify this email before using admin access.')
      }
      if (rememberDevice) window.localStorage.setItem('nexora_admin_remembered', email)
      router.push('/admin')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Admin sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicShell>
      <Section eyebrow="Nexora Institute" title="Administration">
        <Card>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="field password-field">
              <span>Password</span>
              <span className="password-input">
                <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required />
                <button className="icon-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <label className="inline-choice"><input type="checkbox" checked={rememberDevice} onChange={(event) => setRememberDevice(event.target.checked)} /> Remember this device</label>
            {message ? <p className="form-message error">{message}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <Link href="/forgot-password">Forgot Password</Link>
          </form>
        </Card>
      </Section>
    </PublicShell>
  )
}
