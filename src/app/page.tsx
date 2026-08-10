import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'

const journey = [
  ['Learn', 'Build practical AI-powered skills through focused programmes.'],
  ['Build', 'Complete real projects and develop proof of ability.'],
  ['Earn', 'Learn how to package, market and sell your skills responsibly.'],
  ['Work', 'Become better positioned for internships, freelance projects and employment opportunities.'],
]

export default function HomePage() {
  return (
    <PublicShell>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Skills-to-income for Africa's emerging workforce</p>
            <h1>Build skills that create opportunity.</h1>
            <p className="lead">Nexora Institute helps Africans build practical AI-powered skills, create real projects, learn how to turn those skills into income opportunities, and prepare for the future of work.</p>
            <div className="actions">
              <ButtonLink href="/programmes">Explore Programmes</ButtonLink>
              <ButtonLink href="#how" variant="secondary">How Nexora Institute Works</ButtonLink>
            </div>
          </div>
          <Card>
            <p className="eyebrow">Learn. Build. Earn. Work.</p>
            <div className="grid-2">
              {journey.map(([title, copy]) => (
                <div key={title}>
                  <h3>{title}</h3>
                  <p className="muted">{copy}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <Section id="how" eyebrow="The Platform" title="A coherent path from skill development to opportunity readiness.">
        <div className="grid-4">
          {journey.map(([title, copy], index) => <Card key={title}><p className="eyebrow">0{index + 1}</p><h3>{title}</h3><p className="muted">{copy}</p></Card>)}
        </div>
      </Section>

      <Section eyebrow="Choose Your Path" title="Start with learning. Extend into business systems or opportunities when ready.">
        <div className="grid-3">
          <Card><h3>AI Income Accelerator</h3><p className="muted">Four career specialisations built around projects, portfolio and income readiness.</p><ButtonLink href="/programmes/ai-income-accelerator" variant="secondary">View tracks</ButtonLink></Card>
          <Card><h3>For Businesses</h3><p className="muted">A practical transformation programme for founder-led businesses and social-commerce brands.</p><ButtonLink href="/business" variant="secondary">View business path</ButtonLink></Card>
          <Card><h3>Opportunity Network</h3><p className="muted">Eligible graduates may be considered for future internships, projects and employer opportunities.</p><ButtonLink href="/opportunities" variant="secondary">Learn more</ButtonLink></Card>
        </div>
      </Section>

      <Section eyebrow="Partner Network" title="Distribution is optional. The mission is education and economic opportunity.">
        <Card>
          <p className="muted">Nexora Partners help people discover relevant programmes and receive verified commissions from successful referrals. The public product remains skills, practical projects, income readiness and the future of work.</p>
          <ButtonLink href="/partners" variant="secondary">Learn about partners</ButtonLink>
        </Card>
      </Section>
    </PublicShell>
  )
}
