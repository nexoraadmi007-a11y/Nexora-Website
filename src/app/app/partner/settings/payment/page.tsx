import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'

export default function PartnerPaymentSettingsPage() {
  return <AppShell title="Partner Payment Settings"><Card><form className="form-grid"><Field name="bankName" label="Bank Name" /><Field name="accountNumber" label="Account Number" /><Field name="accountName" label="Account Name" /><button className="btn btn-primary" type="button">Submit for verification</button><p className="muted">Bank details will be masked and changes will trigger reverification in the V2 payout service.</p></form></Card></AppShell>
}
