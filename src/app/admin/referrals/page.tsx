import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminReferrals, formatNgn } from '@/lib/admin-services'

export default async function AdminReferralsPage() {
  await requireAdmin()
  const { events, commissions } = await adminReferrals()
  const clicks = events.filter((item: any) => item.event_type === 'LINK_CLICKED').length
  const registrations = events.filter((item: any) => ['REGISTRATION_COMPLETED', 'APPLICATION_STARTED', 'APPLICATION_COMPLETED'].includes(item.event_type)).length
  const paid = events.filter((item: any) => item.event_type === 'PAYMENT_SUCCEEDED').length
  const liability = commissions.reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  return (
    <AdminShell title="Referrals">
      <div className="page-grid">
        <div className="metric-grid"><MetricCard label="Referral Clicks" value={String(clicks)} note="Tracked link clicks" /><MetricCard label="Registrations" value={String(registrations)} note="Signup/application events" /><MetricCard label="Paid Enrolments" value={String(paid)} note="Payment succeeded events" /><MetricCard label="Commission Liability" value={formatNgn(liability)} note="Generated commission" /></div>
        <Card><h3>Referral Audit</h3><div className="card-actions"><a className="btn btn-primary" href="/admin/referrals/trace">Trace Referral</a></div></Card>
        <DataTable headers={['Referral Code', 'Partner', 'Event', 'Payment Reference', 'When']} emptyMessage="No referral events yet." rows={events.map((event: any) => [event.referral_code_text || '-', event.partners?.full_name || '-', event.event_type, event.payment_reference || '-', event.occurred_at ? new Date(event.occurred_at).toLocaleString() : '-'])} />
      </div>
    </AdminShell>
  )
}
