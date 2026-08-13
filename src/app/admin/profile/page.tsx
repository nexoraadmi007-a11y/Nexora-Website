import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export default async function AdminProfilePage() {
  const admin = await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', admin.user.id).maybeSingle()
  const { data: role } = await supabase.from('admin_roles').select('*').eq('user_id', admin.user.id).eq('role', admin.role).maybeSingle()
  return (
    <AdminShell title="Admin Profile">
      <Card>
        <h3>{profile?.full_name || admin.user.email}</h3>
        <DataTable headers={['Field', 'Value']} rows={[
          ['Name', profile?.full_name || '-'],
          ['Email', admin.user.email || '-'],
          ['Role', admin.role],
          ['Phone', profile?.whatsapp || '-'],
          ['Avatar', 'Not uploaded'],
          ['Last Login', role?.last_login_at ? new Date(role.last_login_at).toLocaleString() : '-'],
          ['Account Status', role?.status || 'ACTIVE'],
        ]} />
      </Card>
    </AdminShell>
  )
}
