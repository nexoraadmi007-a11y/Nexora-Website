'use client'

import { FormEvent, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'
import { compareAccountName } from '@/lib/product-rules'

const banks = ['Access Bank', 'First Bank', 'GTBank', 'Kuda Bank', 'Moniepoint', 'OPay', 'PalmPay', 'UBA', 'Wema Bank', 'Zenith Bank']

export default function PartnerPaymentDetailsPage() {
  const [bank, setBank] = useState('Access Bank')
  const [accountName, setAccountName] = useState('')
  const [status, setStatus] = useState('Not submitted')
  const [message, setMessage] = useState('')

  function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const profileName = String(formData.get('profileName') || '')
    const accountNumber = String(formData.get('accountNumber') || '')
    if (accountNumber.length < 10) {
      setMessage('Enter a valid 10-digit account number.')
      setStatus('MANUAL_REVIEW')
      return
    }
    const resolved = profileName || 'NEXORA PARTNER'
    const match = compareAccountName(profileName, resolved)
    setAccountName(resolved.toUpperCase())
    setStatus(match)
    window.localStorage.setItem('nexora_partner_bank', JSON.stringify({ bank, accountNumber: `******${accountNumber.slice(-4)}`, accountName: resolved.toUpperCase(), status: match }))
    setMessage(match === 'MISMATCH' ? 'The account name appears different from your registered name. Please review your details or contact support.' : 'Bank details saved for payout review.')
  }

  return (
    <AppShell title="Partner Payment Details">
      <Card>
        <form className="form-grid" onSubmit={resolve}>
          <div className="grid-2">
            <Field name="profileName" label="Registered/Profile Name" />
            <label className="field"><span>Bank</span><select value={bank} onChange={(event) => setBank(event.target.value)}>{banks.map((item) => <option key={item}>{item}</option>)}</select></label>
            <Field name="accountNumber" label="Account Number" />
            <label className="field"><span>Account Name</span><input readOnly value={accountName} placeholder="Resolve account to display name" /></label>
          </div>
          <p className={`status-pill ${status === 'VERIFIED' || status === 'POSSIBLE_MATCH' ? 'success' : status === 'MISMATCH' ? 'danger' : 'warning'}`}>Verification Status: {status}</p>
          {message ? <p className={`form-message ${status === 'MISMATCH' ? 'error' : 'success'}`}>{message}</p> : null}
          <div className="card-actions"><button className="btn btn-primary" type="submit">Resolve & Save Bank Account</button><button className="btn btn-secondary" type="button" onClick={() => { setAccountName(''); setStatus('Not submitted'); setMessage('') }}>Update Bank Account</button></div>
        </form>
      </Card>
    </AppShell>
  )
}
