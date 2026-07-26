'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { calculateCareerTrackPricing, careerAcceleratorTracks } from '@/lib/career-accelerator-v2'
import { ensureReferralIdentity, getStoredReferralCode } from '@/components/layout/ReferralTracker'

function sourceParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const identity = ensureReferralIdentity()
  return {
    sourcePage: window.location.pathname,
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    referralCode: params.get('ref') || params.get('referral') || params.get('ambassador') || getStoredReferralCode(),
    visitorId: identity.visitorId,
    sessionId: identity.sessionId,
  }
}

function initialReferralCode() {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  return params.get('ref') || params.get('referral') || params.get('ambassador') || getStoredReferralCode()
}

export default function CareerTrackSelector({ defaultTrackSlug }: { defaultTrackSlug?: string }) {
  const [selected, setSelected] = useState<string[]>(defaultTrackSlug ? [defaultTrackSlug] : [])
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [referralCode, setReferralCode] = useState(initialReferralCode)
  const pricing = useMemo(() => calculateCareerTrackPricing(selected), [selected])
  const selectedTracks = careerAcceleratorTracks.filter((track) => selected.includes(track.slug))

  function selectProgramme(slug: string) {
    setSelected((current) => current.includes(slug) ? [] : [slug])
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected.length) {
      setStatus('error')
      setMessage('Select a Career Accelerator programme before payment.')
      return
    }

    setStatus('sending')
    setMessage('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const sources = sourceParams()
    const payload = {
      kind: 'accelerator',
      programCode: 'NGTP',
      programName: selectedTracks[0]?.title || 'Career Accelerator',
      amount: pricing.total,
      selectedTrackSlugs: selectedTracks.map((track) => track.slug),
      selectedTrackNames: selectedTracks.map((track) => track.title),
      trackBundleRule: pricing.ruleName,
      cohort: 'Next Cohort',
      fullName: String(formData.get('fullName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      occupation: String(formData.get('occupation') || '').trim(),
      customerCategory: String(formData.get('customerCategory') || '').trim(),
      primaryGoal: String(formData.get('primaryGoal') || '').trim(),
      biggestChallenge: String(formData.get('biggestChallenge') || '').trim(),
      referralCode: String(formData.get('referralCode') || sources.referralCode || '').trim(),
      ...sources,
    }
    payload.referralCode = String(formData.get('referralCode') || sources.referralCode || '').trim()

    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Payment could not be initialized.')
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
        return
      }
      throw new Error('Payment link was not returned.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setStatus((current) => current === 'sending' ? 'idle' : current)
    }
  }

  return (
    <section id="enroll" className="section border-t border-white/10 bg-white/[0.012]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <span className="eyebrow">Choose Programme</span>
          <h2 className="mt-5 text-4xl font-semibold text-white md:text-5xl">Select the Career Accelerator programme you want.</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-steel">
            Each programme is independent and costs NGN 10,000. Pick one programme now, then proceed securely through Paystack.
          </p>

          <div className="mt-8 grid gap-3">
            {careerAcceleratorTracks.map((track) => {
              const isSelected = selected.includes(track.slug)
              return (
                <button
                  key={track.slug}
                  type="button"
                  onClick={() => selectProgramme(track.slug)}
                  className={`grid gap-3 rounded-lg border p-4 text-left transition md:grid-cols-[auto_1fr_auto] md:items-center ${isSelected ? 'border-signal/70 bg-signal/10' : 'border-white/10 bg-white/[0.035] hover:border-white/25'}`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md border ${isSelected ? 'border-signal bg-signal text-white' : 'border-white/20 text-transparent'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-white">{track.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-steel">{track.description}</span>
                  </span>
                  <span className="text-sm font-bold text-frost">NGN {track.price.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={submit} className="glass grid gap-5 self-start rounded-lg p-5 md:p-7">
          <div>
            <p className="text-xl font-semibold text-white">Review selection</p>
            <p className="mt-2 text-sm leading-6 text-steel">Paystack payment starts after your details are submitted.</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-steel">Selected Programme</span>
              <span className="text-sm font-bold text-white">{pricing.selectedCount ? '1 Programme' : 'None'}</span>
            </div>
            <div className="mt-4 grid gap-2">
              {selectedTracks.length ? selectedTracks.map((track) => (
                <p key={track.slug} className="text-sm text-frost">{track.title}</p>
              )) : <p className="text-sm text-steel">No programme selected yet.</p>}
            </div>
            <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-sm">
              <Line label="Programme Fee" value={`NGN ${pricing.subtotal.toLocaleString()}`} />
              <Line label="Pricing Rule" value={pricing.ruleName} />
              <div className="flex items-center justify-between gap-4 text-lg font-semibold text-white">
                <span>Final Price</span>
                <span>NGN {pricing.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field name="fullName" label="Full name" required />
            <Field name="email" label="Email" type="email" required />
            <Field name="phone" label="Phone / WhatsApp" type="tel" required />
            <Field name="occupation" label="Occupation" />
            <label>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Customer category</span>
              <select name="customerCategory" className="nexora-select w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition focus:border-signal">
                <option value="">Select option</option>
                {['NYSC currently serving', 'NYSC completed', 'Final-year student', 'Graduate', 'Young professional', 'Working professional', 'Unemployed', 'Other'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Career goal</span>
              <textarea name="primaryGoal" rows={4} className="w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition focus:border-signal" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Career challenge</span>
              <textarea name="biggestChallenge" rows={4} className="w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition focus:border-signal" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Referral code</span>
              <input
                name="referralCode"
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value)}
                placeholder="Enter referral code if someone invited you"
                className="w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition focus:border-signal"
              />
              {referralCode ? <span className="mt-2 block text-xs text-frost">Referral code will be attached to this enrolment.</span> : null}
            </label>
          </div>

          <button disabled={status === 'sending'} className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60">
            {status === 'sending' ? 'Starting payment...' : 'Proceed to Paystack'}
            <ArrowRight className="h-4 w-4" />
          </button>
          {message ? <p className="text-sm text-red-300">{message}</p> : null}
        </form>
      </div>
    </section>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 text-steel"><span>{label}</span><span className="text-right font-semibold text-frost">{value}</span></div>
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">{label}</span>
      <input {...props} className="w-full rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition focus:border-signal" />
    </label>
  )
}
