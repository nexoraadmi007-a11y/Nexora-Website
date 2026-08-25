import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable, formatNgn } from '@/lib/admin-services'

export default async function AdminCommissionsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])
  const rules = await adminSimpleTable('admin_settings', 'key,value,updated_at')
  const commissions = await adminSimpleTable('commissions', 'amount_ngn, status, level, qualification_event, created_at, approved_at, paid_at, partners(full_name, partner_id)')
  const pending = commissions.filter((item: any) => item.status === 'PENDING').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const paid = commissions.filter((item: any) => item.status === 'PAID').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const approved = commissions.filter((item:any)=>item.status==='APPROVED').reduce((s:number,x:any)=>s+Number(x.amount_ngn||0),0)
  const generated = commissions.filter((item:any)=>item.status!=='REVERSED').reduce((s:number,x:any)=>s+Number(x.amount_ngn||0),0)
  const config:any=(rules as any[]).find((x:any)=>x.key==='growth_referral_rules')?.value||{}
  return <AdminShell title="Commissions"><div className="page-grid"><div className="metric-grid"><MetricCard label="Generated" value={formatNgn(generated)} note="Authoritative ledger" /><MetricCard label="Pending" value={formatNgn(pending)} note="Awaiting approval" /><MetricCard label="Approved" value={formatNgn(approved)} note="Ready for payout" /><MetricCard label="Paid" value={formatNgn(paid)} note="Completed payouts" /></div><Card><h3>Current rules</h3><p>Monthly target: <strong>{config.monthly_target||30}</strong> · Level 1: <strong>{formatNgn(config.l1_amount_ngn||1500)}</strong> per direct referral after target · Level 2: <strong>{formatNgn(config.l2_amount_ngn||500)}</strong></p></Card><Card><h3>Commission ledger</h3><DataTable headers={['Partner','Level','Event','Amount','Status','Created']} emptyMessage="No commissions yet." rows={commissions.map((item:any)=>[item.partners?.full_name||'-',`L${item.level}`,item.qualification_event||'PAID_ENROLLMENT',formatNgn(item.amount_ngn),item.status,item.created_at?new Date(item.created_at).toLocaleDateString():'-'])}/></Card></div></AdminShell>
}
