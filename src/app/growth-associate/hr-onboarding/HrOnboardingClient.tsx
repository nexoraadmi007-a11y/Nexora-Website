'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Save, ShieldCheck } from 'lucide-react'

type Associate = {
  id: string
  name: string
  email: string
  hrStatus: string
  employmentLetterStatus: string
}

const states = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

function emptyForm() {
  return {
    legalName: '',
    dateOfBirth: '',
    residentialAddress: '',
    stateOfResidence: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    educationDetails: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    confirmAccountNumber: '',
  }
}

export default function HrOnboardingClient() {
  const [token, setToken] = useState('')
  const [associate, setAssociate] = useState<Associate | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const value = params.get('token') || ''
    setToken(value)
  }, [])

  const letterUrl = useMemo(() => token ? `/api/hr-onboarding/employment-letter?token=${encodeURIComponent(token)}` : '', [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setMessage('')
      try {
        const response = await fetch(`/api/hr-onboarding/profile?token=${encodeURIComponent(token)}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load onboarding profile.')
        if (cancelled) return
        setAssociate(result.associate)
        const profile = result.profile || {}
        setForm((current) => ({
          ...current,
          legalName: profile['Legal Name'] || result.associate?.name || '',
          dateOfBirth: profile['Date Of Birth'] || '',
          residentialAddress: profile['Residential Address'] || '',
          stateOfResidence: profile['State Of Residence'] || '',
          emergencyContactName: profile['Emergency Contact Name'] || '',
          emergencyContactPhone: profile['Emergency Contact Phone'] || '',
          educationDetails: profile['Education Details'] || '',
        }))
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not load onboarding profile.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  function update(key: keyof ReturnType<typeof emptyForm>, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(mode: 'save' | 'submit') {
    if (!token) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/hr-onboarding/profile', {
        method: mode === 'submit' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save onboarding details.')
      setMessage(mode === 'submit' ? 'HR onboarding submitted. You can now download your employment letter for signing.' : 'Draft saved.')
      if (associate) setAssociate({ ...associate, hrStatus: mode === 'submit' ? 'Submitted' : 'In Progress' })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save onboarding details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#030914] px-4 py-24 text-white md:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] md:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8fb7f3]">Growth Associate HR Onboarding</p>
              <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Complete your employment details</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-steel">
                These details are used for your HR record, payroll setup, and employment letter. Do not share this link.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#7fd3a6]/30 bg-[#7fd3a6]/10 px-4 py-3 text-sm font-bold text-[#b7f0ce]">
              <ShieldCheck className="h-4 w-4" />
              Secure link
            </div>
          </div>

          {message ? <p className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4 text-sm text-frost">{message}</p> : null}

          {!token ? (
            <p className="mt-6 rounded-lg border border-[#ff9b91]/30 bg-[#ff9b91]/10 p-4 text-sm text-[#ffc5bf]">No onboarding token was provided.</p>
          ) : associate ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Info label="Associate" value={associate.name} />
                <Info label="Email" value={associate.email || 'Not provided'} />
                <Info label="HR status" value={associate.hrStatus || 'Link Sent'} />
              </div>

              <div className="mt-8 grid gap-5">
                <h2 className="text-2xl font-semibold">Personal and HR information</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Legal name *" value={form.legalName} onChange={(value) => update('legalName', value)} />
                  <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => update('dateOfBirth', value)} />
                  <Select label="State of residence *" value={form.stateOfResidence} options={states} onChange={(value) => update('stateOfResidence', value)} />
                  <Field label="Emergency contact name *" value={form.emergencyContactName} onChange={(value) => update('emergencyContactName', value)} />
                  <Field label="Emergency contact phone *" value={form.emergencyContactPhone} onChange={(value) => update('emergencyContactPhone', value)} />
                  <Field label="Education details" value={form.educationDetails} onChange={(value) => update('educationDetails', value)} />
                </div>
                <Textarea label="Residential address *" value={form.residentialAddress} onChange={(value) => update('residentialAddress', value)} />
              </div>

              <div className="mt-8 grid gap-5">
                <h2 className="text-2xl font-semibold">Payroll details</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Bank name *" value={form.bankName} onChange={(value) => update('bankName', value)} />
                  <Field label="Account name *" value={form.accountName} onChange={(value) => update('accountName', value)} />
                  <Field label="Account number *" value={form.accountNumber} onChange={(value) => update('accountNumber', value)} />
                  <Field label="Confirm account number *" value={form.confirmAccountNumber} onChange={(value) => update('confirmAccountNumber', value)} />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => submit('save')} disabled={loading} className="button-secondary inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  Save draft
                </button>
                <button type="button" onClick={() => submit('submit')} disabled={loading} className="button-primary min-h-12 rounded-lg px-5 text-sm font-bold disabled:opacity-60">
                  Submit HR onboarding
                </button>
                <a href={letterUrl} target="_blank" rel="noreferrer" className="button-secondary inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold">
                  <Download className="h-4 w-4" />
                  View employment letter
                </a>
              </div>
            </>
          ) : loading ? (
            <p className="mt-6 text-sm text-steel">Loading onboarding profile...</p>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-steel">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 rounded-lg border border-white/10 bg-[#07111f] px-4 text-white outline-none transition focus:border-[#5793ff]" />
    </label>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-steel">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 rounded-lg border border-white/10 bg-[#07111f] px-4 text-white outline-none transition focus:border-[#5793ff]">
        <option value="">Select option</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-steel">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-white outline-none transition focus:border-[#5793ff]" />
    </label>
  )
}
