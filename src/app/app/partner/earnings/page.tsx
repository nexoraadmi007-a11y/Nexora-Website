import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'

export default function PartnerEarningsPage() {
  return (
    <AppShell title="Earnings">
      <div className="page-grid">
        <div className="metric-grid">
          <MetricCard label="Estimated Earnings" value="NGN 0" note="From pending verified events." />
          <MetricCard label="Approved" value="NGN 0" note="Approved for next payout." />
          <MetricCard label="Pending" value="NGN 0" note="Awaiting verification." />
          <MetricCard label="Lifetime Paid" value="NGN 0" note="Total payout history." />
          <MetricCard label="Next Payout" value="30 Aug 2026" note="Cycle: 1 Aug - 27 Aug." />
        </div>
        <Card><h3>Wallet Ledger</h3><DataTable headers={['Date', 'Description', 'Source', 'Amount', 'Status']} rows={[['-', 'No ledger entry yet', '-', 'NGN 0', 'Pending activity']]} /></Card>
        <Card><h3>Payout History</h3><DataTable headers={['Period', 'Amount', 'Status', 'Payout Date', 'Reference']} rows={[['August 2026', 'NGN 0', 'Accumulating', '30 Aug 2026', '-']]} /></Card>
      </div>
    </AppShell>
  )
}
