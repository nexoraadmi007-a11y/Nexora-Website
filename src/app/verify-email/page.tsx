import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

export default function VerifyEmailPage() {
  return <PublicShell><Section eyebrow="Email Verification" title="Confirm your email before accessing private learning features."><Card><p className="muted">Email verification will be completed by the V2 authentication service.</p></Card></Section></PublicShell>
}
