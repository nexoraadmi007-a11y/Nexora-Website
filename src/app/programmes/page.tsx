import Link from 'next/link'
import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'
import { formatNaira, programmes } from '@/config/programmes'

export default function ProgrammesPage() {
  return (
    <PublicShell>
      <Section eyebrow="Programmes" title="Programmes built around capability, proof and responsible opportunity.">
        <div className="grid-2">
          {programmes.map((programme) => (
            <Card key={programme.code}>
              <h3>{programme.name}</h3>
              <p className="muted">{programme.proposition}</p>
              <p className="price">{formatNaira(programme.priceNgn)}</p>
              <p className="muted">{programme.duration}</p>
              <ButtonLink href={`/programmes/${programme.slug}`} variant="secondary">Open programme</ButtonLink>
            </Card>
          ))}
        </div>
      </Section>
      <Section eyebrow="Tracks" title="AI Income Accelerator specialisations.">
        <div className="grid-4">
          {programmes[0].tracks.map((track) => (
            <Link key={track.slug} href={`/programmes/ai-income-accelerator/${track.slug}`} className="card">
              <h3>{track.name}</h3>
              <p className="muted">{track.summary}</p>
            </Link>
          ))}
        </div>
      </Section>
    </PublicShell>
  )
}
