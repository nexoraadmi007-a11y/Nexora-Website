import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminPayoutsPage() {
  return <AdminShell title="Payouts"><Card><EmptyState title="No payout cycle open.">Finance will review gross earnings, adjustments, bank verification, payout ratio and approval status here.</EmptyState></Card></AdminShell>
}
