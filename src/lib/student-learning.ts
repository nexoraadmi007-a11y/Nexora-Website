import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function requireStudent() {
  const db = await createSupabaseServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  return { db, user }
}

export async function studentClasses() {
  const { db, user } = await requireStudent()
  const { data } = await db.from('class_memberships').select('id,joined_at,status,classes(id,name,title,cohort,trainer,starts_at,ends_at,status,programmes(name),programme_tracks(name))').eq('user_id', user.id).eq('status','ACTIVE')
  return data || []
}

export async function studentSessions() {
  const { db } = await requireStudent()
  const { data } = await db.from('live_sessions').select('*,classes(name,title,cohort,programmes(name))').eq('published',true).order('session_date')
  return data || []
}

export async function studentProjectsAndAssignments() {
  const { db } = await requireStudent()
  const [{data:projects},{data:assignments}] = await Promise.all([
    db.from('projects').select('*,classes(name,title,cohort),programme_tracks(name)').eq('published',true).is('archived_at',null).order('deadline'),
    db.from('assignments').select('*,classes(name,title,cohort),programme_tracks(name)').eq('published',true).is('archived_at',null).order('due_at'),
  ])
  return { projects: projects || [], assignments: assignments || [] }
}

export async function studentResources() {
  const { db } = await requireStudent()
  const { data } = await db.from('learning_resources').select('*,classes(name,title,cohort)').eq('published',true).is('archived_at',null).order('created_at',{ascending:false})
  const items = await Promise.all((data || []).map(async (item:any) => {
    if (!item.storage_path) return item
    const { data: signed } = await db.storage.from('class-content').createSignedUrl(item.storage_path, 60 * 15)
    return { ...item, access_url: signed?.signedUrl || null }
  }))
  return items
}

export async function studentNotifications() {
  const { db, user } = await requireStudent()
  const { data } = await db.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(200)
  return data || []
}
