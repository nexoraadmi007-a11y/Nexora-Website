import { GraduationCap, HandCoins, LineChart, Users, WalletCards } from 'lucide-react'
import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminOverview } from '@/lib/admin-services'

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ range?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const overview = await adminOverview(params?.range)
  return (
    <AdminShell title="Overview">
      <div className="page-grid">
        <Card>
          <div className="card-actions">
            {[
              ['today', 'Today'],
              ['7d', '7 Days'],
              ['30d', '30 Days'],
              ['this-month', 'This Month'],
              ['last-month', 'Last Month'],
              ['90d', '90 Days'],
              ['this-year', 'This Year'],
            ].map(([value, label]) => <a className="btn btn-secondary" key={value} href={`/admin?range=${value}`}>{label}</a>)}
          </div>
        </Card>
        <div className="metric-grid">
          {overview.metrics.map(([label, value, note], index) => {
            const icons = [Users, GraduationCap, Users, HandCoins, HandCoins, LineChart, WalletCards, GraduationCap]
            return <MetricCard key={label} icon={icons[index]} label={String(label)} value={String(value)} note={String(note)} />
          })}
        </div>
        <Card>
          <h3>Operational Queue</h3>
          <DataTable headers={['Area', 'Status', 'Open']} rows={overview.queues.map(([area, status, href]) => [String(area), String(status), String(href)])} />
        </Card>
      </div>
    </AdminShell>
  )
}
