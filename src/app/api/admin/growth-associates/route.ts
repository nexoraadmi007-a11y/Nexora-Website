import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getGrowthAssociatePortalUrl } from '@/lib/growth-associate-urls'
import { legacyAssociateHrFields } from '@/lib/legacy-associate-sync'

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin || !['SUPER_ADMIN','ADMIN','FINANCE_ADMIN'].includes(admin.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const form = await request.formData()
  const action = String(form.get('action') || '')
  const id = String(form.get('id') || '')
  const reason = String(form.get('reason') || '').trim().slice(0, 500)
  const db = createSupabaseAdminClient()
  try {
    if (action === 'associate_status') {
      const status = String(form.get('status')) === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
      const { data: previous } = await db.from('partners').select('id,status').eq('id', id).single()
      await db.from('partners').update({ status, updated_at: new Date().toISOString() }).eq('id', id).throwOnError()
      await db.from('admin_audit_logs').insert({ admin_user_id: admin.user.id, admin_email: admin.user.email, action: 'ASSOCIATE_STATUS_CHANGED', entity: 'partners', entity_id: id, previous_value: previous, new_value: { status }, metadata: { reason } }).throwOnError()
    } else if (action === 'sync_legacy_hr') {
      const { data: previous } = await db.from('partners').select('*').eq('id', id).single()
      if (!previous) throw new Error('Associate not found.')
      const legacy = await legacyAssociateHrFields(previous)
      if (!legacy) throw new Error('No matching historical Airtable associate record was found.')
      const safeLegacy = Object.fromEntries(Object.entries(legacy).filter(([, value]) => value !== null && value !== undefined && value !== ''))
      await db.from('partners').update({ ...safeLegacy, updated_at: new Date().toISOString() }).eq('id', id).throwOnError()
      await db.from('admin_audit_logs').insert({ admin_user_id: admin.user.id, admin_email: admin.user.email, action: 'LEGACY_ASSOCIATE_HR_SYNCED', entity: 'partners', entity_id: id, previous_value: previous, new_value: safeLegacy, metadata: { source: 'Airtable Ambassadors' } }).throwOnError()
    } else if (action === 'invite_portal') {
      const { data: partner } = await db.from('partners').select('id,email,user_id,partner_id,status').eq('id', id).single()
      if (!partner?.email || partner.status !== 'ACTIVE') throw new Error('Only an active associate with an email address can be invited.')
      if (!partner.user_id) {
        const { data: invite, error } = await db.auth.admin.inviteUserByEmail(partner.email, { redirectTo: getGrowthAssociatePortalUrl(partner.partner_id) })
        if (error) throw error
        if (invite.user) await db.from('partners').update({ user_id: invite.user.id, updated_at: new Date().toISOString() }).eq('id', id).throwOnError()
      }
      await db.from('admin_audit_logs').insert({ admin_user_id: admin.user.id, admin_email: admin.user.email, action: 'ASSOCIATE_PORTAL_INVITED', entity: 'partners', entity_id: id, new_value: { portal_access: true }, metadata: { reason } }).throwOnError()
    } else if (action === 'update_hr_profile') {
      const allowed = ['full_name','whatsapp','gender','location','institution','field_of_study','graduation_information','nysc_information','telegram_username','telegram_user_id','telegram_chat_id','interviewer','interview_notes','inactive_reason'] as const
      const updates: Record<string, string | null> = {}
      for (const key of allowed) updates[key] = String(form.get(key) || '').trim().slice(0, key.includes('notes') || key.includes('reason') ? 2000 : 300) || null
      const dateOfBirth = String(form.get('date_of_birth') || '')
      if (dateOfBirth) updates.date_of_birth = dateOfBirth
      const { data: previous } = await db.from('partners').select('*').eq('id', id).single()
      await db.from('partners').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).throwOnError()
      await db.from('admin_audit_logs').insert({ admin_user_id: admin.user.id, admin_email: admin.user.email, action: 'ASSOCIATE_HR_PROFILE_UPDATED', entity: 'partners', entity_id: id, previous_value: previous, new_value: updates, metadata: { reason } }).throwOnError()
    } else if (['schedule_interview','mark_interviewed','pass_interview','fail_interview'].includes(action)) {
      const scheduledAt = String(form.get('interview_date') || '') || null
      const interviewer = String(form.get('interviewer') || '').trim().slice(0, 300) || null
      const notes = String(form.get('interview_notes') || '').trim().slice(0, 2000) || null
      const state = action === 'schedule_interview'
        ? { recruitment_status: 'INTERVIEW_SCHEDULED', interview_status: 'SCHEDULED', status: undefined }
        : action === 'mark_interviewed'
          ? { recruitment_status: 'INTERVIEWED', interview_status: 'INTERVIEWED', status: undefined }
          : action === 'pass_interview'
            ? { recruitment_status: 'ACTIVE_ASSOCIATE', interview_status: 'PASSED', status: 'ACTIVE' }
            : { recruitment_status: 'REJECTED', interview_status: 'FAILED', status: 'INACTIVE' }
      const { data: previous } = await db.from('partners').select('*').eq('id', id).single()
      const partnerUpdate: Record<string, unknown> = { recruitment_status: state.recruitment_status, interview_status: state.interview_status, interview_date: scheduledAt || previous?.interview_date, interviewer: interviewer || previous?.interviewer, interview_notes: notes || previous?.interview_notes, interview_outcome: state.interview_status, updated_at: new Date().toISOString() }
      if (state.status) { partnerUpdate.status = state.status; partnerUpdate.engagement_status = state.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' }
      if (action === 'fail_interview') partnerUpdate.inactive_reason = reason || notes || 'Interview failed'
      await db.from('partners').update(partnerUpdate).eq('id', id).throwOnError()
      await db.from('associate_interviews').insert({ partner_id: id, scheduled_at: scheduledAt || previous?.interview_date, interviewer: interviewer || previous?.interviewer, status: state.interview_status, outcome: state.interview_status, notes: notes || reason || null, created_by: admin.user.id }).throwOnError()
      await db.from('admin_audit_logs').insert({ admin_user_id: admin.user.id, admin_email: admin.user.email, action: action.toUpperCase(), entity: 'partners', entity_id: id, previous_value: previous, new_value: partnerUpdate, metadata: { reason } }).throwOnError()
    } else if (action === 'assign_sponsor') {
      const sponsorPartnerId = String(form.get('sponsorPartnerId') || '') || null
      if (sponsorPartnerId === id) throw new Error('An associate cannot sponsor themselves.')
      const { data: previous } = await db.from('partners').select('id,sponsor_partner_id').eq('id', id).single()
      await db.from('partners').update({ sponsor_partner_id: sponsorPartnerId, updated_at: new Date().toISOString() }).eq('id', id).throwOnError()
      await db.from('admin_audit_logs').insert({ admin_user_id: admin.user.id, admin_email: admin.user.email, action: 'ASSOCIATE_SPONSOR_CHANGED', entity: 'partners', entity_id: id, previous_value: previous, new_value: { sponsor_partner_id: sponsorPartnerId }, metadata: { reason } }).throwOnError()
    } else if (action === 'invalidate_referral') {
      if (!reason) throw new Error('A reason is required.')
      const { data: previous } = await db.from('referral_conversions').select('*').eq('id', id).single()
      await db.from('referral_conversions').update({ status: 'INVALID', invalidated_at: new Date().toISOString(), invalidated_by: admin.user.id, invalidation_reason: reason, updated_at: new Date().toISOString() }).eq('id', id).throwOnError()
      await db.from('admin_audit_logs').insert({ admin_user_id: admin.user.id, admin_email: admin.user.email, action: 'REFERRAL_INVALIDATED', entity: 'referral_conversions', entity_id: id, previous_value: previous, new_value: { status: 'INVALID', reason } }).throwOnError()
    } else if (action === 'record_payout') {
      const performanceId = String(form.get('performanceId') || '')
      const partnerId = String(form.get('partnerId') || '')
      const amount = Number(form.get('amount') || 0)
      const status = String(form.get('status') || 'PENDING').toUpperCase()
      const reference = String(form.get('reference') || '').trim()
      if (!['PENDING','APPROVED','PAID'].includes(status) || amount < 0 || !reference) throw new Error('A valid payout amount and reference are required.')
      await db.from('payout_requests').upsert({ performance_id: performanceId, partner_id: partnerId, requested_amount_ngn: amount, approved_amount_ngn: amount, status, reference, payment_method: String(form.get('paymentMethod') || '').trim() || null, admin_notes: reason || null, acted_by: admin.user.id, acted_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'performance_id' }).throwOnError()
      await db.from('associate_monthly_performance').update({ status, updated_at: new Date().toISOString() }).eq('id', performanceId).throwOnError()
      await db.from('admin_audit_logs').insert({ admin_user_id: admin.user.id, admin_email: admin.user.email, action: `COMMISSION_${status}`, entity: 'associate_monthly_performance', entity_id: performanceId, new_value: { amount, status }, metadata: { reason } }).throwOnError()
    }
    const returnTo = String(form.get('returnTo') || '/admin/growth-associates')
    return NextResponse.redirect(new URL(returnTo.startsWith('/admin/') ? returnTo : '/admin/growth-associates', request.url), 303)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed' }, { status: 400 })
  }
}
