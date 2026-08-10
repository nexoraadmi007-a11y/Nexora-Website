import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'
import { formatNaira, programmes } from '@/config/programmes'

export default function CheckoutPage() {
  return (
    <PublicShell>
      <Section eyebrow="Review Order" title="Programme payment is verified server-side before enrolment.">
        <div className="grid-2">
          {programmes.map((programme) => <Card key={programme.code}><h3>{programme.name}</h3><p className="price">{formatNaira(programme.priceNgn)}</p><p className="muted">{programme.duration}</p></Card>)}
          <Card><form className="form-grid"><Field name="fullName" label="Full Name" required /><Field name="email" label="Email" type="email" required /><Field name="phone" label="Phone" required /><Field name="referralCode" label="Referral Code" /><button className="btn btn-primary" type="button">Continue to Paystack</button><p className="muted">The preserved Paystack route remains available; this V2 checkout screen is prepared for service connection.</p></form></Card>
        </div>
      </Section>
    </PublicShell>
  )
}
