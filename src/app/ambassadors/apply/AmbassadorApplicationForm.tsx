'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Network, ShieldCheck, Users } from 'lucide-react'
import { motion } from 'framer-motion'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

function submissionId() {
  return globalThis.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const inputClass = 'min-h-[50px] w-full rounded-lg border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-steel/45 focus:border-signal/70 focus:ring-2 focus:ring-signal/15'

const nigerianStates = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
]

export default function AmbassadorApplicationForm() {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')
  const [reference, setReference] = useState('')
  const [requestId, setRequestId] = useState(submissionId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>

    setState('submitting')
    setMessage('')
    try {
      const response = await fetch('/api/ambassadors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          communicationsConsent: true,
          ambassadorTermsAccepted: true,
          externalSubmissionId: requestId,
        }),
      })
      const result = (await response.json()) as { error?: string; registrationReference?: string }
      if (!response.ok) throw new Error(result.error || 'Submission failed.')

      setReference(result.registrationReference || requestId)
      setState('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Submission failed.')
      setState('error')
    }
  }

  function reset() {
    setRequestId(submissionId())
    setReference('')
    setMessage('')
    setState('idle')
  }

  return (
    <section className="relative overflow-hidden border-b border-white/10 px-5 pb-24 pt-32 md:px-8 md:pb-32 md:pt-40">
      <div className="grid-field absolute inset-0 opacity-45" />
      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <span className="eyebrow">Growth Associate Recruitment</span>
          <h1 className="mt-7 max-w-xl text-4xl font-semibold leading-[1.08] text-white md:text-6xl">
            Apply to join NEXORA. <span className="text-[#8fb7f3]">Enter a structured recruitment journey.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-steel md:text-lg">
            Growth Associates are selected through application review and interview before official onboarding.
          </p>

          <div className="mt-10 grid gap-5 border-y border-white/10 py-7">
            <Benefit icon={Users} title="Short application" copy="Submit only the basic contact details needed for first-stage screening." />
            <Benefit icon={Network} title="Interview scheduling" copy="Selected applicants receive an interview invitation and choose a suitable time through Calendly." />
            <Benefit icon={ShieldCheck} title="Biodata after selection" copy="Full biodata will be requested only from candidates who are selected for onboarding." />
          </div>
        </div>

        <div className="min-w-0">
          {state === 'success' ? (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass flex min-h-[560px] flex-col justify-center rounded-lg p-7 md:p-12">
              <CheckCircle2 className="h-12 w-12 text-[#7fd3a6]" />
              <p className="mt-8 text-xs font-bold uppercase text-[#8fb7f3]">Application Submitted</p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Thank you for applying to become a NEXORA Growth Associate.</h2>
              <div className="mt-5 grid max-w-2xl gap-4 text-sm leading-7 text-steel md:text-base">
                <p>Your application has been received successfully.</p>
                <p>Our recruitment team will carefully review your application alongside other candidates.</p>
                <p>Only shortlisted applicants will proceed to the interview stage.</p>
                <p>If selected, you will receive an invitation by email.</p>
                <p>Thank you for your interest in joining NEXORA.</p>
              </div>
              <p className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4 text-xs font-semibold uppercase tracking-[0.14em] text-steel">Reference: {reference}</p>
              <button type="button" onClick={reset} className="button-secondary mt-9 min-h-12 w-fit rounded-lg px-6 text-sm font-semibold">Submit another application</button>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="glass rounded-lg p-5 md:p-9">
              <div className="border-b border-white/10 pb-7">
                <p className="text-xs font-bold uppercase text-[#8fb7f3]">Growth associate application</p>
                <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Start your Growth Associate application.</h2>
                <p className="mt-3 text-sm leading-7 text-steel">Required fields are marked with an asterisk.</p>
              </div>

              <FormSection title="Personal information">
                <Field label="Full name" name="fullName" autoComplete="name" required wide />
                <Field label="Email address" name="email" type="email" autoComplete="email" />
                <Field label="Phone number" name="phoneNumber" type="tel" autoComplete="tel" required />
                <Field label="WhatsApp number" name="whatsAppNumber" type="tel" />
                <SelectField label="Gender" name="gender" options={['Female', 'Male']} />
                <SelectField label="State" name="state" options={nigerianStates} />
              </FormSection>

              <fieldset className="border-0 border-t border-white/10 px-0 pb-0 pt-7">
                <label className="sr-only" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              </fieldset>

              <div aria-live="polite" className="min-h-6 pt-5 text-sm font-medium text-[#ffb4aa]">{message}</div>
              <button disabled={state === 'submitting'} className="button-primary mt-3 min-h-12 w-full rounded-lg px-6 text-sm font-bold disabled:cursor-wait disabled:opacity-60">
                {state === 'submitting' ? 'Submitting application...' : 'Submit growth associate application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Benefit({ icon: Icon, title, copy }: { icon: typeof Users; title: string; copy: string }) {
  return <div className="flex gap-4"><Icon className="mt-1 h-5 w-5 shrink-0 text-[#7fd3a6]" /><div><h2 className="text-sm font-semibold text-white">{title}</h2><p className="mt-1 text-sm leading-6 text-steel">{copy}</p></div></div>
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="grid grid-cols-1 gap-5 border-0 border-b border-white/10 px-0 py-8 md:grid-cols-2"><legend className="col-span-full mb-1 text-base font-semibold text-white">{title}</legend>{children}</fieldset>
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }
function Field({ label, wide, ...props }: FieldProps) {
  return <label className={`grid min-w-0 gap-2 text-sm text-steel ${wide ? 'md:col-span-2' : ''}`}>{label}{props.required ? ' *' : ''}<input {...props} className={inputClass} /></label>
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return <label className="grid min-w-0 gap-2 text-sm text-steel">{label}<select name={name} className={`${inputClass} nexora-select`}><option value="">Select option</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}
