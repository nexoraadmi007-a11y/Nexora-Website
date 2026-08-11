import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

type Props = { params: Promise<{ category: string }> }
const labels: Record<string, string> = { career: 'Career Resources', income: 'Income Resources', templates: 'Templates', tools: 'Tools', recordings: 'Recordings', guides: 'Guides' }

export default async function ResourceCategoryPage({ params }: Props) {
  const { category } = await params
  const title = labels[category] || 'Resources'
  return (
    <AppShell title={title}>
      <div className="page-grid">
        <Card><h3>No {title} yet.</h3><p className="muted">New materials published by the Nexora team will appear here.</p></Card>
        <DataTable headers={['Title', 'Description', 'Type', 'Published', 'Programme', 'Action']} rows={[['Getting started', `Introductory ${title.toLowerCase()} will appear here.`, 'Guide', 'Pending', 'All', 'View / Download']]} />
      </div>
    </AppShell>
  )
}
