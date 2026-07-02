'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, ExternalLink, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react'

type Applicant = {
  id: string
  fields: Record<string, unknown>
}

type ApiResult = {
  stages?: string[]
  applicants?: Applicant[]
  error?: string
}

const actions = [
  { key: 'review', label: 'Review', tone: 'neutral' },
  { key: 'shortlist', label: 'Shortlist', tone: 'blue' },
  { key: 'schedule_interview', label: 'Schedule Interview', tone: 'neutral' },
  { key: 'pass_interview', label: 'Pass Interview', tone: 'green' },
  { key: 'move_bootcamp', label: 'Bootcamp', tone: 'blue' },
  { key: 'move_probation', label: 'Probation', tone: 'neutral' },
  { key: 'approve_official', label: 'Approve Official', tone: 'green' },
  { key: 'reject', label: 'Reject', tone: 'red' },
]

function value(fields: Record<string, unknown>, key: string) {
  const data = fields[key]
  if (Array.isArray(data)) return data.join(', ')
  if (typeof data === 'number') return String(data)
  if (typeof data === 'boolean') return data ? 'Yes' : 'No'
  return typeof data === 'string' ? data : ''
}

function rawAnswer(fields: Record<string, unknown>, key: string) {
  try {
    const raw = value(fields, 'Raw Channel Response')
    if (!raw) return ''
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const item = parsed[key]
    return typeof item === 'string' ? item : typeof item === 'number' ? String(item) : ''
  } catch {
    return ''
  }
}

function short(text: string, max = 160) {
  return text.length > max ? `${text.slice(0, max)}...` : text
}

export default function AdminRecruitmentDashboard() {
  const [secret, setSecret] = useState('')
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('')
  const [note, setNote] = useState('')
  const [stages, setStages] = useState<string[]>([])
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const visibleApplicants = useMemo(() => applicants, [applicants])

  async function load() {
    if (!secret) {
      setMessage('Enter the admin secret to load recruitment records.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const params = new URLSearchParams()
      if (stage) params.set('stage', stage)
      if (query) params.set('q', query)
      const response = await fetch(`/api/growth-associate/admin?${params}`, {
        headers: { 'x-nexora-admin-secret': secret },
      })
      const result = (await response.json()) as ApiResult
      if (!response.ok) throw new Error(result.error || 'Could not load applicants.')
      setStages(result.stages || [])
      setApplicants(result.applicants || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load applicants.')
    } finally {
      setLoading(false)
    }
  }

  async function act(applicant: Applicant, action: string) {
    if (!secret) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth-associate/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ id: applicant.id, action, note }),
      })
      const result = (await response.json()) as { error?: string; stage?: string }
      if (!response.ok) throw new Error(result.error || 'Action failed.')
      setMessage(`Updated ${value(applicant.fields, 'Full Name') || applicant.id} to ${result.stage}.`)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem('nexora-growth-admin-secret') || ''
    setSecret(saved)
  }, [])

  useEffect(() => {
    if (secret) window.localStorage.setItem('nexora-growth-admin-secret', secret)
  }, [secret])

  return (
    <main className="min-h-screen bg-[#020812] px-5 py-24 text-white md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Private recruitment command center</span>
            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Growth Associate Recruitment</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-steel md:text-base">
              Review applications, shortlist candidates, track interview and bootcamp stages, then activate official associates with referral tools.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-steel">
            <ShieldCheck className="h-5 w-5 text-[#7fd3a6]" />
            Admin only
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr_auto]">
          <label className="grid gap-2 text-sm text-steel">
            Admin secret
            <input value={secret} onChange={(event) => setSecret(event.target.value)} type="password" className="min-h-12 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-white outline-none focus:border-signal" />
          </label>
          <label className="grid gap-2 text-sm text-steel">
            Stage
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="min-h-12 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-white outline-none focus:border-signal">
              <option value="">All stages</option>
              {stages.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-steel">
            Search
            <span className="flex min-h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-4">
              <Search className="h-4 w-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-white outline-none" />
            </span>
          </label>
          <button onClick={load} disabled={loading} className="button-primary mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Load
          </button>
        </div>

        <label className="mt-5 grid gap-2 text-sm text-steel">
          Admin note for next action
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-white outline-none focus:border-signal" />
        </label>

        <div aria-live="polite" className="min-h-8 pt-5 text-sm font-semibold text-[#9ec2f7]">{message}</div>

        <div className="mt-4 grid gap-5">
          {visibleApplicants.map((applicant) => {
            const fields = applicant.fields
            const currentStage = value(fields, 'Recruitment Stage') || value(fields, 'Registration Status') || 'Application Received'
            const score = Number(value(fields, 'AI Score') || 0)
            const video = rawAnswer(fields, 'videoAssessmentLink')
            return (
              <article key={applicant.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold">{value(fields, 'Full Name') || 'Unnamed applicant'}</h2>
                      <span className="rounded-full border border-[#5793ff]/40 bg-[#5793ff]/10 px-3 py-1 text-xs font-bold uppercase text-[#9ec2f7]">{currentStage}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase text-steel">Score {score}/100</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-steel">
                      {value(fields, 'Email') || 'No email'} | {value(fields, 'Phone Number') || value(fields, 'WhatsApp Number') || 'No phone'} | {value(fields, 'Location') || 'No location'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-steel">
                      {value(fields, 'Current Status') || 'No status'} | {value(fields, 'Institution or Organization') || 'No institution'} | Reach: {value(fields, 'Estimated Reach') || '0'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-sm font-semibold">
                    {value(fields, 'AI Recommendation') === 'Strong Candidate' ? <CheckCircle2 className="h-5 w-5 text-[#7fd3a6]" /> : value(fields, 'AI Recommendation') === 'Not Recommended' ? <XCircle className="h-5 w-5 text-[#ff9b91]" /> : <Clock3 className="h-5 w-5 text-[#f2c979]" />}
                    {value(fields, 'AI Recommendation') || 'Pending screening'}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <Info title="Strengths" body={short(value(fields, 'AI Strengths'), 260)} />
                  <Info title="Weaknesses" body={short(value(fields, 'AI Weaknesses'), 260)} />
                  <Info title="Interview questions" body={short(value(fields, 'AI Interview Questions'), 260)} />
                </div>

                <div className="mt-5 grid gap-3 text-sm text-steel md:grid-cols-2">
                  <p><span className="font-semibold text-white">Motivation:</span> {short(value(fields, 'Why Become an Ambassador?'), 240) || 'Not provided'}</p>
                  <p><span className="font-semibold text-white">Networks:</span> {short(value(fields, 'Communities or Networks'), 240) || 'Not provided'}</p>
                  {video ? <a href={video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#9ec2f7]"><ExternalLink className="h-4 w-4" /> Open video assessment</a> : <p>No video assessment link.</p>}
                  {value(fields, 'Calendly Invite Link') ? <a href={value(fields, 'Calendly Invite Link')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#9ec2f7]"><ExternalLink className="h-4 w-4" /> Open interview invite</a> : <p>No interview invite link yet.</p>}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {actions.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => act(applicant, item.key)}
                      disabled={loading}
                      className={`min-h-10 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60 ${item.tone === 'green' ? 'border-[#7fd3a6]/40 bg-[#7fd3a6]/10 text-[#b7f0ce]' : item.tone === 'red' ? 'border-[#ff9b91]/40 bg-[#ff9b91]/10 text-[#ffc5bf]' : item.tone === 'blue' ? 'border-[#5793ff]/40 bg-[#5793ff]/10 text-[#bcd6ff]' : 'border-white/10 bg-white/[0.035] text-white'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </article>
            )
          })}
          {!loading && !visibleApplicants.length ? <p className="rounded-lg border border-white/10 p-8 text-center text-steel">No applicants loaded yet.</p> : null}
        </div>
      </section>
    </main>
  )
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase text-[#8fb7f3]">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-steel">{body || 'Not available.'}</p>
    </div>
  )
}
