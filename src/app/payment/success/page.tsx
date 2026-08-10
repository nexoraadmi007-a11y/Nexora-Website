import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'

export default function PaymentSuccessPage() {
  return (
    <PublicShell>
      <Section eyebrow="You're In" title="Your payment will be verified before enrolment is confirmed.">
        <Card><p className="muted">This page preserves the post-Paystack return path. V2 will display programme, amount paid, reference, cohort, next live class and community link after server verification.</p><ButtonLink href="/app" variant="secondary">Go to My Dashboard</ButtonLink></Card>
      </Section>
    </PublicShell>
  )
}
