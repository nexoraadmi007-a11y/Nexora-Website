import { notFound } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'
import { findProgramme, formatNaira, skillToIncomeModule } from '@/config/programmes'

export default async function ProgrammePage({ params }: { params: Promise<{ programme: string }> }) {
  const { programme: slug } = await params
  const programme = findProgramme(slug)
  if (!programme) notFound()

  return (
    <PublicShell>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">{programme.duration}</p>
            <h1>{programme.name}</h1>
            <p className="lead">{programme.proposition}</p>
            <div className="actions">
              <ButtonLink href={`/checkout?programme=${programme.code}`}>Start enrolment</ButtonLink>
              <ButtonLink href="/signup" variant="secondary">Create account</ButtonLink>
            </div>
          </div>
          <Card><p className="eyebrow">Price</p><p className="price">{formatNaira(programme.priceNgn)}</p><p className="muted">Payment is verified server-side before enrolment is confirmed.</p></Card>
        </div>
      </section>
      <Section eyebrow="Who It's For" title="Built for the people this programme can genuinely serve.">
        <div className="grid-3">{programme.audience.map((item) => <Card key={item}><h3>{item}</h3></Card>)}</div>
      </Section>
      {programme.tracks.length ? (
        <Section eyebrow="Specialisations" title="Choose one focused track.">
          <div className="grid-4">{programme.tracks.map((track) => <Card key={track.slug}><h3>{track.name}</h3><p className="muted">{track.summary}</p><ButtonLink href={`/programmes/${programme.slug}/${track.slug}`} variant="secondary">View details</ButtonLink></Card>)}</div>
        </Section>
      ) : null}
      <Section eyebrow="Outcomes" title="What the programme is designed to produce.">
        <div className="grid-3">{programme.outcomes.map((outcome) => <Card key={outcome}><p>{outcome}</p></Card>)}</div>
      </Section>
      {programme.code === 'AI_INCOME_ACCELERATOR' ? (
        <Section eyebrow={skillToIncomeModule.title} title="Income acquisition is taught as a professional skill, not promised as a result.">
          <Card><ul className="list">{skillToIncomeModule.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul></Card>
        </Section>
      ) : null}
    </PublicShell>
  )
}
