import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'

export default function OpportunitiesPage() {
  return (
    <PublicShell>
      <Section eyebrow="Opportunities" title="A future talent network for practical, portfolio-backed learners.">
        <Card><p className="muted">Eligible graduates may be considered for internships, freelance projects, AI data projects, remote work and employer opportunities as real opportunities become available. Nexora Institute does not guarantee jobs or income.</p><ButtonLink href="/signup" variant="secondary">Prepare your profile</ButtonLink></Card>
      </Section>
    </PublicShell>
  )
}
