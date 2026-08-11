'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'
import { findProgramme, formatNaira, programmes } from '@/config/programmes'

function CheckoutInner() {
  const searchParams = useSearchParams()
  const initial = searchParams.get('programme') || 'ai-income-accelerator'
  const [programmeSlug, setProgrammeSlug] = useState(initial)
  const [promoCode, setPromoCode] = useState('')
  const [pricing, setPricing] = useState<{ listPrice: number; discount: number; finalPrice: number; code?: string; message?: string } | null>(null)
  const [message, setMessage] = useState('')
  const programme = useMemo(() => findProgramme(programmeSlug) || programmes[0], [programmeSlug])
  const current = pricing || { listPrice: programme.listPriceNgn, discount: 0, finalPrice: programme.listPriceNgn }

  async function applyPromo() {
    const response = await fetch('/api/promos/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ programme: programme.slug, code: promoCode }) })
    const result = await response.json()
    setPricing(result.ok ? { ...result } : { listPrice: result.listPrice || programme.listPriceNgn, discount: 0, finalPrice: result.finalPrice || programme.listPriceNgn, message: result.message || 'This promo code is invalid.' })
  }

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Initializing payment...')
    const formData = new FormData(event.currentTarget)
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('whatsapp'),
        referralCode: formData.get('referralCode'),
        promoCode: pricing?.code || promoCode,
        programCode: programme.legacyCode,
        programName: programme.name,
        programmeSlug: programme.slug,
        selectedTrackSlugs: programme.tracks[0] ? [programme.tracks[0].slug] : [],
        selectedTrackNames: programme.tracks[0] ? [programme.tracks[0].name] : [],
        sourcePage: '/checkout',
      }),
    })
    const result = await response.json().catch(() => ({}))
    if (response.ok && result.authorizationUrl) {
      window.location.href = result.authorizationUrl
      return
    }
    setMessage(result.error || 'Payment could not be initialized. Please try again.')
  }

  return (
    <PublicShell>
      <Section eyebrow="Review Order" title="Choose programme, apply promo, then pay securely.">
        <div className="grid-2">
          <Card>
            <label className="field"><span>Programme</span><select value={programmeSlug} onChange={(event) => { setProgrammeSlug(event.target.value); setPricing(null) }}>{programmes.map((item) => <option key={item.code} value={item.slug}>{item.name}</option>)}</select></label>
            <h3>{programme.name}</h3>
            <p className="muted">{programme.duration}</p>
            <div className="list">
              <p>Programme Price: <strong>{formatNaira(current.listPrice)}</strong></p>
              {current.discount ? <p>{pricing?.code || promoCode.toUpperCase()}: <strong>-{formatNaira(current.discount)}</strong></p> : null}
              <p className="price">Total: {formatNaira(current.finalPrice)}</p>
            </div>
            <div className="form-grid">
              <label className="field"><span>Promo Code</span><input value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="WEBINAR50" /></label>
              {pricing?.message ? <p className="form-message error">{pricing.message}</p> : pricing?.discount ? <p className="form-message success">Promo applied successfully.</p> : null}
              <button className="btn btn-secondary" type="button" onClick={applyPromo}>Apply Promo</button>
            </div>
          </Card>
          <Card>
            <form className="form-grid" onSubmit={pay}>
              <Field name="fullName" label="Full Name" required />
              <Field name="email" label="Email" type="email" required />
              <Field name="whatsapp" label="WhatsApp Number" required />
              <Field name="referralCode" label="Referral Code" />
              {message ? <p className={`form-message ${message.includes('Initializing') ? 'success' : 'error'}`}>{message}</p> : null}
              <button className="btn btn-primary" type="submit">Continue to Paystack</button>
            </form>
          </Card>
        </div>
      </Section>
    </PublicShell>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PublicShell><Section eyebrow="Review Order" title="Loading checkout..." /></PublicShell>}>
      <CheckoutInner />
    </Suspense>
  )
}
