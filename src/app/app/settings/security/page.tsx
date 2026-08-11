'use client'
import { FormEvent, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'

export default function SecuritySettingsPage() {
  const [saved, setSaved] = useState(false)
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaved(true); window.setTimeout(() => setSaved(false), 1800) }
  return <AppShell title="Password & Security"><div className="page-grid"><Card><form className="form-grid" onSubmit={save}><Field name="current" label="Current Password" type="password" /><Field name="new" label="New Password" type="password" /><Field name="confirm" label="Confirm New Password" type="password" />{saved ? <p className="form-message success">Password update request saved.</p> : null}<button className="btn btn-primary" type="submit">Update Password</button></form></Card><Card><h3>Active Sessions</h3><p className="muted">Current browser session. Last login: preview session.</p></Card></div></AppShell>
}
