import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminPartners } from '@/lib/admin-services'

export default async function AdminPartnersPage({ searchParams }: { searchParams?: Promise<{ q?: string; filter?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const partners = await adminPartners(params?.q)
  const active = partners.filter((item: any) => item.status === 'ACTIVE')
  const bankVerified = partners.filter((item: any) => item.partner_bank_accounts?.[0]?.verification_status === 'VERIFIED')
  return (
    <AdminShell title="Partners">
      <div className="page-grid">
        <div className="metric-grid">
          <MetricCard label="Total Partners" value={String(partners.length)} note="All partner records" />
          <MetricCard label="Active Partners" value={String(active.length)} note="Status ACTIVE" />
          <MetricCard label="Bank Verified" value={String(bankVerified.length)} note="Paystack verified" />
          <MetricCard label="Without Sales" value={String(partners.length)} note="Pending sales activity" />
        </div>
        <Card>
          <h3>Partner Management</h3>
          <form className="card-actions"><input name="q" placeholder="Search name, email, phone, partner ID, referral code" defaultValue={params?.q || ''} /><button className="btn btn-primary" type="submit">Search</button></form>
        </Card>
        <DataTable headers={['Partner', 'Email', 'Partner ID', 'Referral Code', 'Bank Status', 'Status', 'Action']} emptyMessage="No partners yet. Activated Nexora Partners will appear here." rows={partners.map((partner: any) => [partner.full_name, partner.email, partner.partner_id, partner.referral_codes?.[0]?.code || '-', partner.partner_bank_accounts?.[0]?.verification_status || 'Not submitted', partner.status, `/admin/partners/${partner.id}`])} />
      </div>
    </AdminShell>
  )
}
