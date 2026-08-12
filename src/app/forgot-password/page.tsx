'use client'

import { FormEvent, useState } from 'react'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim().toLowerCase()
    try {
      if (isSupabaseConfigured()) {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
      }
      setStatus('success')
      setMessage(isSupabaseConfigured() ? 'Reset link sent. Check your email.' : 'Reset instructions have been prepared for this account.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Password reset could not be started.')
    }
  }

  return <PublicShell><Section eyebrow="Password Reset" title="Reset access securely."><Card><form className="form-grid" onSubmit={submit}><Field name="email" label="Email" type="email" required />{message ? <p className={`form-message ${status === 'success' ? 'success' : 'error'}`}>{message}</p> : null}<button className="btn btn-primary" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Sending...' : 'Send reset link'}</button></form></Card></Section></PublicShell>
}
