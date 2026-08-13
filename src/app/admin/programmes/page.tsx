import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminProgrammes, formatNgn } from '@/lib/admin-services'

export default async function AdminProgrammesPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN'])
  const programmes = await adminProgrammes()
  return (
    <AdminShell title="Programmes">
      <div className="page-grid">
        <Card><h3>Programme Management</h3><p className="muted">Create, edit, archive and publish course records from the canonical Supabase programme table.</p><div className="card-actions"><a className="btn btn-primary" href="/admin/programmes/new">Create Programme</a><a className="btn btn-secondary" href="/admin/settings#programme">Programme Settings</a></div></Card>
        <DataTable headers={['Programme', 'Code', 'Type', 'Price', 'Duration', 'Registration', 'Status', 'Action']} emptyMessage="No programmes yet." rows={programmes.map((programme: any) => [programme.name, programme.programme_code, programme.programme_type || programme.family, formatNgn(programme.price_ngn), programme.duration || '-', programme.registration_open ? 'Open' : 'Closed', programme.status || (programme.active ? 'Published' : 'Inactive'), `/admin/programmes/${programme.id}`])} />
      </div>
    </AdminShell>
  )
}
