'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function getOrCreateVisitorId() {
  const key = 'nexora_visitor_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const next = `VIS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  window.localStorage.setItem(key, next)
  return next
}

function getOrCreateSessionId() {
  const key = 'nexora_session_id'
  const existing = window.sessionStorage.getItem(key)
  if (existing) return existing
  const next = `SES-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  window.sessionStorage.setItem(key, next)
  return next
}

export function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const referralCode = searchParams.get('ref')?.trim()
    if (!referralCode) return
    document.cookie = `nexora_referral_code=${encodeURIComponent(referralCode)}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax`
    fetch('/api/growth/referral-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode,
        eventType: 'LINK_CLICKED',
        visitorId: getOrCreateVisitorId(),
        sessionId: getOrCreateSessionId(),
        pageUrl: window.location.href,
      }),
    }).catch(() => undefined)
  }, [searchParams])

  return null
}
