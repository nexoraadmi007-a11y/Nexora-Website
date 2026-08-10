import { notFound } from 'next/navigation'
import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'
import { findTrack, formatNaira, programmes, skillToIncomeModule } from '@/config/programmes'

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: slug } = await params
  const track = findTrack(slug)
  const programme = programmes[0]
  if (!track) notFound()

  return (
    <PublicShell>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">AI Income Accelerator Track</p>
            <h1>{track.name}</h1>
            <p className="lead">{track.summary}</p>
            <div className="actions">
              <ButtonLink href={`/checkout?programme=${programme.code}&track=${track.code}`}>Enrol in this track</ButtonLink>
              <ButtonLink href="/programmes" variant="secondary">Compare tracks</ButtonLink>
            </div>
          </div>
          <Card><p className="eyebrow">Track Fee</p><p className="price">{formatNaira(programme.priceNgn)}</p><p className="muted">{programme.duration}</p></Card>
        </div>
      </section>
      <Section eyebrow="What You'll Learn" title="Practical capability, not generic lessons."><div className="grid-3">{track.learn.map((item) => <Card key={item}>{item}</Card>)}</div></Section>
      <Section eyebrow="Projects" title="Build proof that you can do the work."><div className="grid-2">{track.projects.map((item) => <Card key={item}>{item}</Card>)}</div></Section>
      <Section eyebrow="Service Possibilities" title="Possible ways to package the skill after training."><div className="grid-3">{track.services.map((item) => <Card key={item}>{item}</Card>)}</div></Section>
      <Section eyebrow={skillToIncomeModule.title} title="Every track includes the shared commercialisation module."><Card><ul className="list">{skillToIncomeModule.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul></Card></Section>
    </PublicShell>
  )
}
