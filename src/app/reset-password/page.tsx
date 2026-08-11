'use client'
import { FormEvent, useState } from 'react'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'

export default function ResetPasswordPage() {
  const [saved, setSaved] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setSaved(formData.get('password') === formData.get('confirmPassword') ? 'Password updated successfully.' : 'Passwords do not match.')
  }
  return <PublicShell><Section eyebrow="Reset Password" title="Choose a new secure password."><Card><form className="form-grid" onSubmit={submit}><Field name="password" label="New Password" type="password" required /><Field name="confirmPassword" label="Confirm Password" type="password" required />{saved ? <p className={`form-message ${saved.includes('success') ? 'success' : 'error'}`}>{saved}</p> : null}<button className="btn btn-primary" type="submit">Reset password</button></form></Card></Section></PublicShell>
}
