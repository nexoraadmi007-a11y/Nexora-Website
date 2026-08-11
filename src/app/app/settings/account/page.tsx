'use client'
import { FormEvent, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'

export default function AccountSettingsPage() {
  const [saved, setSaved] = useState(false)
  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaved(true); window.setTimeout(() => setSaved(false), 1800) }
  return <AppShell title="Account Settings"><Card><form className="form-grid" onSubmit={save}><div className="grid-2"><Field name="name" label="Name" /><Field name="phone" label="Phone" /><Field name="location" label="Location" /><Field name="language" label="Language" /><Field name="timezone" label="Timezone" /></div>{saved ? <p className="form-message success">Account settings saved.</p> : null}<button className="btn btn-primary" type="submit">Save Changes</button></form></Card></AppShell>
}
