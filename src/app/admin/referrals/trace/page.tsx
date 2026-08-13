import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export default async function ReferralTracePage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const q = (params?.q || '').trim()
  const supabase = createSupabaseAdminClient()
  const events = q
    ? (await supabase.from('referral_events').select('*').or(`payment_reference.eq.${q},referral_code_text.eq.${q}`).order('occurred_at', { ascending: false }).limit(100)).data || []
    : []
  const partners = q
    ? (await supabase.from('partners').select('*, referral_codes(code)').or(`partner_id.eq.${q},email.eq.${q}`).limit(20)).data || []
    : []
  const payments = q
    ? (await supabase.from('payments').select('*').or(`paystack_reference.eq.${q}`).limit(20)).data || []
    : []
  return (
    <AdminShell title="Referral Trace">
      <div className="page-grid">
        <Card><h3>Trace Referral</h3><form className="card-actions"><input name="q" placeholder="Payment Reference, Email, Referral Code, Partner ID" defaultValue={q} /><button className="btn btn-primary" type="submit">Trace</button></form></Card>
        <Card><h3>Trace Result</h3><DataTable headers={['Step', 'Status']} rows={[['Referral Click', events.some((e: any) => e.event_type === 'LINK_CLICKED') ? 'Found' : 'Not found'], ['Referral Captured', events.length ? 'Found' : 'Not found'], ['Account Created', events.some((e: any) => e.event_type === 'REGISTRATION_COMPLETED') ? 'Found' : 'Not found'], ['Payment Initiated', payments.length ? 'Found' : 'Not found'], ['Payment Verified', payments.some((p: any) => p.status === 'PAID') ? 'Found' : 'Not found'], ['Commission Generated', events.some((e: any) => e.event_type === 'PAYMENT_SUCCEEDED') ? 'Found' : 'Not found']]} /></Card>
        <DataTable headers={['Event', 'Code', 'Reference', 'When']} emptyMessage={q ? 'No referral events found for this trace.' : 'Search to trace referral flow.'} rows={events.map((event: any) => [event.event_type, event.referral_code_text || '-', event.payment_reference || '-', event.occurred_at ? new Date(event.occurred_at).toLocaleString() : '-'])} />
        <DataTable headers={['Partner', 'Email', 'Partner ID', 'Code']} emptyMessage="No matching partner." rows={partners.map((partner: any) => [partner.full_name, partner.email, partner.partner_id, partner.referral_codes?.[0]?.code || '-'])} />
      </div>
    </AdminShell>
  )
}
