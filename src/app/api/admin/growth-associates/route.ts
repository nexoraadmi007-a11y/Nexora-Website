import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

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
