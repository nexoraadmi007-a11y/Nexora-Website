import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminClassesPage() {
  return <AdminShell title="Classes"><Card><EmptyState title="No class records connected.">Class creation will include programme, track, cohort, date, trainer, meeting link, resources and status.</EmptyState></Card></AdminShell>
}
