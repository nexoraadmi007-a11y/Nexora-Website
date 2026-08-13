import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable, formatNgn } from '@/lib/admin-services'

export default async function AdminCommissionsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])
  const rules = await adminSimpleTable('commission_rule_versions')
  const commissions = await adminSimpleTable('commissions', 'amount_ngn, status, created_at, partners(full_name, partner_id)')
  const pending = commissions.filter((item: any) => item.status === 'PENDING').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const paid = commissions.filter((item: any) => item.status === 'PAID').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  return <AdminShell title="Commissions"><div className="page-grid"><div className="metric-grid"><MetricCard label="Pending Liability" value={formatNgn(pending)} note="Unpaid commissions" /><MetricCard label="Lifetime Paid" value={formatNgn(paid)} note="Paid commissions" /><MetricCard label="Rule Versions" value={String(rules.length)} note="Historical rules preserved" /></div><Card><h3>Commission Rules</h3><div className="card-actions"><a className="btn btn-primary" href="/admin/commissions/settings">Edit Rules</a></div></Card><DataTable headers={['Version', 'Effective', 'L1', 'L2', 'L3', 'Payout Ceiling']} rows={rules.map((rule: any) => [String(rule.version), rule.effective_from, `${rule.l1_percent}%`, `${rule.l2_percent}%`, `${rule.l3_percent}%`, `${rule.payout_ceiling_percent}%`])}/><Card><h3>Recent Commissions</h3><DataTable headers={['Partner', 'Amount', 'Status', 'Created']} emptyMessage="No commissions yet." rows={commissions.map((item: any) => [item.partners?.full_name || '-', formatNgn(item.amount_ngn), item.status, item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'])} /></Card></div></AdminShell>
}
