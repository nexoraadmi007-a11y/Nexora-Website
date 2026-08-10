import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminReferralsPage() {
  return <AdminShell title="Referrals"><Card><EmptyState title="Referral event audit pending.">Referral clicks, captured codes, account creation, payments and qualified sales will be shown from canonical events.</EmptyState></Card></AdminShell>
}
