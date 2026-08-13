import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { formatNgn } from '@/lib/admin-services'

export default async function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const [{ data: partner }, { data: events }, { data: commissions }, { data: bank }] = await Promise.all([
    supabase.from('partners').select('*, referral_codes(code, referral_url)').eq('id', id).maybeSingle(),
    supabase.from('referral_events').select('*').eq('partner_id', id).order('occurred_at', { ascending: false }).limit(100),
    supabase.from('commissions').select('*').eq('partner_id', id).limit(100),
    supabase.from('partner_bank_accounts').select('*').eq('partner_id', id).order('created_at', { ascending: false }).limit(1),
  ])
  const paid = (commissions || []).filter((item: any) => item.status === 'PAID').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const pending = (commissions || []).filter((item: any) => item.status !== 'PAID').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  return (
    <AdminShell title="Partner Detail">
      <div className="page-grid">
        <Card><h3>{partner?.full_name || 'Partner'}</h3><p>{partner?.email}</p><p>Partner ID: <strong>{partner?.partner_id}</strong></p><p>Referral: <strong>{partner?.referral_codes?.[0]?.code || '-'}</strong></p><code>{partner?.referral_codes?.[0]?.referral_url || ''}</code></Card>
        <div className="metric-grid"><MetricCard label="Referral Events" value={String(events?.length || 0)} note="Clicks, registrations and payments" /><MetricCard label="Estimated Earnings" value={formatNgn(pending + paid)} note="Lifetime commission" /><MetricCard label="Approved/Pending" value={formatNgn(pending)} note="Pending payout liability" /><MetricCard label="Lifetime Paid" value={formatNgn(paid)} note="Paid commissions" /></div>
        <Card><h3>Bank Verification</h3><DataTable headers={['Bank', 'Account Name', 'Masked', 'Status']} emptyMessage="No bank account submitted." rows={(bank || []).map((item: any) => [item.bank_name, item.account_name, `******${item.account_number_last_four}`, item.verification_status])} /></Card>
        <Card><h3>Activity Timeline</h3><DataTable headers={['Event', 'Reference', 'When']} emptyMessage="No referral activity yet." rows={(events || []).map((item: any) => [item.event_type, item.payment_reference || item.referral_code_text || '-', item.occurred_at ? new Date(item.occurred_at).toLocaleString() : '-'])} /></Card>
      </div>
    </AdminShell>
  )
}
