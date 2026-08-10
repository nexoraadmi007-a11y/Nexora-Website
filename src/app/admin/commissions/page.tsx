import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminCommissionsPage() {
  return <AdminShell title="Commissions"><Card><EmptyState title="Commission engine pending.">L1, L2 cap, L3 cap, milestones and 35% ceiling will be calculated server-side.</EmptyState></Card></AdminShell>
}
