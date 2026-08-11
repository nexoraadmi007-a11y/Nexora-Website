import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function AdminOpportunitiesPage() {
  return <AdminShell title="Opportunities"><div className="page-grid"><Card><h3>Opportunity Publishing</h3><p className="muted">Publish verified roles, projects and freelance briefs for eligible learners.</p><button className="btn btn-primary" type="button">Create Opportunity</button></Card><DataTable headers={['Opportunity', 'Type', 'Eligibility', 'Status']} rows={[['No opportunity drafted', '-', '-', 'Draft queue empty']]}/></div></AdminShell>
}
