'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'

const categories = ['Account', 'Payment', 'Programme', 'Class', 'Project', 'Opportunity', 'Partner', 'Payout', 'Technical Issue', 'Other']

export default function HelpPage() {
  const [category, setCategory] = useState('Account')
  const [ticket, setTicket] = useState('')

  function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const id = `NX-SUP-${Math.floor(10000 + Math.random() * 89999)}`
    const record = {
      id,
      category,
      subject: String(formData.get('subject') || 'Support request'),
      created: new Date().toISOString(),
      status: 'OPEN',
      lastUpdate: 'Submitted',
    }
    const existing = JSON.parse(window.localStorage.getItem('nexora_support_tickets') || '[]')
    window.localStorage.setItem('nexora_support_tickets', JSON.stringify([record, ...existing]))
    setTicket(id)
    event.currentTarget.reset()
  }

  return (
    <PublicShell>
      <Section eyebrow="Help" title="Get Support">
        <p className="lead">Tell us what you need help with and we'll route your request to the right team.</p>
        <div className="grid-2">
          <Card>
            <h3>Support categories</h3>
            <div className="grid-2">
              {categories.map((item) => (
                <button key={item} className={`click-card ${category === item ? 'active' : ''}`} type="button" onClick={() => setCategory(item)}>
                  <strong>{item}</strong>
                  <span className="muted">{item === 'Payment' ? 'Receipts, failed payments and verification.' : item === 'Payout' ? 'Partner earnings and payout requests.' : 'Get the right support path.'}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <form className="form-grid" onSubmit={submitTicket}>
              <Field name="name" label="Name" required />
              <Field name="email" label="Email" type="email" required />
              <label className="field"><span>Category</span><select name="category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <Field name="subject" label="Subject" required />
              <label className="field"><span>Message</span><textarea name="message" required /></label>
              <label className="field"><span>Attachment</span><input name="attachment" type="file" /></label>
              {ticket ? <p className="form-message success">Support request submitted. Ticket: {ticket}. We'll notify you when there's an update.</p> : null}
              <button className="btn btn-primary" type="submit">Submit Request</button>
              <Link href="/app/help/tickets">View my tickets</Link>
            </form>
          </Card>
        </div>
      </Section>
    </PublicShell>
  )
}
