import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function AdminPartnersPage() {
  return <AdminShell title="Partners"><div className="page-grid"><Card><h3>Partner Management</h3><p className="muted">Review partner activation, referral codes, bank verification and activity status.</p></Card><DataTable headers={['Partner', 'Referral Code', 'Qualified Sales', 'Bank Status', 'Status']} rows={[['No partner selected', '-', '0', 'Not submitted', 'Pending activation']]}/></div></AdminShell>
}
