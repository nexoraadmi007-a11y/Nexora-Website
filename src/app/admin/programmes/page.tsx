import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { formatNaira, programmes } from '@/config/programmes'

export default function AdminProgrammesPage() {
  return <AdminShell title="Programmes">{programmes.map((programme) => <Card key={programme.code}><h3>{programme.name}</h3><p className="price">{formatNaira(programme.priceNgn)}</p><p className="muted">Admin editing will be connected to the canonical database in the next backend phase.</p></Card>)}</AdminShell>
}
