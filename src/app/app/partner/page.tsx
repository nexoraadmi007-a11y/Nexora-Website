'use client'

import { useState } from 'react'
import { HandCoins, LineChart, Users, WalletCards } from 'lucide-react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { ChecklistItem, DataTable, MetricCard, ProgressBar } from '@/components/product'

export default function PartnerPage() {
  const [copied, setCopied] = useState(false)
  const referralLink = 'https://www.nexoragroup.ink/signup?ref=YOUR-CODE'
  function copyLink() {
    navigator.clipboard?.writeText(referralLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <AppShell title="Partner Overview">
      <div className="page-grid">
        <div className="dashboard-grid">
          <Card>
            <p className="eyebrow">Become a Nexora Partner</p>
            <h3>Help more people discover practical skills and receive verified commissions when your referrals successfully enrol.</h3>
            <div className="card-actions"><a className="btn btn-primary" href="/app/partner/activate">Activate Partner Profile</a><a className="btn btn-secondary" href="/app/partner/resources">View Partner Guide</a></div>
          </Card>
          <Card>
            <h3>Partner Onboarding</h3>
            <ul className="checklist">
              <ChecklistItem>Activate partner account</ChecklistItem>
              <ChecklistItem>Accept partner terms</ChecklistItem>
              <ChecklistItem>Add bank details</ChecklistItem>
              <ChecklistItem>Copy referral link</ChecklistItem>
              <ChecklistItem>Review partner guide</ChecklistItem>
            </ul>
          </Card>
        </div>
        <div className="metric-grid">
          <MetricCard icon={Users} label="Direct Sales" value="0" note="Qualified paid sales." />
          <MetricCard icon={LineChart} label="L2 Sales" value="0" note="Maximum 10 monthly." />
          <MetricCard icon={LineChart} label="L3 Sales" value="0" note="Maximum 10 monthly." />
          <MetricCard icon={WalletCards} label="Estimated Earnings" value="NGN 0" note="Updates after verified sales." />
          <MetricCard icon={HandCoins} label="Next Payout" value="30 Aug" note="Cutoff: 27 Aug." />
        </div>
        <div className="grid-2">
          <Card>
            <h3>Your Referral Link</h3>
            <p className="muted">Activate your profile to generate a stable referral code and link.</p>
            <code>{referralLink}</code>
            {copied ? <p className="form-message success">Referral link copied.</p> : null}
            <div className="card-actions"><button className="btn btn-secondary" type="button" onClick={copyLink}>Copy</button><a className="btn btn-secondary" href={`https://wa.me/?text=${encodeURIComponent(referralLink)}`}>Share</a></div>
          </Card>
          <Card>
            <h3>Milestone Progress</h3>
            <p className="price">0 / 10</p>
            <ProgressBar value={0} />
            <p className="muted">10 direct sales unlock NGN 3,000 bonus. 20 unlocks +NGN 7,000. 50 unlocks +NGN 15,000.</p>
          </Card>
        </div>
        <Card>
          <h3>Commission Breakdown</h3>
          <DataTable headers={['Level', 'Rate', 'Rule']} rows={[
            ['L1', '15%', 'Per qualified direct sale, unlimited'],
            ['L2', '10%', 'Maximum 10 qualified sales monthly'],
            ['L3', '5%', 'Maximum 10 qualified sales monthly'],
            ['Payout ceiling', '35%', 'Finance review applies before payout'],
          ]} />
        </Card>
      </div>
    </AppShell>
  )
}
