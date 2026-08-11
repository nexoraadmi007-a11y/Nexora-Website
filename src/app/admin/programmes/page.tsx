import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { formatNaira, programmes } from '@/config/programmes'

export default function AdminProgrammesPage() {
  return (
    <AdminShell title="Programmes">
      <div className="page-grid">
        <Card><h3>Programme Management</h3><p className="muted">Create and review programmes, tracks, modules, projects, resources and publication status.</p><a className="btn btn-secondary" href="/admin/settings">Open programme settings</a></Card>
        <DataTable headers={['Programme', 'Price', 'Duration', 'Tracks', 'Status']} rows={programmes.map((programme) => [programme.name, formatNaira(programme.priceNgn), programme.duration, String(programme.tracks.length || 1), 'Published'])} />
      </div>
    </AdminShell>
  )
}
