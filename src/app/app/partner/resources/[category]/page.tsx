import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

type Props = { params: Promise<{ category: string }> }

export default async function PartnerResourceCategoryPage({ params }: Props) {
  const { category } = await params
  const title = category.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')
  return (
    <AppShell title={title}>
      <div className="page-grid">
        <Card><h3>No {title} yet.</h3><p className="muted">Approved partner materials will appear here when published.</p></Card>
        <DataTable headers={['Title', 'Description', 'Type', 'Published', 'Actions']} rows={[['Starter material', 'Published partner assets will be listed here.', 'Resource', 'Pending', 'View / Download / Copy / Share']]} />
      </div>
    </AppShell>
  )
}
