import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable } from '@/lib/admin-services'

export default async function AdminClassesPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN'])
  const classes = await adminSimpleTable('classes', '*, programmes(name)')
  return <AdminShell title="Classes"><div className="page-grid"><Card><h3>Class Scheduling</h3><p className="muted">Create, schedule, reschedule, publish, attach meeting links and add recordings for live classes.</p><div className="card-actions"><a className="btn btn-primary" href="/admin/classes/new">Create Class</a></div></Card><DataTable headers={['Class', 'Programme', 'Date', 'Trainer', 'Status']} emptyMessage="No classes scheduled yet." rows={classes.map((item: any) => [item.title, item.programmes?.name || '-', item.class_date || '-', item.trainer || '-', item.status])}/></div></AdminShell>
}
