import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

export default function PartnerTermsPage() {
  return (
    <PublicShell>
      <Section eyebrow="Legal" title="Nexora Partner Terms & Conditions">
        <Card>
          <p className="muted">Nexora Partners may refer prospective learners and business customers using approved programme information. Earnings are based on verified programme payments, qualification rules, refund status and finance approval. Partner activity must be honest, non-misleading and aligned with Nexora Institute communication standards.</p>
        </Card>
      </Section>
    </PublicShell>
  )
}
