import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function PartnerEarningsPage() {
  return <AppShell title="Partner Earnings"><Card><EmptyState title="No ledger entries yet.">L1, L2, L3, milestone bonuses, adjustments and payouts will be shown only from canonical verified events.</EmptyState></Card></AppShell>
}
