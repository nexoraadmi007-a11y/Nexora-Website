'use client'

import { useEffect } from 'react'

const REFERRAL_KEY = 'nexora_referral_code'
const VISITOR_KEY = 'nexora_visitor_id'
const SESSION_KEY = 'nexora_session_id'
const ATTRIBUTION_DAYS = 30

function id(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function cookie(name: string) {
  const match = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
}

function setCookie(name: string, value: string, days = ATTRIBUTION_DAYS) {
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

export function getStoredReferralCode() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(REFERRAL_KEY) || sessionStorage.getItem(REFERRAL_KEY) || cookie(REFERRAL_KEY)
}

export function ensureReferralIdentity() {
  const visitorId = localStorage.getItem(VISITOR_KEY) || id('VIS')
  const sessionId = sessionStorage.getItem(SESSION_KEY) || id('SES')
  localStorage.setItem(VISITOR_KEY, visitorId)
  sessionStorage.setItem(SESSION_KEY, sessionId)
  return { visitorId, sessionId }
}

export default function ReferralTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('ref') || params.get('referral') || params.get('ambassador') || ''
    const { visitorId, sessionId } = ensureReferralIdentity()
    const storedCode = code || getStoredReferralCode()

    if (code) {
      localStorage.setItem(REFERRAL_KEY, code)
      sessionStorage.setItem(REFERRAL_KEY, code)
      setCookie(REFERRAL_KEY, code)
    }

    if (!storedCode) return

    fetch('/api/growth/referral-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode: storedCode,
        visitorId,
        sessionId,
        eventType: code ? 'LINK_CLICKED' : 'LANDING_PAGE_VIEWED',
        pageUrl: window.location.href,
      }),
      keepalive: true,
    }).catch(() => undefined)
  }, [])

  return null
}
