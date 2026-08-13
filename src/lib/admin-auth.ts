import { redirect } from 'next/navigation'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'
import { createSupabaseServerClient, hasSupabaseServerConfig } from '@/lib/supabase/server'

export const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN', 'FINANCE_ADMIN', 'TALENT_ADMIN', 'SUPPORT_ADMIN'] as const
export type AdminRole = typeof adminRoles[number]

const bootstrapAdminEmails = new Set(
  (process.env.NEXORA_BOOTSTRAP_ADMIN_EMAILS || 'admin@nexoragroup.ink,nexoraadmi007@gmail.com')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
)

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && adminRoles.includes(value as AdminRole)
}

export async function ensureBootstrapAdmin(user: { id: string; email?: string | null }) {
  const email = (user.email || '').toLowerCase()
  if (!email || !bootstrapAdminEmails.has(email) || !hasSupabaseAdminConfig()) return null
  const supabase = createSupabaseAdminClient()
  const { data: existing, error: lookupError } = await supabase
    .from('admin_roles')
    .select('role, status')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
  if (lookupError) throw new Error(`Admin role lookup failed: ${lookupError.message}`)
  if (existing?.some((item) => isAdminRole(item.role))) return existing[0]

  const { data, error } = await supabase
    .from('admin_roles')
    .insert({ user_id: user.id, role: 'SUPER_ADMIN', status: 'ACTIVE' })
    .select('role, status')
    .single()
  if (error) throw new Error(`Admin bootstrap failed: ${error.message}`)
  await supabase.from('admin_audit_logs').insert({
    admin_user_id: user.id,
    admin_email: email,
    action: 'BOOTSTRAP_SUPER_ADMIN',
    entity: 'admin_roles',
    entity_id: user.id,
    new_value: { role: 'SUPER_ADMIN' },
  }).then(() => undefined, () => undefined)
  return data
}

export async function getCurrentAdmin() {
  if (!hasSupabaseServerConfig() || !hasSupabaseAdminConfig()) return null
  const server = await createSupabaseServerClient()
  const { data: userResult, error: userError } = await server.auth.getUser()
  if (userError || !userResult.user) return null
  await ensureBootstrapAdmin(userResult.user)

  const admin = createSupabaseAdminClient()
  const { data: roles, error: roleError } = await admin
    .from('admin_roles')
    .select('role, status, last_login_at')
    .eq('user_id', userResult.user.id)
    .eq('status', 'ACTIVE')
  if (roleError) throw new Error(`Admin role lookup failed: ${roleError.message}`)
  const role = roles?.find((item) => isAdminRole(item.role))?.role
  if (!role) return { user: userResult.user, role: null }
  return { user: userResult.user, role: role as AdminRole }
}

export async function requireAdmin(allowedRoles: AdminRole[] = [...adminRoles]) {
  const admin = await getCurrentAdmin()
  if (!admin?.user) redirect('/admin/login')
  if (!admin.role || !allowedRoles.includes(admin.role)) redirect('/admin/access-denied')
  return { user: admin.user, role: admin.role }
}
