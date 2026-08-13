import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSettings } from '@/lib/admin-services'

export default async function AdminSettingsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN'])
  const settings = await adminSettings()
  return (
    <AdminShell title="Settings">
      <div className="page-grid">
        <div className="grid-2">
          {['General', 'Programme Configuration', 'Commission & Partner Rules', 'Payout Rules', 'Integrations', 'Notifications', 'Feature Flags', 'Access & Permissions', 'Security'].map((section) => <Card key={section}><h3 id={section.toLowerCase().replace(/[^a-z]+/g, '-')}>{section}</h3><p className="muted">Persistent settings category for {section.toLowerCase()}.</p><span className="status-pill success">Connected to admin_settings</span></Card>)}
        </div>
        <DataTable headers={['Key', 'Category', 'Value', 'Updated']} emptyMessage="No settings yet." rows={settings.map((item: any) => [item.key, item.category, JSON.stringify(item.value), item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'])} />
      </div>
    </AdminShell>
  )
}
