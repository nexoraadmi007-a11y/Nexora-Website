import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'

export default function ForgotPasswordPage() {
  return <PublicShell><Section eyebrow="Password Reset" title="Reset access securely."><Card><form className="form-grid"><Field name="email" label="Email" type="email" required /><button className="btn btn-primary" type="button">Send reset link</button><p className="muted">Email reset delivery will connect to the V2 auth service.</p></form></Card></Section></PublicShell>
}
