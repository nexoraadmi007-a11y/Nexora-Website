import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminPartnersPage() {
  return <AdminShell title="Partners"><Card><EmptyState title="Partner management pending.">Referral codes, qualified sales, earnings, bank verification and status will be managed here.</EmptyState></Card></AdminShell>
}
