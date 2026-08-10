import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminUsersPage() {
  return <AdminShell title="Users"><Card><EmptyState title="User administration pending.">V2 user management will support roles, profile status and secure account controls.</EmptyState></Card></AdminShell>
}
