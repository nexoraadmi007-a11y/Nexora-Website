'use client'

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'
import { COURSE_CATALOGUE, coursePriceNgn, findCourse } from '@/lib/accelerator-products'

function formatNaira(value: number) { return `₦${value.toLocaleString('en-NG')}` }
function cleanReferral(value: string) {
  try { return new URL(value.trim()).searchParams.get('ref')?.trim() || value.trim() } catch { return value.trim() }
}

function CheckoutInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(() => {
    const requested = [...params.getAll('course'), params.get('programme') || '', params.get('track') || '']
    return Array.from(new Set(requested.map((item) => findCourse(item)?.code).filter(Boolean) as string[]))
  })
  const [referralCode, setReferralCode] = useState('')
  const [message, setMessage] = useState('')
  const [quote, setQuote] = useState<{ subtotal: number; processingFee: number; total: number } | null>(null)
  const [identity, setIdentity] = useState<{ fullName: string; email: string; whatsapp: string } | null>(null)
  const [identityReady, setIdentityReady] = useState(false)
  const [associateSession, setAssociateSession] = useState(false)
  const selectedCourses = useMemo(() => COURSE_CATALOGUE.filter((course) => selected.includes(course.code)), [selected])

  useEffect(() => {
    const fromUrl = params.get('ref') || ''
    const fromStorage = window.localStorage.getItem('nexora_referral_code') || ''
    const code = cleanReferral(fromUrl || fromStorage)
    if (code) { setReferralCode(code); window.localStorage.setItem('nexora_referral_code', code) }
  }, [params])

  useEffect(() => {
    fetch('/api/checkout/context', { cache: 'no-store' }).then((response) => response.json()).then((result) => {
      setAssociateSession(Boolean(result.associateSession))
      if (result.authenticated && result.identity) {
        setIdentity(result.identity)
        if (result.identity.referralCode) setReferralCode(result.identity.referralCode)
      }
    }).catch(() => undefined).finally(() => setIdentityReady(true))
  }, [])

  async function switchToStudent() {
    await fetch('/api/auth/logout', { method: 'POST' })
    const next = `${window.location.pathname}${window.location.search}`
    router.push(`/login?next=${encodeURIComponent(next)}`)
    router.refresh()
  }

  useEffect(() => {
    if (!selected.length) { setQuote(null); return }
    const controller = new AbortController()
    fetch('/api/paystack/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseCodes: selected }), signal: controller.signal })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setQuote(result); setMessage('') })
      .catch((error) => { if (error.name !== 'AbortError') { setQuote(null); setMessage(error.message || 'Could not calculate payment total.') } })
    return () => controller.abort()
  }, [selected])

  function toggle(code: string) {
    setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code])
    setMessage('')
  }

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected.length) { setMessage('Select at least one course.'); return }
    setMessage('Initializing payment...')
    if (!identity) { setMessage('Log in with the student account before continuing to payment.'); return }
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: identity.fullName, email: identity.email, phone: identity.whatsapp, referralCode, courseCodes: selected, sourcePage: '/checkout' }),
    })
    const result = await response.json().catch(() => ({}))
    if (response.ok && result.authorizationUrl) { window.location.href = result.authorizationUrl; return }
    setMessage(result.error || 'Payment could not be initialized. Please try again.')
  }

  return <PublicShell><Section eyebrow="Course checkout" title="Select your courses">
    <div className="checkout-layout"><Card>
      <p className="muted">Choose one or more courses. Each selected course receives its own enrolment.</p>
      <div className="course-selector">{COURSE_CATALOGUE.map((course) => <label className={`course-option ${selected.includes(course.code) ? 'selected' : ''}`} key={course.code}>
        <input type="checkbox" checked={selected.includes(course.code)} onChange={() => toggle(course.code)} />
        <span><strong>{course.name}</strong><small>{course.summary}</small></span><b>{formatNaira(coursePriceNgn)}</b>
      </label>)}</div>
      <p className="selection-count">{selected.length} {selected.length === 1 ? 'course' : 'courses'} selected</p>
    </Card><Card><form className="form-grid" onSubmit={pay}>
      <div className="payment-summary"><h3>Payment summary</h3>{selectedCourses.map((course) => <div key={course.code}><span>{course.name}</span><strong>{formatNaira(coursePriceNgn)}</strong></div>)}
        <hr/><div><span>Course subtotal</span><strong>{formatNaira(quote?.subtotal || 0)}</strong></div><div><span>Processing fee</span><strong>{formatNaira(quote?.processingFee || 0)}</strong></div><div className="payment-total"><span>Total payable</span><strong>{formatNaira(quote?.total || 0)}</strong></div>
      </div>
      {!identityReady ? <p className="muted">Loading your registration details…</p> : identity ? <div className="payment-identity"><p className="eyebrow">Student details</p><p><strong>{identity.fullName}</strong></p><p>{identity.email}</p><p>{identity.whatsapp}</p><p><strong>Referral:</strong> {referralCode || 'None'}</p></div> : <div className="form-message error"><p>{associateSession ? 'You are currently signed in as a Growth Associate. Use the student account created during registration to pay.' : 'Log in with the student account created during registration to continue.'}</p><button className="btn btn-secondary" type="button" onClick={switchToStudent}>{associateSession ? 'Continue with student account' : 'Log in to continue'}</button></div>}
      {message ? <p className={`form-message ${message.includes('Initializing') ? 'success' : 'error'}`}>{message}</p> : null}
      <button className="btn btn-primary" disabled={!quote || !selected.length || !identity} type="submit">Continue to Payment</button>
    </form></Card></div>
  </Section></PublicShell>
}

export default function CheckoutPage() { return <Suspense fallback={<PublicShell><Section eyebrow="Course checkout" title="Loading checkout..." /></PublicShell>}><CheckoutInner /></Suspense> }
