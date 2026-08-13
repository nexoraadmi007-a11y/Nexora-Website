import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable } from '@/lib/admin-services'

export default async function AdminOpportunitiesPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'TALENT_ADMIN'])
  const opportunities = await adminSimpleTable('opportunities', '*, programmes(name)')
  return <AdminShell title="Opportunities"><div className="page-grid"><Card><h3>Opportunity Publishing</h3><p className="muted">Publish verified roles, projects and freelance briefs for eligible learners and specific cohorts.</p><div className="card-actions"><a className="btn btn-primary" href="/admin/opportunities/new">Create Opportunity</a></div></Card><DataTable headers={['Opportunity', 'Type', 'Eligibility', 'Deadline', 'Status']} emptyMessage="No opportunities yet." rows={opportunities.map((item: any) => [item.title, item.opportunity_type || '-', item.programmes?.name || 'All eligible learners', item.deadline ? new Date(item.deadline).toLocaleDateString() : '-', item.status])}/></div></AdminShell>
}
