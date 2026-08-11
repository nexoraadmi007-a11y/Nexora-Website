import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'

export default function PartnerReferralsPage() {
  return (
    <AppShell title="Referrals">
      <div className="page-grid">
        <div className="metric-grid">
          <MetricCard label="Clicks" value="0" note="This month" />
          <MetricCard label="Registrations" value="0" note="This month" />
          <MetricCard label="Paid Registrations" value="0" note="This month" />
          <MetricCard label="Qualified Sales" value="0" note="This month" />
          <MetricCard label="Conversion Rate" value="-" note="Available after traffic" />
        </div>
        <Card><h3>Referral Funnel</h3><p className="muted">Referral Clicks to Registrations to Paid Registrations to Qualified Sales</p></Card>
        <DataTable headers={['Name', 'Programme', 'Track', 'Registration Date', 'Payment', 'Qualification', 'Commission']} rows={[
          ['No referral yet', '-', '-', '-', '-', '-', '-'],
        ]} />
      </div>
    </AppShell>
  )
}
