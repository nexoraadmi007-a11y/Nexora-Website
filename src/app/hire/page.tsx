import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'

export default function HirePage() {
  return (
    <PublicShell>
      <Section eyebrow="For Employers" title="Hire emerging AI-enabled talent.">
        <Card><p className="muted">Nexora Institute is preparing a portfolio-based talent network for internship candidates, junior talent, project teams and AI-data work where available.</p><ButtonLink href="/help" variant="secondary">Talk to Nexora Institute</ButtonLink></Card>
      </Section>
    </PublicShell>
  )
}
