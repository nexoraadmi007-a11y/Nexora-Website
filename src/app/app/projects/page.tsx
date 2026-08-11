import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function ProjectsPage() {
  return (
    <AppShell title="Projects">
      <div className="page-grid">
        <div className="tabs"><span>Active</span><span>Submitted</span><span>Completed</span></div>
        <Card>
          <h3>Your projects will become part of your professional portfolio.</h3>
          <p className="muted">Join a programme to start building real proof of work. Your first project unlocks after the foundation module.</p>
          <a className="btn btn-primary" href="/app/programmes">Explore Programmes</a>
        </Card>
        <Card>
          <h3>Portfolio Output Examples</h3>
          <DataTable headers={['Track', 'Project', 'Portfolio Output']} rows={[
            ['AI Content & Digital Marketing', 'Campaign plan', 'Content calendar and campaign case study'],
            ['AI UI/UX & Digital Design', 'Landing page design', 'Figma prototype and UX rationale'],
            ['AI Financial & Business Analysis', 'SME dashboard', 'Insight report and spreadsheet model'],
            ['AI Automation & No-Code', 'Simple CRM', 'Workflow map and Airtable system'],
          ]} />
        </Card>
      </div>
    </AppShell>
  )
}
