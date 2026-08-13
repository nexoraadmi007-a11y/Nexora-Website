import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable } from '@/lib/admin-services'

export default async function AdminProjectsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN'])
  const projects = await adminSimpleTable('projects', '*, programmes(name)')
  const submissions = await adminSimpleTable('project_submissions', 'status, score, submitted_at, projects(title)')
  return (
    <AdminShell title="Projects">
      <div className="page-grid">
        <Card><h3>Project Management</h3><p className="muted">Create learning projects, publish briefs, set deadlines and review learner submissions.</p><div className="card-actions"><a className="btn btn-primary" href="/admin/projects/new">Create Project</a></div></Card>
        <DataTable headers={['Project', 'Programme', 'Cohort', 'Deadline', 'Status']} emptyMessage="No learning projects yet." rows={projects.map((item: any) => [item.title, item.programmes?.name || '-', item.cohort || '-', item.deadline ? new Date(item.deadline).toLocaleDateString() : '-', item.status])} />
        <Card><h3>Project Submissions</h3><DataTable headers={['Project', 'Submitted', 'Status', 'Score']} emptyMessage="No submissions yet." rows={submissions.map((item: any) => [item.projects?.title || '-', item.submitted_at ? new Date(item.submitted_at).toLocaleString() : '-', item.status, String(item.score || '-')])} /></Card>
      </div>
    </AdminShell>
  )
}
