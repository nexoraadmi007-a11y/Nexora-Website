import { AdminShell } from '@/components/shell'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminPayments, formatNgn } from '@/lib/admin-services'

export default async function AdminPaymentsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])
  const payments = await adminPayments()
  return <AdminShell title="Payments"><DataTable headers={['Customer', 'Programme', 'Track', 'Amount', 'Status', 'Reference', 'Payment Date']} emptyMessage="No payments yet." rows={payments.map((item: any) => [item.profiles?.full_name || item.profiles?.email || '-', item.programmes?.name || '-', item.enrolments?.programme_tracks?.name || '-', formatNgn(item.amount_ngn), item.status, item.paystack_reference, item.paid_at ? new Date(item.paid_at).toLocaleDateString() : '-'])} /></AdminShell>
}
