'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Copy, Link as LinkIcon, RefreshCw, ShieldCheck } from 'lucide-react'

type PortalData = {
  associate: {
    name: string
    email: string
    status: string
    referralCode: string
    referralLink: string
    monthlyTarget: number
    commissionRate: number
    paidReferralCount: number
    totalCommissionEarned: number
    commissionPaid: number
    commissionBalance: number
  }
  metrics: {
    month: string
    confirmedIntake: number
    remainingTarget: number
    progress: number
    grossRevenue: number
    netRevenue: number
    totalClicks: number
    checkoutStarted: number
    totalReferralRecords: number
    conflictCount: number
  }
  attributions: Array<{
    id: string
    paymentReference: string
    source: string
    status: string
    amount: number
    netAmount: number
    updatedAt: string
    conflictReason: string
  }>
  referrals: Array<{
    id: string
    referralId: string
    status: string
    commissionStatus: string
    commissionAmount: number
    programmeFee: number
    paymentReference: string
    referralDate: string
  }>
  events: Array<{
    id: string
    eventType: string
    occurredAt: string
    pageUrl: string
  }>
}

function money(value: number) {
  return `NGN ${Math.round(value || 0).toLocaleString()}`
}

function pct(value: number) {
  return `${Math.round((value || 0) * 100)}%`
}

function short(value: string, max = 52) {
  return value.length > max ? `${value.slice(0, max)}...` : value
}

export default function AssociatePortalClient() {
  const [code, setCode] = useState('')
  const [data, setData] = useState<PortalData | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  async function load(nextCode = code) {
    const cleanCode = nextCode.trim()
    if (!cleanCode) {
      setStatus('error')
      setMessage('Enter your referral code to open your dashboard.')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      const response = await fetch(`/api/growth/associate-portal?code=${encodeURIComponent(cleanCode)}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Dashboard could not be loaded.')
      setData(result)
      setCode(cleanCode)
      window.localStorage.setItem('nexora-associate-referral-code', cleanCode)
      setMessage('Dashboard loaded.')
    } catch (error) {
      setData(null)
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Dashboard could not be loaded.')
      return
    } finally {
      setStatus((current) => current === 'loading' ? 'idle' : current)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void load()
  }

  async function copyLink() {
    if (!data?.associate.referralLink) return
    await navigator.clipboard.writeText(data.associate.referralLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  useEffect(() => {
    const saved = window.localStorage.getItem('nexora-associate-referral-code') || ''
    if (saved) {
      setCode(saved)
      void load(saved)
    }
  }, [])

  const progressWidth = data ? `${Math.min(Math.max(data.metrics.progress, 0), 1) * 100}%` : '0%'

  return (
    <main className="min-h-screen bg-[#020812] px-5 py-24 text-white md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-6 border-b border-white/10 pb-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <span className="eyebrow">Growth associate portal</span>
            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Referral dashboard</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-steel md:text-base">
              Track your referral link, paid intakes, commission balance, and current monthly target. Records are pulled directly from the NEXORA Airtable operating system.
            </p>
          </div>

          <form onSubmit={submit} className="glass grid gap-3 rounded-lg p-4">
            <label className="grid gap-2 text-sm text-steel">
              Referral code
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter your code"
                className="min-h-12 rounded-lg border border-white/10 bg-white/[0.045] px-4 text-white outline-none focus:border-signal"
              />
            </label>
            <button disabled={status === 'loading'} className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-60">
              {status === 'loading' ? 'Loading...' : 'Open dashboard'}
              {status === 'loading' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </button>
            {message ? <p className={`text-sm ${status === 'error' ? 'text-red-300' : 'text-[#9ec2f7]'}`}>{message}</p> : null}
          </form>
        </div>

        {data ? (
          <div className="mt-8 grid gap-6">
            <section className="glass rounded-lg p-5 md:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">{data.associate.name}</h2>
                    <span className="rounded-full border border-[#7fd3a6]/30 bg-[#7fd3a6]/10 px-3 py-1 text-xs font-bold uppercase text-[#b7f0ce]">
                      {data.associate.status || 'Active'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-steel">{data.associate.email || 'Email not shown'} | Code: {data.associate.referralCode}</p>
                </div>
                <button onClick={copyLink} className="button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold">
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied' : 'Copy referral link'}
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white"><LinkIcon className="h-4 w-4 text-[#8fb7f3]" /> Referral link</p>
                <p className="mt-2 break-all text-sm text-steel">{data.associate.referralLink}</p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <Metric label="Monthly intake" value={`${data.metrics.confirmedIntake}/${data.associate.monthlyTarget}`} />
              <Metric label="Remaining target" value={String(data.metrics.remainingTarget)} />
              <Metric label="Commission balance" value={money(data.associate.commissionBalance)} />
              <Metric label="Conflicts on hold" value={String(data.metrics.conflictCount)} />
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.025] p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">Current month</p>
                  <h2 className="mt-2 text-2xl font-semibold">Target progress</h2>
                </div>
                <p className="text-sm text-steel">{data.metrics.month} | {pct(data.metrics.progress)} achieved</p>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#5793ff]" style={{ width: progressWidth }} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <Metric label="Approved revenue" value={money(data.metrics.netRevenue)} compact />
                <Metric label="Referral clicks" value={String(data.metrics.totalClicks)} compact />
                <Metric label="Checkout started" value={String(data.metrics.checkoutStarted)} compact />
                <Metric label="Referral records" value={String(data.metrics.totalReferralRecords)} compact />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Panel title="Recent attributions" empty={!data.attributions.length ? 'No paid attribution records yet.' : ''}>
                {data.attributions.map((item) => (
                  <Row
                    key={item.id}
                    title={item.paymentReference || item.id}
                    meta={`${item.source || 'No source'} | ${item.status || 'No status'} | ${money(item.amount)}`}
                    note={item.conflictReason}
                  />
                ))}
              </Panel>

              <Panel title="Recent referrals" empty={!data.referrals.length ? 'No referral records yet.' : ''}>
                {data.referrals.map((item) => (
                  <Row
                    key={item.id}
                    title={item.referralId || item.paymentReference || item.id}
                    meta={`${item.status || 'Submitted'} | ${item.commissionStatus || 'Pending'} | ${money(item.commissionAmount)}`}
                    note={item.referralDate}
                  />
                ))}
              </Panel>
            </section>

            <Panel title="Recent referral activity" empty={!data.events.length ? 'No tracked referral activity yet.' : ''}>
              {data.events.map((event) => (
                <Row
                  key={event.id}
                  title={event.eventType || event.id}
                  meta={event.occurredAt || 'No date'}
                  note={event.pageUrl ? short(event.pageUrl, 120) : ''}
                />
              ))}
            </Panel>

            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-steel">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#7fd3a6]" />
              <p>
                Commission and monthly target progress are counted from approved Airtable attribution records. Any conflict shown here is waiting for admin review before it affects commission or ranking.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/[0.025] ${compact ? 'p-4' : 'p-5'}`}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</p>
      <p className={`${compact ? 'mt-2 text-xl' : 'mt-3 text-3xl'} font-semibold text-white`}>{value}</p>
    </div>
  )
}

function Panel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.025] p-5 md:p-6">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-3">
        {empty ? <p className="rounded-lg border border-white/10 p-4 text-sm text-steel">{empty}</p> : children}
      </div>
    </section>
  )
}

function Row({ title, meta, note }: { title: string; meta: string; note?: string }) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-steel">{meta}</p>
      {note ? <p className="mt-2 text-xs leading-5 text-steel">{note}</p> : null}
    </article>
  )
}
