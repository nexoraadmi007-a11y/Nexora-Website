import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminAnalytics } from '@/lib/admin-services'

export default async function AdminAnalyticsPage({ searchParams }: { searchParams?: Promise<{ range?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const analytics = await adminAnalytics(params?.range)
  return (
    <AdminShell title="Analytics">
      <div className="page-grid">
        <Card>
          <div className="card-actions">
            {['today', '7d', '30d', 'this-month', 'last-month', '90d', 'this-year'].map((range) => <a key={range} className="btn btn-secondary" href={`/admin/analytics?range=${range}`}>{range}</a>)}
          </div>
        </Card>
        <div className="metric-grid">
          <MetricCard label="Total Registrations" value={String(analytics.enrolment.totalRegistrations)} note="Profiles created" />
          <MetricCard label="Paid Enrolments" value={String(analytics.enrolment.paidEnrolments)} note="Paystack verified" />
          <MetricCard label="Payment Conversion" value={analytics.enrolment.paymentConversionRate} note="Paid / registered" />
          <MetricCard label="Gross Revenue" value={analytics.revenue.grossVerifiedRevenue} note="Verified revenue" />
          <MetricCard label="Commission Liability" value={analytics.revenue.partnerCommissionLiability} note="Unpaid partner commissions" />
          <MetricCard label="Net Revenue" value={analytics.revenue.netRecognisedRevenue} note="Gross less liability" />
        </div>
        <div className="grid-2">
          <Card><h3>Referral Funnel</h3><DataTable headers={['Stage', 'Count']} rows={[
            ['Referral Clicks', String(analytics.referrals.referralClicks)],
            ['Registrations', String(analytics.referrals.referralRegs)],
            ['Paid Enrolments', String(analytics.referrals.paidEnrolments)],
            ['Conversion', analytics.referrals.conversion],
          ]} /></Card>
          <Card><h3>Month-on-Month Growth</h3><DataTable headers={['Metric', 'Current', 'Trend']} rows={analytics.overview.metrics.map(([label, value, note]) => [String(label), String(value), String(note)])} /></Card>
        </div>
      </div>
    </AdminShell>
  )
}
