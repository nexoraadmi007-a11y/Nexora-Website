import { AdminShell } from '@/components/shell'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminCohorts } from '@/lib/admin-services'

export default async function AdminCohortsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN'])
  const cohorts = await adminCohorts()
  return <AdminShell title="Cohorts"><DataTable headers={['Cohort', 'Programme', 'Classes', 'Relevant Date', 'Status']} emptyMessage="No cohorts have been assigned to classes yet." rows={cohorts.map((item) => [item.cohort, item.programme, String(item.classes), item.nextDate, item.status])} /></AdminShell>
}
