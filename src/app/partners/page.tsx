import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'

export default function PartnersPage() {
  return (
    <PublicShell>
      <Section eyebrow="Partner Network" title="Help more people access opportunity.">
        <div className="grid-3">
          <Card><h3>Optional participation</h3><p className="muted">Partner participation is separate from learning and should never be presented as guaranteed income.</p></Card>
          <Card><h3>Verified sales only</h3><p className="muted">Commissions are created only after successful, verified and legitimate programme payments.</p></Card>
          <Card><h3>Monthly payouts</h3><p className="muted">Earnings are reviewed monthly, with finance controls and payout rules.</p></Card>
        </div>
        <div className="actions"><ButtonLink href="/signup">Create account</ButtonLink><ButtonLink href="/resources" variant="secondary">Read resources</ButtonLink></div>
      </Section>
    </PublicShell>
  )
}
