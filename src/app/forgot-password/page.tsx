'use client'
import { FormEvent, useState } from 'react'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSent(true) }
  return <PublicShell><Section eyebrow="Password Reset" title="Reset access securely."><Card><form className="form-grid" onSubmit={submit}><Field name="email" label="Email" type="email" required />{sent ? <p className="form-message success">Reset instructions have been prepared for this account.</p> : null}<button className="btn btn-primary" type="submit">Send reset link</button></form></Card></Section></PublicShell>
}
