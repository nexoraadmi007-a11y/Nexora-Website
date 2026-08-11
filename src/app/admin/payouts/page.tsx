import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'

export default function AdminPayoutsPage() {
  return <AdminShell title="Payouts"><div className="page-grid"><div className="metric-grid"><MetricCard label="Pending Liability" value="NGN 0" note="Current cycle" /><MetricCard label="Approved" value="NGN 0" note="Ready for payout" /><MetricCard label="Held" value="NGN 0" note="Needs review" /><MetricCard label="Paid" value="NGN 0" note="This cycle" /><MetricCard label="Payout Date" value="30th" note="Cutoff: 27th" /></div><Card><DataTable headers={['Partner', 'Amount', 'Cycle', 'Status', 'Reference']} rows={[['No payout queued', 'NGN 0', '1 Aug - 27 Aug', 'Accumulating', '-']]}/></Card></div></AdminShell>
}
