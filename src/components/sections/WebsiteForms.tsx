'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

type FormKind = 'webinar' | 'accelerator' | 'batp' | 'complete' | 'community' | 'contact' | 'corporate'

type Field = {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  required?: boolean
  options?: string[]
}

const commonFields: Field[] = [
  { name: 'fullName', label: 'Full name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', required: true },
  { name: 'occupation', label: 'Occupation' },
  { name: 'customerCategory', label: 'Customer category', type: 'select', options: ['NYSC currently serving', 'NYSC completed', 'Final-year student', 'Graduate', 'Young professional', 'Working professional', 'Business owner', 'Entrepreneur', 'Corporate representative', 'Other'] },
  { name: 'referralCode', label: 'Referral code' },
]

const fieldsByKind: Record<FormKind, Field[]> = {
  webinar: [
    ...commonFields,
    { name: 'programCode', label: 'Webinar path', type: 'select', options: ['NGTP', 'BATP', 'Mixed'] },
  ],
  accelerator: [
    ...commonFields,
    { name: 'programCode', label: 'Program', type: 'select', required: true, options: ['NGTP'] },
    { name: 'state', label: 'State' },
    { name: 'cohort', label: 'Preferred cohort' },
    { name: 'primaryGoal', label: 'Career goal', type: 'textarea' },
    { name: 'biggestChallenge', label: 'Career challenge', type: 'textarea' },
  ],
  batp: [
    ...commonFields,
    { name: 'programCode', label: 'Program', type: 'select', required: true, options: ['BATP'] },
    { name: 'businessName', label: 'Business name', required: true },
    { name: 'industry', label: 'Industry' },
    { name: 'businessSize', label: 'Business size', type: 'select', options: ['Solo', '1-5', '6-10', '11-50', '51-200', '201+'] },
    { name: 'yearsInBusiness', label: 'Years in business' },
    { name: 'monthlyCustomers', label: 'Monthly customers' },
    { name: 'currentAIUsage', label: 'Current AI usage', type: 'select', options: ['None', 'Basic', 'Intermediate', 'Advanced', 'Team Adoption', 'Not Sure'] },
    { name: 'website', label: 'Website' },
    { name: 'linkedIn', label: 'LinkedIn' },
    { name: 'businessChallenges', label: 'Business challenges', type: 'textarea', required: true },
    { name: 'learningGoals', label: 'Learning goals', type: 'textarea', required: true },
  ],
  complete: [
    ...commonFields,
    { name: 'programCode', label: 'Program', type: 'select', required: true, options: ['COMPLETE'] },
    { name: 'currentPath', label: 'Best describes you', type: 'select', options: ['Freelancer', 'Consultant', 'Agency owner', 'Startup founder', 'Professional building a side business', 'Business owner', 'Other'] },
    { name: 'businessName', label: 'Business or project name' },
    { name: 'industry', label: 'Industry' },
    { name: 'primaryGoal', label: 'Career goal', type: 'textarea', required: true },
    { name: 'businessChallenges', label: 'Business or monetization challenge', type: 'textarea', required: true },
    { name: 'learningGoals', label: 'What do you want to build with AI?', type: 'textarea', required: true },
  ],
  community: [
    ...commonFields,
    { name: 'communityInterest', label: 'Community interest', type: 'select', options: ['Weekly webinars', 'Daily AI tips', 'Career resources', 'Challenges', 'Networking'] },
  ],
  contact: [
    { name: 'fullName', label: 'Full name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone / WhatsApp', type: 'tel' },
    { name: 'inquiryType', label: 'Inquiry type', type: 'select', required: true, options: ['Career Accelerator', 'Weekly Webinar', 'Corporate Training', 'Partnership', 'Community', 'General Inquiry'] },
    { name: 'message', label: 'Message', type: 'textarea', required: true },
  ],
  corporate: [
    { name: 'companyName', label: 'Company name', required: true },
    { name: 'contactPerson', label: 'Contact person', required: true },
    { name: 'role', label: 'Role' },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true },
    { name: 'industry', label: 'Industry' },
    { name: 'location', label: 'Location' },
    { name: 'trainingInterest', label: 'Training interest', type: 'select', options: ['AI Productivity Assessment', 'Corporate Workshop', 'Team Training', 'Executive Briefing', 'Custom Program'] },
    { name: 'preferredTrainingFormat', label: 'Preferred format', type: 'select', options: ['On-site', 'Virtual', 'Hybrid', 'Not Sure'] },
    { name: 'message', label: 'Training need', type: 'textarea', required: true },
  ],
}

function sourceParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    sourcePage: window.location.pathname,
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    referralCode: params.get('ref') || params.get('referral') || params.get('ambassador') || '',
  }
}

export default function WebsiteForm({
  kind,
  title,
  cta,
  context,
  payAfterSubmit = false,
}: {
  kind: FormKind
  title: string
  cta: string
  context?: Record<string, string | number>
  payAfterSubmit?: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const fields = useMemo(() => fieldsByKind[kind], [kind])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setMessage('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const payload: Record<string, unknown> = { kind, ...context, ...sourceParams() }
    fields.forEach((field) => {
      const value = String(formData.get(field.name) || '').trim()
      if (field.name === 'referralCode' && !value) return
      payload[field.name] = value
    })

    try {
      const response = await fetch(payAfterSubmit ? '/api/paystack/initialize' : '/api/website/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Submission failed')
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
        return
      }
      setStatus('success')
      setMessage(data.message || 'Submitted successfully. Nexora will follow up.')
      form.reset()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={submit} className="glass grid gap-4 rounded-[28px] p-5 md:p-7">
      <div>
        <p className="text-xl font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm leading-6 text-steel">Your details are sent securely into the Nexora Airtable operating system.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea name={field.name} required={field.required} rows={5} className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition focus:border-signal" />
            ) : field.type === 'select' ? (
              <select name={field.name} required={field.required} className="nexora-select w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition focus:border-signal">
                <option value="">Select option</option>
                {field.options?.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : (
              <input name={field.name} required={field.required} defaultValue={field.name === 'referralCode' ? sourceParams().referralCode : undefined} type={field.type || 'text'} className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition focus:border-signal" />
            )}
          </label>
        ))}
      </div>
      <button disabled={status === 'sending'} className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60">
        {status === 'sending' ? 'Submitting...' : cta}
        {status === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      </button>
      {message ? <p className={`text-sm ${status === 'error' ? 'text-red-300' : 'text-frost'}`}>{message}</p> : null}
    </form>
  )
}
