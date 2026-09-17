'use client'

import { FormEvent, useState } from 'react'
import { landingProgrammes } from '@/config/landing-programmes'

type LeadType = 'PROGRAM_INTEREST' | 'CORPORATE_TRAINING' | 'AMBASSADOR' | 'COMMUNITY'
const types: { value: LeadType; label: string }[] = [
  { value: 'PROGRAM_INTEREST', label: 'A program' },
  { value: 'CORPORATE_TRAINING', label: 'Corporate training' },
  { value: 'AMBASSADOR', label: 'Ambassador program' },
  { value: 'COMMUNITY', label: 'Community' },
]

export function LandingLeadForm({ initialType, initialProgramme }: { initialType?: string; initialProgramme?: string }) {
  const validType = types.find((item) => item.value === initialType)?.value || 'PROGRAM_INTEREST'
  const [type, setType] = useState<LeadType>(validType)
  const [programme, setProgramme] = useState(initialProgramme || '')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setError('')
    const form = event.currentTarget
    const data = new FormData(form)
    const payload = Object.fromEntries(data.entries())
    try {
      const response = await fetch('/api/institute-interest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, leadType: type, programmeCode: type === 'PROGRAM_INTEREST' ? programme : null }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'We could not save your interest. Please try again.')
      setStatus('sent')
      form.reset()
      if (result.nextUrl) window.setTimeout(() => { window.location.assign(result.nextUrl) }, 1200)
    } catch (cause) {
      setStatus('idle')
      setError(cause instanceof Error ? cause.message : 'We could not save your interest. Please try again.')
    }
  }

  return <form className="institute-form" onSubmit={submit}>
    <div className="institute-form-grid">
      <label>I'm interested in<select name="leadType" value={type} onChange={(event) => setType(event.target.value as LeadType)}>{types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      {type === 'PROGRAM_INTEREST' ? <label>Program<select name="programmeCode" value={programme} onChange={(event) => setProgramme(event.target.value)} required><option value="">Choose a program</option>{landingProgrammes.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label> : null}
      <label>Full name<input name="fullName" autoComplete="name" maxLength={160} required /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>WhatsApp number<input name="whatsAppNumber" type="tel" autoComplete="tel" maxLength={30} required /></label>
      {type === 'CORPORATE_TRAINING' ? <label>Organization<input name="organization" maxLength={160} required /></label> : null}
    </div>
    <label className="institute-wide">What would you like to achieve? <span>(optional)</span><textarea name="message" rows={3} maxLength={1200} /></label>
    <input name="website" className="institute-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    {error ? <p className="institute-error" role="alert">{error}</p> : null}
    {status === 'sent' ? <p className="institute-success" role="status">Thank you. We have received your interest and will be in touch.</p> : null}
    <button className="institute-button institute-button-dark" type="submit" disabled={status !== 'idle'}>{status === 'sending' ? 'Submitting...' : status === 'sent' ? 'Received' : 'Send my interest'}</button>
  </form>
}
