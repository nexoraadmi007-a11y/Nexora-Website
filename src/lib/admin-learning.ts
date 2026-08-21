import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export function value(form: FormData, key: string, max = 5000) {
  return String(form.get(key) || '').trim().slice(0, max)
}

export function optional(form: FormData, key: string, max = 5000) {
  return value(form, key, max) || null
}

export function checked(form: FormData, key: string) {
  return form.get(key) === 'on' || form.get(key) === 'true'
}

export async function audit(admin: { user: { id: string; email: string } }, action: string, entity: string, entityId?: string, next?: unknown) {
  await createSupabaseAdminClient().from('admin_audit_logs').insert({
    admin_user_id: admin.user.id,
    admin_email: admin.user.email,
    action,
    entity,
    entity_id: entityId || null,
    new_value: next || null,
  }).then(() => undefined, () => undefined)
}

export async function notifyClass(classId: string, entityType: string, entityId: string, title: string, body: string, href: string) {
  const db = createSupabaseAdminClient()
  const { data: members, error } = await db.from('class_memberships').select('user_id').eq('class_id', classId).eq('status', 'ACTIVE')
  if (error) throw new Error(`Class notification recipients failed: ${error.message}`)
  if (!members?.length) return 0
  const dedupeKey = `${entityType}:${entityId}`
  const { error: insertError } = await db.from('notifications').upsert(
    members.map((member) => ({ user_id: member.user_id, class_id: classId, entity_type: entityType, entity_id: entityId, dedupe_key: dedupeKey, title, body, category: 'Learning', href })),
    { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true },
  )
  if (insertError) throw new Error(`Class notification delivery failed: ${insertError.message}`)
  return members.length
}

export async function classOptions() {
  const { data } = await createSupabaseAdminClient().from('classes').select('id, name, title, cohort').is('archived_at', null).order('created_at', { ascending: false })
  return data || []
}

export async function programmeOptions() {
  const { data } = await createSupabaseAdminClient().from('programmes').select('id, name, programme_code').order('name')
  return data || []
}

export async function trackOptions(programmeId?: string) {
  let query = createSupabaseAdminClient().from('programme_tracks').select('id, name, track_code, programme_id').order('name')
  if (programmeId) query = query.eq('programme_id', programmeId)
  const { data } = await query
  return data || []
}
