import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'

export default function PartnerPaymentDetailsPage() {
  return (
    <AppShell title="Partner Payment Details">
      <Card>
        <form className="form-grid">
          <div className="grid-2"><Field name="bank" label="Bank Name" /><Field name="accountName" label="Account Name" /><Field name="accountNumber" label="Masked Account Number" /></div>
          <p className="muted">Verification status: Not submitted.</p>
          <div className="card-actions"><button className="btn btn-primary" type="button">Add Bank Account</button><button className="btn btn-secondary" type="button">Update Bank Account</button></div>
        </form>
      </Card>
    </AppShell>
  )
}
