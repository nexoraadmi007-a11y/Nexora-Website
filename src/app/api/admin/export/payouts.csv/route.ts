import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin?.role || !['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'].includes(admin.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data, error } = await createSupabaseAdminClient()
    .from('payout_requests')
    .select('reference, requested_amount_ngn, approved_amount_ngn, status, partners(full_name, partner_id)')
    .limit(1000)
  if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  const header = ['Partner Name', 'Partner ID', 'Bank Name', 'Account Name', 'Masked Account', 'Requested Amount', 'Approved Amount', 'Reference', 'Status']
  const rows = (data || []).map((item: any) => [
    item.partners?.full_name,
    item.partners?.partner_id,
    '',
    '',
    '',
    item.requested_amount_ngn,
    item.approved_amount_ngn,
    item.reference,
    item.status,
  ])
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="nexora-payout-register.csv"',
    },
  })
}
