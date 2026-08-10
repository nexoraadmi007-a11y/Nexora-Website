import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function ProjectsPage() {
  return <AppShell title="Projects"><Card><EmptyState title="No project available yet.">Your first project becomes available after your programme module is assigned.</EmptyState></Card></AppShell>
}
