'use client'
import { useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

const preferences = ['Class Reminders', 'Assignment Reminders', 'Programme Updates', 'Payment Updates', 'Partner Updates', 'Payout Updates', 'Opportunity Alerts', 'Product Announcements']
export default function NotificationSettingsPage() {
  const [saved, setSaved] = useState(false)
  return <AppShell title="Notification Settings"><Card><div className="page-grid">{preferences.map((item) => <label className="learning-step current" key={item}><input type="checkbox" defaultChecked /> <span>{item}</span><small>In-App</small></label>)}{saved ? <p className="form-message success">Notification preferences saved.</p> : null}<button className="btn btn-primary" type="button" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800) }}>Save Preferences</button></div></Card></AppShell>
}
