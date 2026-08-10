import Link from 'next/link'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'

export default function SignupPage() {
  return (
    <PublicShell>
      <Section eyebrow="Create Account" title="Start with only the essentials.">
        <Card><form className="form-grid"><div className="grid-2"><Field name="firstName" label="First Name" required /><Field name="lastName" label="Last Name" required /><Field name="email" label="Email" type="email" required /><Field name="phone" label="Phone" required /><Field name="country" label="Country" required /><Field name="password" label="Password" type="password" required /></div><button className="btn btn-primary" type="button">Create account</button><p className="muted">Authentication backend will be connected in the next implementation pass. Existing identities are preserved.</p><Link href="/login">Already have an account?</Link></form></Card>
      </Section>
    </PublicShell>
  )
}
