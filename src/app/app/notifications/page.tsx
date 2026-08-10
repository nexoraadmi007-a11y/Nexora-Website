import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function NotificationsPage() {
  return <AppShell title="Notifications"><Card><EmptyState title="No notifications.">Class reminders, assignment updates, payment confirmations and opportunity alerts will appear here.</EmptyState></Card></AppShell>
}
