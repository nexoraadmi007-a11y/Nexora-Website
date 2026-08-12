'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'

type Bank = { name: string; code: string }

function savedPartnerEmail() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('nexora_partner_email') || ''
}

export default function PartnerPaymentDetailsPage() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankCode, setBankCode] = useState('')
  const [accountName, setAccountName] = useState('')
  const [status, setStatus] = useState('Not submitted')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/paystack/banks')
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.message || 'Could not load banks.')
        const nextBanks = body.banks || []
        setBanks(nextBanks)
        setBankCode(nextBanks[0]?.code || '')
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load banks.'))
  }, [])

  async function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const profileName = String(formData.get('profileName') || '')
    const accountNumber = String(formData.get('accountNumber') || '').replace(/\D/g, '')
    const selectedBank = banks.find((item) => item.code === bankCode)
    if (accountNumber.length < 10) {
      setMessage('Enter a valid 10-digit account number.')
      setStatus('MANUAL_REVIEW')
      return
    }
    if (!selectedBank) {
      setMessage('Select a bank.')
      setStatus('MANUAL_REVIEW')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/partner/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileName,
          email: savedPartnerEmail(),
          bankName: selectedBank.name,
          bankCode: selectedBank.code,
          accountNumber,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) throw new Error(result.message || 'Bank verification failed.')
      setAccountName(result.bank.accountName)
      setStatus(result.bank.verificationStatus)
      window.localStorage.setItem('nexora_partner_bank', JSON.stringify({
        bank: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: `******${accountNumber.slice(-4)}`,
        accountName: result.bank.accountName,
        status: result.bank.verificationStatus,
        score: result.bank.nameMatchScore,
      }))
      setMessage(result.message || 'Bank details saved for payout review.')
    } catch (error) {
      setStatus('MANUAL_REVIEW')
      setMessage(error instanceof Error ? error.message : 'Bank verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="Partner Payment Details">
      <Card>
        <form className="form-grid" onSubmit={resolve}>
          <div className="grid-2">
            <Field name="profileName" label="Registered/Profile Name" />
            <label className="field"><span>Bank</span><select value={bankCode} onChange={(event) => setBankCode(event.target.value)}>{banks.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
            <Field name="accountNumber" label="Account Number" />
            <label className="field"><span>Account Name</span><input readOnly value={accountName} placeholder="Resolve account to display name" /></label>
          </div>
          <p className={`status-pill ${status === 'VERIFIED' || status === 'POSSIBLE_MATCH' ? 'success' : status === 'MISMATCH' ? 'danger' : 'warning'}`}>Verification Status: {status}</p>
          {message ? <p className={`form-message ${status === 'MISMATCH' ? 'error' : 'success'}`}>{message}</p> : null}
          <div className="card-actions"><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Resolve & Save Bank Account'}</button><button className="btn btn-secondary" type="button" onClick={() => { setAccountName(''); setStatus('Not submitted'); setMessage('') }}>Update Bank Account</button></div>
        </form>
      </Card>
    </AppShell>
  )
}
