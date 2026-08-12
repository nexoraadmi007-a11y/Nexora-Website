'use client'

import { useEffect, useState } from 'react'
import { Copy, HandCoins, LineChart, Share2, Users, WalletCards } from 'lucide-react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { ChecklistItem, DataTable, MetricCard, ProgressBar } from '@/components/product'
import { formatNaira } from '@/config/programmes'

type Dashboard = {
  partner: {
    partnerId: string
    name: string
    email: string
    status: string
    referralCode: string
    referralUrl: string
    commissionRate: number
  }
  metrics: {
    clicks: number
    registrations: number
    paidRegistrations: number
    qualifiedSales: number
    conversionRate: number | null
    directQualifiedSales: number
    l2QualifiedSales: number
    l3QualifiedSales: number
    estimatedEarnings: number
    nextMilestone: string
    nextPayout: string
  }
  referrals: Array<{
    name: string
    programme: string
    track: string
    registrationDate: string
    payment: string
    qualification: string
    commission: number
  }>
}

function savedPartnerEmail() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('nexora_partner_email') || ''
}

export default function PartnerPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const email = savedPartnerEmail()
    if (!email) {
      setMessage('Activate your partner profile to generate your permanent referral identity.')
      return
    }
    fetch(`/api/partner/dashboard?email=${encodeURIComponent(email)}`)
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error || 'Partner dashboard could not be loaded.')
        setDashboard(body)
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Partner dashboard could not be loaded.'))
  }, [])

  function copy(value: string, label: string) {
    navigator.clipboard?.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1600)
  }

  async function share() {
    const link = dashboard?.partner.referralUrl
    if (!link) return
    if (navigator.share) {
      await navigator.share({ title: 'Nexora Institute', text: 'Join Nexora Institute through my referral link.', url: link }).catch(() => undefined)
      return
    }
    copy(link, 'link')
  }

  const progress = dashboard ? Math.min((dashboard.metrics.directQualifiedSales / 10) * 100, 100) : 0
  const referralRows = dashboard?.referrals.length ? dashboard.referrals.map((item) => [
    item.name,
    item.programme,
    item.track,
    item.registrationDate,
    item.payment,
    item.qualification,
    formatNaira(item.commission),
  ]) : [['No referral yet', '-', '-', '-', '-', '-', '-']]

  return (
    <AppShell title="Partner Overview">
      <div className="page-grid">
        {message && !dashboard ? (
          <Card>
            <p className="eyebrow">Partner Activation</p>
            <h3>Your referral tools are almost ready.</h3>
            <p className="muted">{message}</p>
            <div className="card-actions"><a className="btn btn-primary" href="/app/partner/activate">Activate Partner Profile</a><a className="btn btn-secondary" href="/app/partner/resources">View Partner Guide</a></div>
          </Card>
        ) : null}

        {dashboard ? (
          <Card>
            <p className="eyebrow">Your Partner Referral</p>
            <div className="dashboard-grid">
              <div>
                <h3>{dashboard.partner.name}</h3>
                <p className="muted">Status: {dashboard.partner.status}. Your ID and referral code are permanent.</p>
              </div>
              <div className="list">
                <p>Partner ID: <strong>{dashboard.partner.partnerId}</strong></p>
                <p>Referral Code: <strong>{dashboard.partner.referralCode}</strong></p>
                <p>Referral Link:</p>
                <code>{dashboard.partner.referralUrl}</code>
              </div>
            </div>
            {copied ? <p className="form-message success">Copied ✓</p> : null}
            <div className="card-actions">
              <button className="btn btn-secondary" type="button" onClick={() => copy(dashboard.partner.referralUrl, 'link')}><Copy size={16} /> Copy Link</button>
              <button className="btn btn-secondary" type="button" onClick={() => copy(dashboard.partner.referralCode, 'code')}><Copy size={16} /> Copy Code</button>
              <button className="btn btn-primary" type="button" onClick={share}><Share2 size={16} /> Share</button>
              <a className="btn btn-secondary" href={`https://wa.me/?text=${encodeURIComponent(dashboard.partner.referralUrl)}`}>WhatsApp</a>
            </div>
          </Card>
        ) : null}

        <div className="metric-grid">
          <MetricCard icon={Users} label="Direct Sales" value={String(dashboard?.metrics.directQualifiedSales || 0)} note="Qualified paid sales." />
          <MetricCard icon={LineChart} label="L2 Sales" value={String(dashboard?.metrics.l2QualifiedSales || 0)} note="Maximum 10 monthly." />
          <MetricCard icon={LineChart} label="L3 Sales" value={String(dashboard?.metrics.l3QualifiedSales || 0)} note="Maximum 10 monthly." />
          <MetricCard icon={WalletCards} label="Estimated Earnings" value={formatNaira(dashboard?.metrics.estimatedEarnings || 0)} note="Updates after verified sales." />
          <MetricCard icon={HandCoins} label="Next Payout" value={dashboard?.metrics.nextPayout || '30th'} note="Cutoff rules apply." />
        </div>

        <div className="grid-2">
          <Card>
            <h3>Milestone Progress</h3>
            <p className="price">{dashboard?.metrics.directQualifiedSales || 0} / 10</p>
            <ProgressBar value={progress} />
            <p className="muted">{dashboard?.metrics.nextMilestone || '10 direct sales unlock NGN 3,000 bonus.'}</p>
          </Card>
          <Card>
            <h3>Partner Onboarding</h3>
            <ul className="checklist">
              <ChecklistItem done={Boolean(dashboard)}>Activate partner account</ChecklistItem>
              <ChecklistItem done={Boolean(dashboard?.partner.referralCode)}>Receive referral code</ChecklistItem>
              <ChecklistItem done={Boolean(dashboard?.partner.referralUrl)}>Copy referral link</ChecklistItem>
              <ChecklistItem>Add bank details</ChecklistItem>
              <ChecklistItem>Review partner guide</ChecklistItem>
            </ul>
          </Card>
        </div>

        <Card>
          <h3>Recent Referrals</h3>
          <DataTable headers={['Name', 'Programme', 'Track', 'Registration Date', 'Payment', 'Qualification', 'Commission']} rows={referralRows} />
        </Card>
      </div>
    </AppShell>
  )
}
