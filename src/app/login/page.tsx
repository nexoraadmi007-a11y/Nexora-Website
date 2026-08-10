import Link from 'next/link'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'

export default function LoginPage() {
  return (
    <PublicShell>
      <Section eyebrow="Log In" title="Access your Nexora Institute workspace.">
        <Card><form className="form-grid"><Field name="email" label="Email" type="email" required /><Field name="password" label="Password" type="password" required /><button className="btn btn-primary" type="button">Log in</button><div className="actions"><Link href="/forgot-password">Forgot password?</Link><Link href="/signup">Create account</Link></div><p className="muted">Frontend auth is ready for connection. Durable sessions and verification require the V2 auth service.</p></form></Card>
      </Section>
    </PublicShell>
  )
}
