import { AdminShell } from '@/components/shell'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminEnrolments } from '@/lib/admin-services'

export default async function AdminEnrollmentsPage() {
  await requireAdmin()
  const enrolments = await adminEnrolments()
  return <AdminShell title="Enrollments"><DataTable headers={['Student', 'Programme', 'Track', 'Enrollment', 'Payment', 'Payment Date', 'Reference']} emptyMessage="No enrollments yet." rows={enrolments.map((item: any) => {
    const payment = item.payments?.[0]
    return [item.profiles?.full_name || item.profiles?.email || '-', item.programmes?.name || '-', item.programme_tracks?.name || '-', item.status, payment?.status || 'No payment', payment?.paid_at ? new Date(payment.paid_at).toLocaleDateString() : '-', payment?.paystack_reference || '-']
  })} /></AdminShell>
}
