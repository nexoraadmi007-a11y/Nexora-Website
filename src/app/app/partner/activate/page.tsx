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
  const [loading, setLoading] = useState(false)
  const [identity, setIdentity] = useState<{ partnerId: string; referralCode: string; referralUrl: string } | null>(null)

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (!acceptedTerms || !acceptedEarnings) {
      setMessage('Please accept the required partner acknowledgements before activation.')
      return
    }
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const response = await fetch('/api/partner/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.get('name'),
        whatsapp: formData.get('whatsapp'),
        email: formData.get('email'),
        location: formData.get('location'),
        bankName: formData.get('bank'),
        accountNumber: formData.get('accountNumber'),
      }),
    })
    const result = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok) {
      setMessage(result.error || 'Partner activation could not be completed.')
      return
    }
    window.localStorage.setItem('nexora_partner_email', String(formData.get('email') || '').toLowerCase())
    window.localStorage.setItem('nexora_partner_referral_code', result.partner.referralCode)
    setIdentity({
      partnerId: result.partner.partnerId,
      referralCode: result.partner.referralCode,
      referralUrl: result.partner.referralUrl,
    })
    setMessage('Partner profile activated. Your permanent referral identity is ready.')
  }

  return (
    <AppShell title="Activate Partner Profile">
      <div className="page-grid">
        <Card>
          <div className="tabs"><span>1 Personal Details</span><span>2 Payment Details</span><span>3 Agreement</span><span>4 Referral Ready</span></div>
        </Card>
        <div className="dashboard-grid">
          <Card>
            <form className="form-grid" onSubmit={activate}>
              <h3>Personal Details</h3>
              <div className="grid-2"><Field name="name" label="Full Name" required /><Field name="whatsapp" label="WhatsApp Number" required /><Field name="email" label="Email" type="email" required /><Field name="location" label="Location" /></div>
              <h3>Payment Details</h3>
              <div className="grid-2"><Field name="bank" label="Bank Name" /><Field name="accountNumber" label="Account Number" /></div>
              <h3>Agreement</h3>
              <label className="learning-step current"><input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" /> <span>I have read and agree to the <Link href="/legal/partner-terms">Nexora Partner Terms & Conditions</Link>.</span><small>Required</small></label>
              <label className="learning-step current"><input checked={acceptedEarnings} onChange={(event) => setAcceptedEarnings(event.target.checked)} type="checkbox" /> <span>I understand that partner earnings are based on verified sales and are not guaranteed.</span><small>Required</small></label>
              {message ? <p className={`form-message ${identity ? 'success' : 'error'}`}>{message}</p> : null}
              {identity ? (
                <div className="list">
                  <p>Partner ID: <strong>{identity.partnerId}</strong></p>
                  <p>Referral Code: <strong>{identity.referralCode}</strong></p>
                  <code>{identity.referralUrl}</code>
                </div>
              ) : null}
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Activating...' : 'Submit Activation'}</button>
              {identity ? <Link className="btn btn-secondary" href="/app/partner">Open Partner Dashboard</Link> : null}
            </form>
          </Card>
          <Card>
            <h3>Activation Progress</h3>
            <ul className="checklist">
              <ChecklistItem done>Open activation form</ChecklistItem>
              <ChecklistItem done={Boolean(identity)}>Complete personal information</ChecklistItem>
              <ChecklistItem done={Boolean(identity)}>Accept agreement</ChecklistItem>
              <ChecklistItem done={Boolean(identity)}>Receive referral code</ChecklistItem>
              <ChecklistItem done={Boolean(identity)}>Referral link ready</ChecklistItem>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
