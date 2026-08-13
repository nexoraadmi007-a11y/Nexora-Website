import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminSimpleTable } from '@/lib/admin-services'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

async function createRuleVersion(formData: FormData) {
  'use server'
  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])
  const supabase = createSupabaseAdminClient()
  const { data: latest } = await supabase.from('commission_rule_versions').select('*').order('version', { ascending: false }).limit(1).maybeSingle()
  const nextVersion = Number(latest?.version || 0) + 1
  const { error } = await supabase.from('commission_rule_versions').insert({
    version: nextVersion,
    effective_from: String(formData.get('effectiveFrom') || new Date().toISOString().slice(0, 10)),
    l1_percent: Number(formData.get('l1') || 15),
    l2_percent: Number(formData.get('l2') || 10),
    l3_percent: Number(formData.get('l3') || 5),
    l2_monthly_cap: Number(formData.get('l2Cap') || 10),
    l3_monthly_cap: Number(formData.get('l3Cap') || 10),
    payout_ceiling_percent: Number(formData.get('ceiling') || 35),
    previous_values: latest || null,
    changed_by: admin.user.id,
  })
  if (error) throw new Error(`Commission rule update failed: ${error.message}`)
  redirect('/admin/commissions')
}

export default async function CommissionSettingsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'])
  const rules = await adminSimpleTable('commission_rule_versions')
  const latest: any = rules[0] || {}
  return (
    <AdminShell title="Commission Settings">
      <div className="page-grid">
        <Card><h3>Create Rule Version</h3><form className="form-grid" action={createRuleVersion}><div className="grid-2">{[['effectiveFrom', 'Effective From', 'date', new Date().toISOString().slice(0, 10)], ['l1', 'L1 %', 'number', latest.l1_percent || 15], ['l2', 'L2 %', 'number', latest.l2_percent || 10], ['l3', 'L3 %', 'number', latest.l3_percent || 5], ['l2Cap', 'L2 Monthly Cap', 'number', latest.l2_monthly_cap || 10], ['l3Cap', 'L3 Monthly Cap', 'number', latest.l3_monthly_cap || 10], ['ceiling', 'Payout Ceiling %', 'number', latest.payout_ceiling_percent || 35]].map(([name, label, type, value]) => <label className="field" key={name}><span>{label}</span><input name={String(name)} type={String(type)} defaultValue={String(value)} /></label>)}</div><button className="btn btn-primary" type="submit">Save New Version</button></form></Card>
        <DataTable headers={['Version', 'Effective', 'L1', 'L2', 'L3', 'Ceiling']} rows={rules.map((rule: any) => [String(rule.version), rule.effective_from, `${rule.l1_percent}%`, `${rule.l2_percent}%`, `${rule.l3_percent}%`, `${rule.payout_ceiling_percent}%`])} />
      </div>
    </AdminShell>
  )
}
