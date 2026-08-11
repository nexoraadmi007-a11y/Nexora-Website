'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'
import { DataTable, MetricCard } from '@/components/product'
import { canRequestPayout, payoutPolicy } from '@/lib/product-rules'

export default function PartnerEarningsPage() {
  const approvedBalance = 0
  const [bank, setBank] = useState<{ bank?: string; accountNumber?: string; status?: string } | null>(null)
  const [requestOpen, setRequestOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    setBank(JSON.parse(window.localStorage.getItem('nexora_partner_bank') || 'null'))
    setRequested(window.localStorage.getItem('nexora_payout_requested') === 'true')
  }, [])

  function requestPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const amount = Number(formData.get('amount') || 0)
    if (requested) {
      setMessage('A payout request already exists for the available balance.')
      return
    }
    const result = canRequestPayout({ approvedBalance, requestedAmount: amount, hasVerifiedBank: Boolean(bank?.status === 'VERIFIED' || bank?.status === 'POSSIBLE_MATCH') })
    setMessage(result.message)
    if (result.ok) {
      window.localStorage.setItem('nexora_payout_requested', 'true')
      setRequested(true)
    }
  }

  return (
    <AppShell title="Earnings">
      <div className="page-grid">
        <div className="metric-grid">
          <MetricCard label="Estimated Earnings" value="NGN 0" note="From pending verified events." />
          <MetricCard label="Approved" value={`NGN ${approvedBalance.toLocaleString()}`} note="Approved for next payout." />
          <MetricCard label="Pending" value="NGN 0" note="Awaiting verification." />
          <MetricCard label="Lifetime Paid" value="NGN 0" note="Total payout history." />
          <MetricCard label="Next Payout" value={`${payoutPolicy.payoutDay} Aug 2026`} note={`Request deadline: ${payoutPolicy.requestCutoffDay} Aug, ${payoutPolicy.requestCutoffTime}`} />
        </div>
        <Card>
          <h3>Request Payout</h3>
          <p className="muted">You may request payout only from approved available earnings.</p>
          <button className="btn btn-primary" type="button" onClick={() => setRequestOpen(true)}>Request Payout</button>
          {requestOpen ? (
            <form className="form-grid" onSubmit={requestPayout}>
              <p>Approved Balance: NGN {approvedBalance.toLocaleString()}</p>
              <p>Bank: {bank?.bank || 'No verified bank account'}</p>
              <p>Account: {bank?.accountNumber || '-'}</p>
              <Field name="amount" label="Requested Amount" type="number" />
              {message ? <p className={`form-message ${requested ? 'success' : 'error'}`}>{message}</p> : null}
              <button className="btn btn-secondary" type="submit">Confirm Payout Request</button>
            </form>
          ) : null}
        </Card>
        <Card><h3>Wallet Ledger</h3><DataTable headers={['Date', 'Description', 'Source', 'Amount', 'Status']} rows={[['-', 'No ledger entry yet', '-', 'NGN 0', 'Pending activity']]} /></Card>
        <Card><h3>Payout History</h3><DataTable headers={['Requested', 'Approved', 'Paid', 'Date', 'Reference']} rows={[requested ? ['NGN 0', 'NGN 0', 'NGN 0', 'Awaiting review', 'Preview request'] : ['-', '-', '-', '-', '-']]} /></Card>
      </div>
    </AppShell>
  )
}
