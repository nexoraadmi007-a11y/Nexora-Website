import { GraduationCap, HandCoins, LineChart, Users, WalletCards } from 'lucide-react'
import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'

export default function AdminPage() {
  return (
    <AdminShell title="Overview">
      <div className="page-grid">
        <div className="metric-grid">
          <MetricCard icon={Users} label="Total Learners" value="-" note="Connect enrolment records." />
          <MetricCard icon={GraduationCap} label="Active Learners" value="-" note="Based on active programmes." />
          <MetricCard icon={LineChart} label="Programme Revenue" value="NGN 0" note="Verified payments only." />
          <MetricCard icon={HandCoins} label="Partners" value="-" note="Activated partner profiles." />
          <MetricCard icon={WalletCards} label="Pending Payouts" value="NGN 0" note="Finance review queue." />
        </div>
        <Card>
          <h3>Operational Queue</h3>
          <DataTable headers={['Area', 'What admins manage', 'Next Action']} rows={[
            ['Programmes', 'Prices, tracks, modules, projects and resources', 'Review catalogue'],
            ['Classes', 'Cohorts, schedules, trainers and recordings', 'Create first schedule'],
            ['Partners', 'Activation, referrals, bank details and status', 'Review applications'],
            ['Payouts', 'Commission liability, approvals and payment cycles', 'Open payout register'],
          ]} />
        </Card>
      </div>
    </AdminShell>
  )
}
