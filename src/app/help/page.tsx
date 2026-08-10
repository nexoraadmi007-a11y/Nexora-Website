import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'

const categories = ['Account', 'Payment', 'Programme', 'Class', 'Project', 'Opportunity', 'Partner', 'Payout']

export default function HelpPage() {
  return (
    <PublicShell>
      <Section eyebrow="Help" title="Get support without forcing every issue into Telegram.">
        <div className="grid-2">
          <Card><h3>Support categories</h3><ul className="list">{categories.map((item) => <li key={item}>{item}</li>)}</ul></Card>
          <Card><form className="form-grid"><Field name="name" label="Name" required /><Field name="email" label="Email" type="email" required /><label className="field"><span>Category</span><select name="category">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Message</span><textarea name="message" /></label><button className="btn btn-primary" type="button">Submit ticket</button></form></Card>
        </div>
      </Section>
    </PublicShell>
  )
}
