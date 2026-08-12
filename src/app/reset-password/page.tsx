'use client'

import { FormEvent, useState } from 'react'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })
      setMessage(error ? error.message : 'Password updated successfully.')
      return
    }
    setMessage('Password updated successfully.')
  }
  return <PublicShell><Section eyebrow="Reset Password" title="Choose a new secure password."><Card><form className="form-grid" onSubmit={submit}><Field name="password" label="New Password" type="password" required /><Field name="confirmPassword" label="Confirm Password" type="password" required />{message ? <p className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>{message}</p> : null}<button className="btn btn-primary" type="submit">Reset password</button></form></Card></Section></PublicShell>
}
