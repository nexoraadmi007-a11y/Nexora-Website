import { AdminShell } from '@/components/shell'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminTracks } from '@/lib/admin-services'

export default async function AdminTracksPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN'])
  const tracks = await adminTracks()
  return <AdminShell title="Tracks"><DataTable headers={['Track', 'Code', 'Programme', 'Status']} emptyMessage="No programme tracks configured." rows={tracks.map((track: any) => [track.name, track.track_code, track.programmes?.name || '-', track.active ? 'Active' : 'Inactive'])} /></AdminShell>
}
