import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

const resources = [
  ['career', 'Career Resources'],
  ['income', 'Income Resources'],
  ['templates', 'Templates'],
  ['tools', 'Tools'],
  ['recordings', 'Recordings'],
  ['guides', 'Guides'],
]

export default function AppResourcesPage() {
  return (
    <AppShell title="Resources">
      <div className="page-grid">
        <Card><h3>Resource Centre</h3><p className="muted">Use these resources to prepare for learning, portfolio building, career positioning and income development.</p></Card>
        <div className="grid-3">{resources.map(([slug, title]) => <Link className="click-card" href={`/app/resources/${slug}`} key={slug}><strong>{title}<ArrowRight size={17} /></strong><span className="muted">Open resources in this category.</span></Link>)}</div>
      </div>
    </AppShell>
  )
}
