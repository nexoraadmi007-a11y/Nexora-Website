import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminSettingsPage() {
  return <AdminShell title="Settings"><Card><EmptyState title="System settings pending.">Feature flags, integrations, programme sources and access policies will be managed here.</EmptyState></Card></AdminShell>
}
