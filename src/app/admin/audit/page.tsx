import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable } from '@/lib/admin-services'

export default async function AdminAuditPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN'])
  const logs = await adminSimpleTable('admin_audit_logs')
  return (
    <AdminShell title="Audit Log">
      <div className="page-grid">
        <Card><h3>Admin Audit Log</h3><p className="muted">Tracks sensitive admin actions, entity changes and session metadata where available.</p></Card>
        <DataTable headers={['Admin', 'Action', 'Entity', 'Entity ID', 'Timestamp']} emptyMessage="No admin audit entries yet." rows={logs.map((log: any) => [log.admin_email || log.admin_user_id || '-', log.action, log.entity, log.entity_id || '-', log.created_at ? new Date(log.created_at).toLocaleString() : '-'])} />
      </div>
    </AdminShell>
  )
}
