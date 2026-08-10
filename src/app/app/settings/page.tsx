import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function SettingsPage() {
  return <AppShell title="Settings"><Card><EmptyState title="Account settings pending.">Security, password, notification, privacy and connected-account controls will be connected to V2 auth.</EmptyState></Card></AppShell>
}
