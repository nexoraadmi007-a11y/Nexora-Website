import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AppOpportunitiesPage() {
  return <AppShell title="Opportunities"><Card><EmptyState title="No open opportunities yet.">Only real internships, projects and roles should be published here. No fake production opportunities.</EmptyState></Card></AppShell>
}
