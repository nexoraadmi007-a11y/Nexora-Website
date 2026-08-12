'use client'

import { FormEvent, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { findProgramme, formatNaira } from '@/config/programmes'

export default function PartnerCopilotPage() {
  const [reply, setReply] = useState('')
  const [action, setAction] = useState('')

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const message = String(formData.get('message') || '').toLowerCase()
    const career = findProgramme('ai-income-accelerator')
    const business = findProgramme('business-transformation')
    if (message.includes('business') || message.includes('customer') || message.includes('sales')) {
      setReply(`The Business Transformation Programme helps owner-led businesses improve customer management, marketing, sales follow-up and simple automation. The programme fee is ${formatNaira(business?.priceNgn || 25000)}.`)
      setAction('Ask what part of the business is most urgent: customer follow-up, sales, digital presence or automation.')
    } else {
      setReply(`The AI Income Accelerator helps learners choose one practical AI-powered skill track, build proof of work and prepare a path from skill to income. The programme fee is ${formatNaira(career?.priceNgn || 10000)}.`)
      setAction('Ask which track they prefer: Content & Digital Marketing, UI/UX, Financial & Business Analysis, or Automation & No-Code.')
    }
  }

  return (
    <AppShell title="Growth Copilot">
      <div className="dashboard-grid">
        <Card>
          <form className="form-grid" onSubmit={generate}>
            <label className="field"><span>Prospect Message</span><textarea name="message" placeholder="Paste the prospect's message or describe the situation." required /></label>
            <button className="btn btn-primary" type="submit">Get Suggested Reply</button>
          </form>
        </Card>
        <Card>
          <h3>Reply to Send</h3>
          <p className="muted">{reply || 'A suggested reply will appear here.'}</p>
          <h3>Next Best Action</h3>
          <p className="muted">{action || 'The next action will appear after you generate a reply.'}</p>
        </Card>
      </div>
    </AppShell>
  )
}
