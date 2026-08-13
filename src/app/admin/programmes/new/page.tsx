import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

async function createProgramme(formData: FormData) {
  'use server'
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN'])
  const title = String(formData.get('title') || '').trim()
  const slug = String(formData.get('slug') || '').trim()
  const code = String(formData.get('code') || '').trim().toUpperCase()
  const price = Number(formData.get('price') || 0)
  if (!title || !slug || !code || !price) return
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('programmes').insert({
    name: title,
    slug,
    programme_code: code,
    short_description: String(formData.get('shortDescription') || '').trim(),
    audience: String(formData.get('audience') || '').trim(),
    duration: String(formData.get('duration') || '4 weeks').trim(),
    price_ngn: price,
    currency: String(formData.get('currency') || 'NGN').trim(),
    family: String(formData.get('family') || 'career').trim(),
    programme_type: String(formData.get('type') || 'CAREER_COURSE').trim(),
    community_link: String(formData.get('communityLink') || '').trim(),
    status: 'DRAFT',
    active: false,
    registration_open: false,
  })
  if (error) throw new Error(`Programme creation failed: ${error.message}`)
  redirect('/admin/programmes')
}

export default async function NewProgrammePage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'PROGRAMME_ADMIN'])
  return (
    <AdminShell title="Create Programme">
      <Card>
        <h3>Programme Creation</h3>
        <form className="form-grid" action={createProgramme}>
          <div className="grid-2">
            <label className="field"><span>Programme Title</span><input name="title" required /></label>
            <label className="field"><span>Slug</span><input name="slug" required /></label>
            <label className="field"><span>Programme Code</span><input name="code" required /></label>
            <label className="field"><span>Short Description</span><input name="shortDescription" /></label>
            <label className="field"><span>Audience</span><input name="audience" /></label>
            <label className="field"><span>Duration</span><input name="duration" defaultValue="4 weeks" /></label>
            <label className="field"><span>Price</span><input name="price" type="number" defaultValue={10000} required /></label>
            <label className="field"><span>Currency</span><input name="currency" defaultValue="NGN" /></label>
            <label className="field"><span>Programme Type</span><select name="type" defaultValue="CAREER_COURSE"><option>CAREER_COURSE</option><option>BUSINESS_COURSE</option></select></label>
            <label className="field"><span>Family</span><select name="family" defaultValue="career"><option value="career">Career</option><option value="business">Business</option></select></label>
            <label className="field"><span>Community Link</span><input name="communityLink" /></label>
          </div>
          <button className="btn btn-primary" type="submit">Create Draft Programme</button>
        </form>
      </Card>
    </AdminShell>
  )
}
