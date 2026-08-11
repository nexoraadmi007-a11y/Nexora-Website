import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function ClassesPage() {
  return (
    <AppShell title="Live Classes">
      <div className="page-grid">
        <div className="tabs"><span>Upcoming</span><span>Past Classes</span><span>Agenda</span><span>Month</span></div>
        <Card>
          <p className="eyebrow">Upcoming</p>
          <h3>No class scheduled yet.</h3>
          <p className="muted">Your programme manager will publish the next class here after your cohort and track are confirmed.</p>
          <div className="card-actions"><a className="btn btn-secondary" href="/app/programmes">View Programmes</a><a className="btn btn-ghost" href="/app/resources">Browse Resources</a></div>
        </Card>
        <Card>
          <h3>Class Agenda</h3>
          <DataTable headers={['Session', 'Programme', 'Date', 'Trainer', 'Status']} rows={[
            ['Orientation', 'All learners', 'To be announced', 'Programme Team', 'Pending'],
            ['Foundations Lab', 'AI Income Accelerator', 'To be announced', 'Trainer assigned after cohort', 'Pending'],
          ]} />
        </Card>
      </div>
    </AppShell>
  )
}
