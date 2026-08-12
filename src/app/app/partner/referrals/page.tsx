'use client'

import { useEffect, useState } from 'react'
import { Copy, Share2 } from 'lucide-react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard, ProgressBar } from '@/components/product'
import { formatNaira } from '@/config/programmes'

type Dashboard = {
  partner: { referralCode: string; referralUrl: string }
  metrics: { clicks: number; registrations: number; paidRegistrations: number; qualifiedSales: number; conversionRate: number | null }
  referrals: Array<{ name: string; programme: string; track: string; registrationDate: string; payment: string; qualification: string; commission: number }>
}

function savedPartnerEmail() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('nexora_partner_email') || ''
}

function savedReferralCode() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('nexora_partner_referral_code') || ''
}

export default function PartnerReferralsPage() {
  const [period, setPeriod] = useState('This Month')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const email = savedPartnerEmail()
    const code = savedReferralCode()
    if (!email && !code) {
      setMessage('Your referral link is ready after partner activation.')
      return
    }
    const params = new URLSearchParams()
    if (code) params.set('code', code)
    if (email) params.set('email', email)
    fetch(`/api/partner/dashboard?${params.toString()}`)
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error || 'Referral dashboard could not be loaded.')
        setDashboard(body)
        if (body.partner?.email) window.localStorage.setItem('nexora_partner_email', body.partner.email.toLowerCase())
        if (body.partner?.referralCode) window.localStorage.setItem('nexora_partner_referral_code', body.partner.referralCode)
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Referral dashboard could not be loaded.'))
  }, [])

  function copyLink() {
    if (!dashboard?.partner.referralUrl) return
    navigator.clipboard?.writeText(dashboard.partner.referralUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function share() {
    const link = dashboard?.partner.referralUrl
    if (!link) return
    if (navigator.share) {
      await navigator.share({ title: 'Nexora Institute Referral', text: 'Join Nexora Institute through my referral link.', url: link }).catch(() => undefined)
      return
    }
    copyLink()
  }

  const metrics = dashboard?.metrics
  const rows = dashboard?.referrals.length ? dashboard.referrals.map((item) => [
    item.name,
    item.programme,
    item.track,
    item.registrationDate,
    item.payment,
    item.qualification,
    formatNaira(item.commission),
  ]) : [['No referral yet', '-', '-', '-', '-', '-', '-']]

  return (
    <AppShell title="Referrals">
      <div className="page-grid">
        <Card>
          <div className="card-actions">
            {['This Month', 'Last Month', 'Lifetime'].map((item) => <button key={item} className={`btn btn-${period === item ? 'primary' : 'secondary'}`} type="button" onClick={() => setPeriod(item)}>{item}</button>)}
          </div>
        </Card>

        {!dashboard ? (
          <Card>
            <h3>Your referral link is ready.</h3>
            <p className="muted">{message || 'Share your Nexora referral link with people who may benefit from our programmes. Your referral activity will appear here.'}</p>
            <div className="card-actions"><a className="btn btn-primary" href="/app/partner/activate">Activate Partner Profile</a></div>
          </Card>
        ) : (
          <Card>
            <p className="eyebrow">Your Partner Referral</p>
            <h3>{dashboard.partner.referralCode}</h3>
            <code>{dashboard.partner.referralUrl}</code>
            {copied ? <p className="form-message success">Copied ✓</p> : null}
            <div className="card-actions">
              <button className="btn btn-secondary" type="button" onClick={copyLink}><Copy size={16} /> Copy Referral Link</button>
              <button className="btn btn-primary" type="button" onClick={share}><Share2 size={16} /> Share</button>
            </div>
          </Card>
        )}

        <div className="metric-grid">
          <MetricCard label="Clicks" value={String(metrics?.clicks || 0)} note={period} />
          <MetricCard label="Registrations" value={String(metrics?.registrations || 0)} note={period} />
          <MetricCard label="Paid Registrations" value={String(metrics?.paidRegistrations || 0)} note={period} />
          <MetricCard label="Qualified Sales" value={String(metrics?.qualifiedSales || 0)} note={period} />
          <MetricCard label="Conversion Rate" value={metrics?.conversionRate === null || metrics?.conversionRate === undefined ? '-' : `${metrics.conversionRate}%`} note="Qualified sales / clicks" />
        </div>
        <Card>
          <h3>Referral Funnel</h3>
          <div className="list">
            <p>Clicks: <strong>{metrics?.clicks || 0}</strong></p>
            <ProgressBar value={100} />
            <p>Registrations: <strong>{metrics?.registrations || 0}</strong></p>
            <ProgressBar value={metrics?.clicks ? ((metrics.registrations / metrics.clicks) * 100) : 0} />
            <p>Paid Registrations: <strong>{metrics?.paidRegistrations || 0}</strong></p>
            <ProgressBar value={metrics?.registrations ? ((metrics.paidRegistrations / metrics.registrations) * 100) : 0} />
            <p>Qualified Sales: <strong>{metrics?.qualifiedSales || 0}</strong></p>
            <ProgressBar value={metrics?.paidRegistrations ? ((metrics.qualifiedSales / metrics.paidRegistrations) * 100) : 0} />
          </div>
        </Card>
        <DataTable headers={['Name', 'Programme', 'Track', 'Registration Date', 'Payment', 'Qualification', 'Commission']} rows={rows} />
      </div>
    </AppShell>
  )
}
