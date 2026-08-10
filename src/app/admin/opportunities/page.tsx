import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminOpportunitiesPage() {
  return <AdminShell title="Opportunities"><Card><EmptyState title="Opportunity publishing pending.">Only real opportunities should be created and published from this system.</EmptyState></Card></AdminShell>
}
