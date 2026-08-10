import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminPage() {
  return (
    <AdminShell title="Overview">
      <div className="grid-3">
        <Card><h3>Learners</h3><EmptyState title="Connect canonical data.">New enrolments, active learners and completion will appear after the V2 data model is connected.</EmptyState></Card>
        <Card><h3>Revenue</h3><EmptyState title="Payment analytics pending.">Recognised revenue, refunds and Paystack verification will come from server-side records.</EmptyState></Card>
        <Card><h3>Partners</h3><EmptyState title="Partner finance pending.">Qualified sales, payout liabilities and ceiling warnings will come from the commission engine.</EmptyState></Card>
      </div>
    </AdminShell>
  )
}
