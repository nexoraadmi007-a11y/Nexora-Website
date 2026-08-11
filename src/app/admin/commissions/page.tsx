import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function AdminCommissionsPage() {
  return <AdminShell title="Commissions"><div className="page-grid"><Card><h3>Commission Rules</h3><p className="muted">L1: NGN 1,500 unlimited. L2: NGN 1,000 max 10/month. L3: NGN 500 max 10/month. Payout ceiling: 35%.</p></Card><DataTable headers={['Type', 'Amount', 'Limit', 'Status']} rows={[['Direct Commission', 'NGN 1,500', 'Unlimited', 'Active'], ['L2 Commission', 'NGN 1,000', '10 monthly', 'Active'], ['L3 Commission', 'NGN 500', '10 monthly', 'Active'], ['Milestone 10', 'NGN 3,000', 'Once per cycle', 'Active']]}/></div></AdminShell>
}
