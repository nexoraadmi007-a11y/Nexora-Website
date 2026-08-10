import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function PartnerPage() {
  return (
    <AppShell title="Partner">
      <div className="grid-3">
        <Card><h3>Referral Link</h3><EmptyState title="Partner profile not active.">Activate partner status to receive a stable referral code and URL.</EmptyState></Card>
        <Card><h3>Monthly Direct Sales</h3><EmptyState title="No qualified sales yet.">Only verified paid referrals count toward milestones.</EmptyState></Card>
        <Card><h3>Next Payout</h3><EmptyState title="No payout cycle yet.">Approved earnings are reviewed monthly before payout.</EmptyState></Card>
      </div>
    </AppShell>
  )
}
