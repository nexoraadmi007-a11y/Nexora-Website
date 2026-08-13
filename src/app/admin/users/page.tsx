import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminUsers } from '@/lib/admin-services'

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<{ q?: string; role?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const users = (await adminUsers(params?.q)).filter((user: any) => !params?.role || user.role === params.role)
  return (
    <AdminShell title="Users">
      <div className="page-grid">
        <Card>
          <h3>User Administration</h3>
          <form className="card-actions">
            <input name="q" placeholder="Search name, email or phone" defaultValue={params?.q || ''} />
            <select name="role" defaultValue={params?.role || ''}><option value="">All roles</option><option value="learner">Learner</option><option value="partner">Partner</option><option value="admin">Admin</option></select>
            <button className="btn btn-primary" type="submit">Search</button>
          </form>
        </Card>
        <DataTable
          headers={['Name', 'Email', 'Phone', 'Role', 'Joined', 'Status', 'Action']}
          emptyMessage="No users match this search."
          rows={users.map((user: any) => [
            user.full_name || 'Unnamed user',
            user.email || '-',
            user.whatsapp || '-',
            user.role || 'learner',
            user.created_at ? new Date(user.created_at).toLocaleDateString() : '-',
            'Active',
            `/admin/users/${user.id}`,
          ])}
        />
      </div>
    </AdminShell>
  )
}
