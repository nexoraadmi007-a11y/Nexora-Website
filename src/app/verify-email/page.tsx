import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

export default function VerifyEmailPage() {
  return <PublicShell><Section eyebrow="Email Verification" title="Your email has been verified."><Card><p className="muted">You can now log in and continue your Nexora registration or payment.</p></Card></Section></PublicShell>
}
