import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

export default function AdminReferralsPage() {
  return <AdminShell title="Referrals"><div className="page-grid"><Card><h3>Referral Audit</h3><p className="muted">Track code capture, registration, payment, qualification and commission status.</p></Card><DataTable headers={['Referral Code', 'Registrant', 'Payment', 'Qualification', 'Commission']} rows={[['-', 'No referral selected', '-', '-', '-']]}/></div></AdminShell>
}
