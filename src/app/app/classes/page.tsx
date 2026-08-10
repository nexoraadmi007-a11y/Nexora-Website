import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function ClassesPage() {
  return <AppShell title="Live Classes"><Card><EmptyState title="No upcoming class yet.">Class schedules will include date, time, trainer, meeting link, resources and recording when available.</EmptyState></Card></AppShell>
}
