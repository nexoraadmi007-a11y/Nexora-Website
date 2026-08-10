import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'
import { formatNaira, programmes } from '@/config/programmes'

const areas = ['Brand clarity', 'Online presence', 'Customer database', 'Marketing', 'Sales process', 'Follow-up', 'Automation', 'Reporting']

export default function BusinessPage() {
  const programme = programmes[1]
  return (
    <PublicShell>
      <section className="hero"><div className="container hero-grid"><div><p className="eyebrow">For Businesses</p><h1>Build the systems behind a business that can grow.</h1><p className="lead">For Instagram vendors, Facebook businesses, WhatsApp sellers, SMEs and founder-led brands that need practical systems for customers, sales and operations.</p><div className="actions"><ButtonLink href={`/checkout?programme=${programme.code}`}>Start business enrolment</ButtonLink><ButtonLink href="/help" variant="secondary">Ask a question</ButtonLink></div></div><Card><p className="eyebrow">Confirmed Price</p><p className="price">{formatNaira(programme.priceNgn)}</p><p className="muted">{programme.duration}</p></Card></div></section>
      <Section eyebrow="Transformation Areas" title="A business programme should produce working systems."><div className="grid-4">{areas.map((area) => <Card key={area}>{area}</Card>)}</div></Section>
    </PublicShell>
  )
}
