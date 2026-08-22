'use client'

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'
import { COURSE_CATALOGUE, coursePriceNgn, findCourse } from '@/lib/accelerator-products'

function formatNaira(value: number) { return `₦${value.toLocaleString('en-NG')}` }
function cleanReferral(value: string) {
  try { return new URL(value.trim()).searchParams.get('ref')?.trim() || value.trim() } catch { return value.trim() }
}

function CheckoutInner() {
  const params = useSearchParams()
  const [selected, setSelected] = useState<string[]>(() => {
    const requested = [...params.getAll('course'), params.get('programme') || '', params.get('track') || '']
    return Array.from(new Set(requested.map((item) => findCourse(item)?.code).filter(Boolean) as string[]))
  })
  const [referralCode, setReferralCode] = useState('')
  const [message, setMessage] = useState('')
  const total = useMemo(() => selected.length * coursePriceNgn, [selected])

  useEffect(() => {
    const fromUrl = params.get('ref') || ''
    const fromStorage = window.localStorage.getItem('nexora_referral_code') || ''
    const code = cleanReferral(fromUrl || fromStorage)
    if (code) { setReferralCode(code); window.localStorage.setItem('nexora_referral_code', code) }
  }, [params])

  function toggle(code: string) {
    setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code])
    setMessage('')
  }

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected.length) { setMessage('Select at least one course.'); return }
    setMessage('Initializing payment...')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: form.get('fullName'), email: form.get('email'), phone: form.get('whatsapp'), referralCode, courseCodes: selected, sourcePage: '/checkout' }),
    })
    const result = await response.json().catch(() => ({}))
    if (response.ok && result.authorizationUrl) { window.location.href = result.authorizationUrl; return }
    setMessage(result.error || 'Payment could not be initialized. Please try again.')
  }

  return <PublicShell><Section eyebrow="Course checkout" title="Choose one, two, or all three courses.">
    <div className="grid-2"><Card>
      <div className="form-grid">{COURSE_CATALOGUE.map((course) => <label className="field" key={course.code}>
        <span><input type="checkbox" checked={selected.includes(course.code)} onChange={() => toggle(course.code)} /> <strong>{course.name}</strong></span>
        <span className="muted">{course.summary} — {formatNaira(coursePriceNgn)}</span>
      </label>)}</div>
      <p className="price">Total: {formatNaira(total)}</p>
      <p className="muted">Every selected course receives its own enrolment.</p>
    </Card><Card><form className="form-grid" onSubmit={pay}>
      <Field name="fullName" label="Full Name" required /><Field name="email" label="Email" type="email" required /><Field name="whatsapp" label="WhatsApp Number" required />
      <label className="field"><span>Referral Code or Link</span><input value={referralCode} onChange={(event) => setReferralCode(cleanReferral(event.target.value))} placeholder="Optional" /></label>
      {message ? <p className={`form-message ${message.includes('Initializing') ? 'success' : 'error'}`}>{message}</p> : null}
      <button className="btn btn-primary" type="submit">Pay {formatNaira(total)} with Paystack</button>
    </form></Card></div>
  </Section></PublicShell>
}

export default function CheckoutPage() { return <Suspense fallback={<PublicShell><Section eyebrow="Course checkout" title="Loading checkout..." /></PublicShell>}><CheckoutInner /></Suspense> }
