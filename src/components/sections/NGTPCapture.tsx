'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Mail } from 'lucide-react'

const targetDate = new Date('2026-08-01T09:00:00+01:00')

function getTimeLeft() {
  const difference = Math.max(targetDate.getTime() - Date.now(), 0)

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

export default function NGTPCapture() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const countdown = useMemo(() => Object.entries(timeLeft), [timeLeft])

  useEffect(() => {
    const interval = window.setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="mt-6 grid gap-4">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-signal" />
          <p className="text-sm font-semibold text-white">Cohort countdown</p>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          {countdown.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <p className="text-2xl font-semibold text-white">{String(value).padStart(2, '0')}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-steel">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <form
        className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5"
        data-crm-integration="nexos-airtable-ngtp-interest"
        onSubmit={(event) => {
          event.preventDefault()
          if (!email.trim()) return
          setSubmitted(true)
        }}
      >
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Get cohort updates</span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="min-h-12 w-full rounded-full border border-white/10 bg-black/10 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-steel/55 focus:border-signal/60"
              />
            </div>
            <button type="submit" className="button-primary min-h-12 rounded-full px-6 text-sm font-semibold">
              Notify Me
            </button>
          </div>
        </label>
        {submitted ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-frost">
            <CheckCircle2 className="h-4 w-4 text-signal" />
            Interest captured locally. Connect this form to NEXOS Airtable when the CRM endpoint is ready.
          </p>
        ) : (
          <p className="mt-4 text-xs leading-6 text-steel">CRM placeholder ready for NEXOS Airtable integration.</p>
        )}
      </form>
    </div>
  )
}
