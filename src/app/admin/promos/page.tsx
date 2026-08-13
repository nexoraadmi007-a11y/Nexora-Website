import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable, formatNgn } from '@/lib/admin-services'

export default async function AdminPromosPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN'])
  const promos = await adminSimpleTable('promo_codes')
  return (
    <AdminShell title="Promo Codes">
      <div className="page-grid">
        <Card>
          <h3>Promo Management</h3>
          <p className="muted">Create, activate, deactivate and review promo-code usage. Payable price is always calculated server-side before payment.</p>
          <div className="card-actions"><a className="btn btn-primary" href="/admin/promos/new">Create Promo</a><a className="btn btn-secondary" href="/admin/settings#promos">Manage promo settings</a></div>
        </Card>
        <DataTable headers={['Code', 'Campaign', 'Discount', 'Programme', 'Usage Limit', 'Status']} emptyMessage="No promo codes yet." rows={promos.map((promo: any) => [promo.code, promo.campaign_name, promo.discount_type === 'PERCENTAGE' ? `${promo.discount_amount}%` : formatNgn(promo.discount_amount), (promo.eligible_programmes || []).join(', ') || 'All eligible', String(promo.usage_limit || '-'), promo.status])} />
      </div>
    </AdminShell>
  )
}
