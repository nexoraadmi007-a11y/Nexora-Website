import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'
import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'

export const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN', 'FINANCE_ADMIN', 'TALENT_ADMIN', 'SUPPORT_ADMIN'] as const
export type AdminRole = typeof adminRoles[number]

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && adminRoles.includes(value as AdminRole)
}

export async function getCurrentAdmin() {
  if (!hasSupabaseAdminConfig()) return null
  const cookieStore = await cookies()
  const session = await verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
  if (!session || !isAdminRole(session.role)) return null
  const admin = createSupabaseAdminClient()
  const { data: roleRecord, error } = await admin.from('admin_roles').select('role, status, last_login_at').eq('user_id', session.userId).eq('role', session.role).eq('status', 'ACTIVE').maybeSingle()
  if (error || !roleRecord || !isAdminRole(roleRecord.role)) return null
  return { user: { id: session.userId, email: session.email }, role: roleRecord.role, session }
}

export async function requireAdmin(allowedRoles: AdminRole[] = [...adminRoles]) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (!allowedRoles.includes(admin.role)) redirect('/admin/access-denied')
  return admin
}
