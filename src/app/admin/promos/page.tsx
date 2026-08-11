import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function AdminPromosPage() {
  return (
    <AdminShell title="Promo Codes">
      <div className="page-grid">
        <Card>
          <h3>Promo Management</h3>
          <p className="muted">Create, activate, deactivate and review promo-code usage. Payable price is always calculated server-side before payment.</p>
          <a className="btn btn-secondary" href="/admin/settings">Manage promo settings</a>
        </Card>
        <DataTable headers={['Code', 'Discount', 'Programme', 'Redemptions', 'Revenue', 'Status']} rows={[
          ['WEBINAR50', '50%', 'Eligible programmes', 'Preview', 'Preview', 'Active'],
        ]} />
      </div>
    </AdminShell>
  )
}
