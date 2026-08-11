import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

const categories = [['flyers', 'Flyers'], ['captions', 'Captions'], ['conversation-guides', 'Conversation Guides'], ['programme-pdfs', 'Programme PDFs'], ['faqs', 'FAQs'], ['objection-handling', 'Objection Handling'], ['sales-training', 'Sales Training']]

export default function PartnerResourcesPage() {
  return (
    <AppShell title="Partner Resources">
      <div className="page-grid">
        <Card><h3>Partner Resource Library</h3><p className="muted">Use approved assets for ethical referral conversations, programme education and follow-up.</p></Card>
        <div className="grid-3">{categories.map(([slug, title]) => <Link className="click-card" href={`/app/partner/resources/${slug}`} key={slug}><strong>{title}<ArrowRight size={17} /></strong><span className="muted">Open partner materials.</span></Link>)}</div>
      </div>
    </AppShell>
  )
}
