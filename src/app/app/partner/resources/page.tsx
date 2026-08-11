import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

const categories = ['Flyers', 'Captions', 'Conversation Guides', 'Programme PDFs', 'FAQs', 'Objection Handling', 'Sales Training']

export default function PartnerResourcesPage() {
  return (
    <AppShell title="Partner Resources">
      <div className="page-grid">
        <Card><h3>Partner Resource Library</h3><p className="muted">Searchable resources for ethical referral conversations, programme education and follow-up.</p></Card>
        <div className="grid-3">{categories.map((category) => <Card key={category}><h3>{category}</h3><p className="muted">Materials will appear here when published by Nexora.</p></Card>)}</div>
      </div>
    </AppShell>
  )
}
