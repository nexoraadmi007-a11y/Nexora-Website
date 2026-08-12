'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'
import { findProgramme, formatNaira, programmes } from '@/config/programmes'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

function normalizeReferral(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    return url.searchParams.get('ref')?.trim() || trimmed
  } catch {
    const match = trimmed.match(/[?&]ref=([^&\s]+)/i)
    return match?.[1] ? decodeURIComponent(match[1]).trim() : trimmed
  }
}

function CheckoutInner() {
  const searchParams = useSearchParams()
  const initial = searchParams.get('programme') || 'ai-income-accelerator'
  const [programmeSlug, setProgrammeSlug] = useState(initial)
  const [promoCode, setPromoCode] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [pricing, setPricing] = useState<{ listPrice: number; discount: number; finalPrice: number; code?: string; message?: string } | null>(null)
  const [message, setMessage] = useState('')
  const programme = useMemo(() => findProgramme(programmeSlug) || programmes[0], [programmeSlug])
  const current = pricing || { listPrice: programme.listPriceNgn, discount: 0, finalPrice: programme.listPriceNgn }

  useEffect(() => {
    const fromUrl = searchParams.get('ref')?.trim()
    const fromCookie = document.cookie.split('; ').find((item) => item.startsWith('nexora_referral_code='))?.split('=')[1]
    const fromStorage = window.localStorage.getItem('nexora_referral_code') || ''
    const localReferral = normalizeReferral(fromUrl || (fromCookie ? decodeURIComponent(fromCookie) : '') || fromStorage)
    if (localReferral) {
      setReferralCode(localReferral)
      document.cookie = `nexora_referral_code=${encodeURIComponent(localReferral)}; max-age=${60 * 60 * 24 * 90}; path=/; samesite=lax`
      window.localStorage.setItem('nexora_referral_code', localReferral)
      return
    }

    if (!isSupabaseConfigured()) return
    let active = true
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id
      if (!userId) return
      const { data: profile } = await supabase.from('profiles').select('signup_referral_code').eq('id', userId).maybeSingle()
      const code = normalizeReferral(String(profile?.signup_referral_code || ''))
      if (active && code) {
        setReferralCode(code)
        document.cookie = `nexora_referral_code=${encodeURIComponent(code)}; max-age=${60 * 60 * 24 * 90}; path=/; samesite=lax`
        window.localStorage.setItem('nexora_referral_code', code)
      }
    }).catch(() => undefined)
    return () => { active = false }
  }, [searchParams])

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
        referralCode: normalizeReferral(String(formData.get('referralCode') || referralCode || '')),
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
      <Section eyebrow="Review Order" title="Choose programme, confirm referral, then pay securely.">
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
              <label className="field"><span>Referral Code or Link</span><input name="referralCode" value={referralCode} onChange={(event) => setReferralCode(normalizeReferral(event.target.value))} placeholder="Optional partner referral" /></label>
              {referralCode ? <p className="form-message success">Referral partner captured. This does not change your course fee.</p> : null}
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
