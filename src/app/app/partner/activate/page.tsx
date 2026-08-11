import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'
import { ChecklistItem } from '@/components/product'

export default function PartnerActivatePage() {
  return (
    <AppShell title="Activate Partner Profile">
      <div className="dashboard-grid">
        <Card>
          <form className="form-grid">
            <h3>Step 1: Personal Information</h3>
            <div className="grid-2"><Field name="name" label="Full Name" /><Field name="whatsapp" label="WhatsApp Number" /><Field name="email" label="Email" type="email" /><Field name="location" label="Location" /></div>
            <h3>Step 2: Payment Details</h3>
            <div className="grid-2"><Field name="bank" label="Bank Name" /><Field name="accountName" label="Account Name" /><Field name="accountNumber" label="Account Number" /></div>
            <h3>Step 3: Partner Agreement</h3>
            <label className="field"><span>Agreement</span><textarea name="agreement" placeholder="I understand that commissions are paid only after verified enrolments." /></label>
            <button className="btn btn-primary" type="button">Submit Activation</button>
          </form>
        </Card>
        <Card>
          <h3>Activation Steps</h3>
          <ul className="checklist">
            <ChecklistItem done>Open activation form</ChecklistItem>
            <ChecklistItem>Complete personal information</ChecklistItem>
            <ChecklistItem>Add payment details</ChecklistItem>
            <ChecklistItem>Accept agreement</ChecklistItem>
            <ChecklistItem>Receive referral code</ChecklistItem>
          </ul>
        </Card>
      </div>
    </AppShell>
  )
}
