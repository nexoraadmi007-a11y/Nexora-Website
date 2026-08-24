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

export async function studentDashboard() {
  const { db, user } = await requireStudent()
  const [{ data: profile }, { data: enrolments }, { data: memberships }, { data: assignments }, { data: submissions }] = await Promise.all([
    db.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    db.from('enrolments').select('id,status,programme_id,programmes(id,name,slug,short_description,price_ngn)').eq('user_id', user.id).in('status', ['ENROLLED', 'ACTIVE', 'COMPLETED']).order('created_at', { ascending: false }),
    db.from('class_memberships').select('class_id,classes(id,name,title,programmes(name),live_sessions(id,title,session_date,start_time,end_time,meeting_url,published),learning_resources(id,title,resource_type,external_url,published,created_at))').eq('user_id', user.id).eq('status', 'ACTIVE'),
    db.from('assignments').select('id,title,due_at,status,class_id,classes(name,title,programmes(name))').eq('published', true).is('archived_at', null).order('due_at').limit(12),
    db.from('assignment_submissions').select('assignment_id,status,submitted_at').eq('user_id', user.id),
  ])
  const now = Date.now()
  const sessions = (memberships || []).flatMap((membership: any) => (membership.classes?.live_sessions || []).filter((session: any) => session.published).map((session: any) => ({ ...session, class: membership.classes })))
  const upcoming = sessions.filter((session: any) => new Date(`${session.session_date}T${session.start_time || '00:00'}`).getTime() >= now).sort((a: any, b: any) => new Date(`${a.session_date}T${a.start_time || '00:00'}`).getTime() - new Date(`${b.session_date}T${b.start_time || '00:00'}`).getTime())[0] || null
  const recordings = (memberships || []).flatMap((membership: any) => (membership.classes?.learning_resources || []).filter((resource: any) => resource.published && (resource.resource_type === 'VIDEO' || resource.external_url)).map((resource: any) => ({ ...resource, class: membership.classes }))).sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 4)
  const submissionMap = new Map((submissions || []).map((submission: any) => [submission.assignment_id, submission]))
  return { name: profile?.full_name || user.email?.split('@')[0] || 'Student', enrolments: enrolments || [], upcoming, assignments: (assignments || []).map((assignment: any) => ({ ...assignment, submission: submissionMap.get(assignment.id) || null })).slice(0, 5), recordings }
}
