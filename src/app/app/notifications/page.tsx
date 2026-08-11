import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function NotificationsPage() {
  return (
    <AppShell title="Notifications">
      <div className="page-grid">
        <div className="tabs"><span>All</span><span>Learning</span><span>Classes</span><span>Projects</span><span>Partner</span><span>Payments</span><span>Opportunities</span></div>
        <Card>
          <h3>Latest Notifications</h3>
          <DataTable headers={['Category', 'Message', 'Status']} rows={[
            ['Account', 'Complete your profile to improve personalisation.', 'Open'],
            ['Programmes', 'AI Income Accelerator and Business Transformation are available.', 'New'],
            ['Partner', 'Partner activation is ready from your workspace.', 'Optional'],
          ]} />
        </Card>
      </div>
    </AppShell>
  )
}
