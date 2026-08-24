'use client'

import { useState } from 'react'

export function ReferralLinkActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1600) }
  async function share() { if (navigator.share) await navigator.share({ title: 'Nexora Institute', text: 'Join Nexora Institute through my referral link.', url }); else await copy() }
  return <div className="card-actions"><button className="btn btn-primary" type="button" onClick={copy}>{copied ? 'Copied ✓' : 'Copy Link'}</button><button className="btn btn-secondary" type="button" onClick={share}>Share Link</button></div>
}
