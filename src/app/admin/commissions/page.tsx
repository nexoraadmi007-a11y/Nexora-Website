import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function AdminCommissionsPage() {
  return <AdminShell title="Commissions"><div className="page-grid"><Card><h3>Commission Rules</h3><p className="muted">L1: 15%. L2: 10% max 10/month. L3: 5% max 10/month. Commission is calculated on actual verified amount paid after promo discounts. Payout ceiling: 35%.</p></Card><DataTable headers={['Type', 'Rate', 'Limit', 'Status']} rows={[['Direct Commission', '15%', 'Unlimited', 'Active'], ['L2 Commission', '10%', '10 monthly', 'Active'], ['L3 Commission', '5%', '10 monthly', 'Active'], ['Milestone 10', 'NGN 3,000', 'Once per cycle', 'Active']]}/></div></AdminShell>
}
