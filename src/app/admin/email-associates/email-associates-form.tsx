'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui'

type Recipient = {
  fullName: string
  email: string
  whatsapp: string
  gender: string
  raw?: Record<string, string>
}

type SendResult = {
  email: string
  fullName: string
  ok: boolean
  error?: string
}

const defaultSubject = 'NEXORA Growth Associate Interview Invitation'
const defaultMessage = `Hello {{firstName}},

Thank you for applying to work with NEXORA Institute as a Growth Associate.

We would like to schedule you for an interview. Please use the link below to choose a convenient time:

{{calendlyLink}}

Kindly come prepared to discuss your experience, communication ability, availability, and how you can help NEXORA reach qualified learners and businesses.

Regards,
NEXORA Institute
admin@nexoragroup.ink`

function splitLine(line: string) {
  const separator = line.includes('\t') ? '\t' : ','
  const values: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      quoted = !quoted
    } else if (char === separator && !quoted) {
      values.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim().replace(/^"|"$/g, ''))
  return values
}

function getValue(row: Record<string, string>, names: string[]) {
  const entries = Object.entries(row)
  for (const name of names) {
    const found = entries.find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, '').includes(name))
    if (found?.[1]) return found[1]
  }
  return ''
}

function parseRows(text: string): Recipient[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitLine(lines[0]).map((header) => header.trim() || 'Column')
  return lines.slice(1).map((line) => {
    const cells = splitLine(line)
    const raw = Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']))
    return {
      fullName: getValue(raw, ['fullname', 'name']) || cells[0] || '',
      email: getValue(raw, ['emailaddress', 'email']) || '',
      whatsapp: getValue(raw, ['whatsappnumber', 'whatsapp', 'phone']) || '',
      gender: getValue(raw, ['gender', 'sex']) || '',
      raw,
    }
  }).filter((row) => row.fullName || row.email || row.whatsapp)
}

export function EmailAssociatesForm({ adminEmail }: { adminEmail: string }) {
  const [rawRows, setRawRows] = useState('')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState(defaultMessage)
  const [testEmail, setTestEmail] = useState(adminEmail)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [results, setResults] = useState<SendResult[]>([])

  const validRecipients = useMemo(() => recipients.filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)), [recipients])

  function parseCurrentRows() {
    const parsed = parseRows(rawRows)
    setRecipients(parsed)
    setResults([])
    setNotice(parsed.length ? `${parsed.length} recipient${parsed.length === 1 ? '' : 's'} loaded.` : 'No rows found. Paste the header row and data rows from Google Sheets or Excel.')
  }

  async function handleFile(file: File | null) {
    if (!file) return
    const text = await file.text()
    setRawRows(text)
    const parsed = parseRows(text)
    setRecipients(parsed)
    setResults([])
    setNotice(`${parsed.length} recipient${parsed.length === 1 ? '' : 's'} loaded from ${file.name}.`)
  }

  async function send(mode: 'test' | 'bulk') {
    setLoading(true)
    setNotice('')
    setResults([])
    try {
      const response = await fetch('/api/admin/email-associates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, testEmail, subject, message, recipients: validRecipients }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Email failed.')
      setResults(data.results || [])
      setNotice(mode === 'test'
        ? `Test email sent to ${testEmail}.`
        : `Sent ${data.summary.sent} email${data.summary.sent === 1 ? '' : 's'}; ${data.summary.failed} failed.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Email failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <h2>Load associate list</h2>
        <div className="form-grid">
          <label className="field">
            <span>Upload CSV exported from Google Forms</span>
            <input type="file" accept=".csv,.tsv,.txt" onChange={(event) => handleFile(event.target.files?.[0] || null)} />
          </label>
          <label className="field">
            <span>Or paste rows copied from Excel / Google Sheets</span>
            <textarea rows={8} value={rawRows} onChange={(event) => setRawRows(event.target.value)} placeholder="Full name&#9;Email address&#9;WhatsApp number&#9;Gender" />
          </label>
          <button className="btn btn-secondary" type="button" onClick={parseCurrentRows}>Preview recipients</button>
        </div>
      </Card>

      <Card>
        <h2>Email content</h2>
        <div className="form-grid">
          <label className="field">
            <span>Subject</span>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea rows={11} value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <p className="muted">Supported fields: {'{{name}}'}, {'{{firstName}}'}, {'{{email}}'}, {'{{whatsapp}}'}, {'{{gender}}'}, {'{{calendlyLink}}'}.</p>
          <label className="field">
            <span>Test email address</span>
            <input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} />
          </label>
          <div className="card-actions">
            <button className="btn btn-secondary" type="button" disabled={loading} onClick={() => send('test')}>{loading ? 'Sending...' : 'Send Test Email'}</button>
            <button className="btn btn-primary" type="button" disabled={loading || validRecipients.length === 0} onClick={() => send('bulk')}>{loading ? 'Sending...' : `Send to ${validRecipients.length} Associates`}</button>
          </div>
          {notice ? <p className={`form-message ${notice.toLowerCase().includes('failed') || notice.toLowerCase().includes('no rows') ? 'error' : 'success'}`}>{notice}</p> : null}
        </div>
      </Card>

      <Card>
        <h2>Recipient preview</h2>
        <p className="muted">Loaded: {recipients.length}. Valid emails: {validRecipients.length}.</p>
        <div className="responsive-table">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>WhatsApp</th><th>Gender</th><th>Status</th></tr></thead>
            <tbody>
              {recipients.map((item, index) => {
                const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)
                const result = results.find((row) => row.email === item.email)
                return <tr key={`${item.email}-${index}`}><td>{item.fullName || '—'}</td><td>{item.email || '—'}</td><td>{item.whatsapp || '—'}</td><td>{item.gender || '—'}</td><td>{result ? (result.ok ? 'Sent' : result.error || 'Failed') : valid ? 'Ready' : 'Invalid email'}</td></tr>
              })}
              {!recipients.length ? <tr><td colSpan={5}>No recipients loaded yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
