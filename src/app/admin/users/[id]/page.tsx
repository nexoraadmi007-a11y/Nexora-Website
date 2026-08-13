import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { formatNgn } from '@/lib/admin-services'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createSupabaseAdminClient()
  const [{ data: profile }, { data: enrolments }, { data: payments }, { data: partner }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('enrolments').select('status, created_at, programmes(name), programme_tracks(name)').eq('user_id', id).limit(50),
    supabase.from('payments').select('status, amount_ngn, paystack_reference, created_at').eq('user_id', id).limit(50),
    supabase.from('partners').select('*, referral_codes(code, referral_url)').eq('user_id', id).maybeSingle(),
  ])
  return (
    <AdminShell title="User Detail">
      <div className="page-grid">
        <Card><h3>{profile?.full_name || 'User'}</h3><p className="muted">{profile?.email || id}</p><p>Role: <strong>{profile?.role || 'learner'}</strong></p><p>Phone: {profile?.whatsapp || '-'}</p><p>Country: {profile?.country || '-'}</p></Card>
        <div className="grid-2">
          <Card><h3>Programme</h3><DataTable headers={['Programme', 'Track', 'Payment/Learning', 'Joined']} emptyMessage="No enrolments yet." rows={(enrolments || []).map((item: any) => [item.programmes?.name || '-', item.programme_tracks?.name || '-', item.status || '-', item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'])} /></Card>
          <Card><h3>Payments</h3><DataTable headers={['Reference', 'Amount', 'Status', 'Date']} emptyMessage="No payments yet." rows={(payments || []).map((item: any) => [item.paystack_reference || '-', formatNgn(item.amount_ngn), item.status || '-', item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'])} /></Card>
        </div>
        {partner ? <Card><h3>Partner</h3><DataTable headers={['Partner ID', 'Referral Code', 'Status', 'Joined']} rows={[[partner.partner_id, partner.referral_codes?.[0]?.code || '-', partner.status, partner.created_at ? new Date(partner.created_at).toLocaleDateString() : '-']]} /></Card> : null}
        <Card><h3>Activity Timeline</h3><DataTable headers={['Event', 'Status']} rows={[['Registered', profile?.created_at ? new Date(profile.created_at).toLocaleString() : '-'], ['Payments', String(payments?.length || 0)], ['Enrolments', String(enrolments?.length || 0)], ['Partner Activated', partner ? 'Yes' : 'No']]} /></Card>
      </div>
    </AdminShell>
  )
}
