import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable, formatNgn } from '@/lib/admin-services'

function nextPayoutDate() {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), 30, 12, 0, 0)
  if (next < now) next.setMonth(next.getMonth() + 1)
  return next
}

export default async function AdminPayoutsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])
  const [commissions, payouts] = await Promise.all([
    adminSimpleTable('commissions', 'amount_ngn, status, partners(full_name, partner_id)'),
    adminSimpleTable('payout_requests', '*, partners(full_name, partner_id), partner_bank_accounts(bank_name, account_name, account_number_last_four)'),
  ])
  const pending = commissions.filter((item: any) => item.status === 'PENDING').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const approved = payouts.filter((item: any) => item.status === 'APPROVED').reduce((sum: number, item: any) => sum + Number(item.approved_amount_ngn || 0), 0)
  const held = payouts.filter((item: any) => item.status === 'HELD').reduce((sum: number, item: any) => sum + Number(item.requested_amount_ngn || 0), 0)
  const paid = payouts.filter((item: any) => item.status === 'PAID').reduce((sum: number, item: any) => sum + Number(item.approved_amount_ngn || 0), 0)
  const next = nextPayoutDate()
  return <AdminShell title="Payouts"><div className="page-grid"><div className="metric-grid"><MetricCard label="Pending Liability" value={formatNgn(pending)} note="Current cycle" /><MetricCard label="Approved" value={formatNgn(approved)} note="Ready for payout" /><MetricCard label="Held" value={formatNgn(held)} note="Needs review" /><MetricCard label="Paid" value={formatNgn(paid)} note="This cycle" /><MetricCard label="Next Payout" value={next.toLocaleDateString()} note="30th monthly payout cycle" /></div><Card><div className="card-actions"><a className="btn btn-secondary" href="/api/admin/export/payouts.csv">Export CSV</a><a className="btn btn-secondary" href="/admin/payouts?print=1">Print View</a></div><DataTable headers={['Partner', 'Partner ID', 'Requested', 'Approved', 'Status', 'Reference']} emptyMessage="No payout requests yet." rows={payouts.map((item: any) => [item.partners?.full_name || '-', item.partners?.partner_id || '-', formatNgn(item.requested_amount_ngn), formatNgn(item.approved_amount_ngn), item.status, item.reference])}/></Card></div></AdminShell>
}
