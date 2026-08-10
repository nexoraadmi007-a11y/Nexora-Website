import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function PortfolioPage() {
  return <AppShell title="Portfolio"><Card><EmptyState title="Portfolio starts with completed projects.">Verified skills, case studies and public links will appear here after project review.</EmptyState></Card></AppShell>
}
