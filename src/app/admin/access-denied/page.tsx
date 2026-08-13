import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'

export default function AdminAccessDeniedPage() {
  return (
    <PublicShell>
      <Section eyebrow="Admin Access" title="Access denied.">
        <Card>
          <p className="muted">This account is authenticated, but it does not have an active Nexora admin role.</p>
          <div className="card-actions">
            <ButtonLink href="/admin/login">Use another admin account</ButtonLink>
            <ButtonLink href="/app" variant="secondary">Return to workspace</ButtonLink>
          </div>
        </Card>
      </Section>
    </PublicShell>
  )
}
