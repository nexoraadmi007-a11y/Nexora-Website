import { AdminShell } from '@/components/shell'
import { DataTable } from '@/components/product'
import { Card } from '@/components/ui'
import { requireAdmin } from '@/lib/admin-auth'
import { adminTracks } from '@/lib/admin-services'

export default async function AdminTracksPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN'])
  const tracks = await adminTracks()
  return <AdminShell title="Tracks"><div className="page-grid"><Card><h3>Programme Tracks</h3><a className="btn btn-primary" href="/admin/tracks/new">Create Track</a></Card><DataTable headers={['Track', 'Code', 'Programme', 'Status', 'Action']} emptyMessage="No programme tracks configured." rows={tracks.map((track: any) => [track.name, track.track_code, track.programmes?.name || '-', track.active ? 'Active' : 'Inactive', `/admin/tracks/${track.id}`])} /></div></AdminShell>
}
