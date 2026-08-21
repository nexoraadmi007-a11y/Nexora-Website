import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export default async function AdminClassesPage() {
  await requireAdmin()
  const { data: classes } = await createSupabaseAdminClient().from('classes')
    .select('id, name, title, cohort, trainer, starts_at, status, archived_at, programmes(name), programme_tracks(name), class_memberships(count)')
    .order('created_at', { ascending: false })
  return <AdminShell title="Classes"><div className="page-grid">
    <Card><h3>Class & Cohort Management</h3><p className="muted">Class membership controls access to sessions, assignments, projects, resources and recordings.</p><div className="card-actions"><a className="btn btn-primary" href="/admin/classes/new">Create Class</a></div></Card>
    <DataTable headers={['Class', 'Programme', 'Track', 'Cohort', 'Students', 'Start', 'Status', 'Action']} emptyMessage="No learning classes yet." rows={(classes || []).map((item: any) => [item.name || item.title, item.programmes?.name || '-', item.programme_tracks?.name || '-', item.cohort || '-', String(item.class_memberships?.[0]?.count || 0), item.starts_at || '-', item.archived_at ? 'Archived' : item.status, `/admin/classes/${item.id}`])} />
  </div></AdminShell>
}
