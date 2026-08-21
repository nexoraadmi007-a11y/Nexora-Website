import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { requireAdmin } from '@/lib/admin-auth'
import { audit, optional, programmeOptions, trackOptions, value } from '@/lib/admin-learning'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

async function createClass(form: FormData) {
  'use server'
  const admin = await requireAdmin(['SUPER_ADMIN','ADMIN','PROGRAMME_ADMIN'])
  const name = value(form, 'name', 180), programmeId = value(form, 'programmeId', 50)
  if (!name || !programmeId) return
  const payload = { name, title: name, programme_id: programmeId, track_id: optional(form, 'trackId', 50), cohort: optional(form, 'cohort', 120), trainer: optional(form, 'trainer', 160), starts_at: optional(form, 'startsAt', 20), ends_at: optional(form, 'endsAt', 20), status: value(form, 'status', 30) || 'DRAFT' }
  const { data, error } = await createSupabaseAdminClient().from('classes').insert(payload).select('id').single()
  if (error) throw new Error(`Class creation failed: ${error.message}`)
  await audit(admin, 'CLASS_CREATED', 'classes', data.id, payload)
  redirect(`/admin/classes/${data.id}`)
}

export default async function NewClassPage() {
  await requireAdmin(['SUPER_ADMIN','ADMIN','PROGRAMME_ADMIN'])
  const [programmes, tracks] = await Promise.all([programmeOptions(), trackOptions()])
  return <AdminShell title="Create Class"><Card><form className="form-grid" action={createClass}><div className="grid-2">
    <label className="field"><span>Class name</span><input name="name" required /></label>
    <label className="field"><span>Programme</span><select name="programmeId" required><option value="">Select programme</option>{programmes.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label className="field"><span>Track (optional)</span><select name="trackId"><option value="">No track</option>{tracks.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    <label className="field"><span>Cohort</span><input name="cohort" placeholder="Cohort 1" /></label><label className="field"><span>Trainer</span><input name="trainer" /></label>
    <label className="field"><span>Start date</span><input name="startsAt" type="date" /></label><label className="field"><span>End date</span><input name="endsAt" type="date" /></label>
    <label className="field"><span>Status</span><select name="status"><option>DRAFT</option><option>ACTIVE</option><option>COMPLETED</option></select></label>
  </div><button className="btn btn-primary" type="submit">Create Class</button></form></Card></AdminShell>
}
