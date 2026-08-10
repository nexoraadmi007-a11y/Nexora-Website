import { AdminShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AdminAnalyticsPage() {
  return <AdminShell title="Analytics"><Card><EmptyState title="Analytics requires canonical events.">Acquisition, learning, revenue, partner and opportunity analytics will use V2 event records.</EmptyState></Card></AdminShell>
}
