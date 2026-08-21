import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const exists = (path) => fs.existsSync(new URL(`../${path}`, import.meta.url))
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const migration = read('supabase/migrations/202608210001_learning_lifecycle.sql')
for (const table of ['class_memberships','live_sessions','assignments','learning_resources','announcements','assessments','assessment_questions']) {
  assert(migration.includes(`public.${table}`), `Lifecycle migration must include ${table}.`)
}
assert(migration.includes('members read published live sessions') && migration.includes('members read published resources'), 'Class content requires membership-scoped RLS.')
assert(migration.includes("'class-content', 'class-content', false"), 'Recorded class storage must remain private.')
assert(migration.includes('notifications_user_dedupe_key_idx'), 'Class notifications require per-user deduplication.')

for (const route of [
  'src/app/admin/classes/new/page.tsx', 'src/app/admin/classes/[id]/page.tsx',
  'src/app/admin/projects/new/page.tsx', 'src/app/admin/projects/[id]/page.tsx',
  'src/app/admin/programmes/[id]/page.tsx', 'src/app/admin/tracks/new/page.tsx',
  'src/app/admin/tracks/[id]/page.tsx', 'src/app/admin/notifications/page.tsx',
]) assert(exists(route), `Required admin route is missing: ${route}`)

for (const page of ['classes','projects','resources','notifications']) {
  const source = read(`src/app/app/${page}/page.tsx`)
  assert(source.includes("force-dynamic"), `${page} must use request-time auth and RLS.`)
}

const service = read('src/lib/student-learning.ts')
assert(service.includes('auth.getUser()') && service.includes("redirect('/login')"), 'Student learning services must require a validated Supabase user.')
assert(service.includes("createSignedUrl(item.storage_path, 60 * 15)"), 'Private recordings must use short-lived signed URLs.')

console.log('learning lifecycle checks passed')
