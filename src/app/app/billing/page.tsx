import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function BillingPage() {
  return (
    <AppShell title="Billing">
      <div className="page-grid">
        <Card><h3>Programme Purchases</h3><p className="muted">Payment history and receipts will appear after verified purchases.</p></Card>
        <DataTable headers={['Programme', 'Status', 'Amount', 'Date', 'Receipt']} rows={[
          ['No purchase yet', 'Pending enrolment', '-', '-', 'Not available'],
        ]} />
      </div>
    </AppShell>
  )
}
