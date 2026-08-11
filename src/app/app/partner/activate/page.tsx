'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'
import { ChecklistItem } from '@/components/product'

export default function PartnerActivatePage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedEarnings, setAcceptedEarnings] = useState(false)
  const [message, setMessage] = useState('')

  function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!acceptedTerms || !acceptedEarnings) {
      setMessage('Please accept the required partner acknowledgements before activation.')
      return
    }
    window.localStorage.setItem('nexora_partner_status', 'ACTIVE')
    setMessage('Partner profile activated. Your referral tools are now ready in preview.')
  }

  return (
    <AppShell title="Activate Partner Profile">
      <div className="page-grid">
        <Card>
          <div className="tabs"><span>1 Personal Details</span><span>2 Payment Details</span><span>3 Agreement</span><span>4 Complete</span></div>
        </Card>
        <div className="dashboard-grid">
          <Card>
            <form className="form-grid" onSubmit={activate}>
              <h3>Personal Details</h3>
              <div className="grid-2"><Field name="name" label="Full Name" /><Field name="whatsapp" label="WhatsApp Number" /><Field name="email" label="Email" type="email" /><Field name="location" label="Location" /></div>
              <h3>Payment Details</h3>
              <div className="grid-2"><Field name="bank" label="Bank Name" /><Field name="accountNumber" label="Account Number" /></div>
              <h3>Agreement</h3>
              <label className="learning-step current"><input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" /> <span>I have read and agree to the <Link href="/legal/partner-terms">Nexora Partner Terms & Conditions</Link>.</span><small>Required</small></label>
              <label className="learning-step current"><input checked={acceptedEarnings} onChange={(event) => setAcceptedEarnings(event.target.checked)} type="checkbox" /> <span>I understand that partner earnings are based on verified sales and are not guaranteed.</span><small>Required</small></label>
              {message ? <p className={`form-message ${acceptedTerms && acceptedEarnings ? 'success' : 'error'}`}>{message}</p> : null}
              <button className="btn btn-primary" type="submit">Submit Activation</button>
            </form>
          </Card>
          <Card>
            <h3>Activation Progress</h3>
            <ul className="checklist">
              <ChecklistItem done>Open activation form</ChecklistItem>
              <ChecklistItem>Complete personal information</ChecklistItem>
              <ChecklistItem>Add payment details</ChecklistItem>
              <ChecklistItem done={acceptedTerms && acceptedEarnings}>Accept agreement</ChecklistItem>
              <ChecklistItem>Receive referral code</ChecklistItem>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
