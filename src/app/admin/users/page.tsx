import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function AdminUsersPage() {
  return <AdminShell title="Users"><div className="page-grid"><Card><h3>User Administration</h3><p className="muted">Manage learners, business users, partners and admin roles from one queue.</p></Card><DataTable headers={['Name', 'Role', 'Programme', 'Status', 'Action']} rows={[['No user selected', '-', '-', 'Awaiting records', 'Review']]}/></div></AdminShell>
}
