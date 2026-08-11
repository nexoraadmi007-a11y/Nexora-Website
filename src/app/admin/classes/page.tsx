import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function AdminClassesPage() {
  return <AdminShell title="Classes"><div className="page-grid"><Card><h3>Class Scheduling</h3><p className="muted">Create class sessions with programme, track, cohort, trainer, date, meeting link, resources and recording.</p><a className="btn btn-secondary" href="/admin/settings">Open class settings</a></Card><DataTable headers={['Class', 'Programme', 'Date', 'Trainer', 'Status']} rows={[['Orientation', 'All programmes', 'To be scheduled', 'Programme Team', 'Draft']]}/></div></AdminShell>
}
