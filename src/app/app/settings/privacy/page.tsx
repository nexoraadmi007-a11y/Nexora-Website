'use client'
import { useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

const controls = ['Talent profile visibility', 'Public portfolio visibility', 'Employer discoverability', 'Partner profile visibility', 'Marketing communications']
export default function PrivacySettingsPage() {
  const [saved, setSaved] = useState(false)
  return <AppShell title="Privacy"><Card><div className="page-grid">{controls.map((item) => <label className="learning-step" key={item}><input type="checkbox" /> <span>{item}</span><small>Private</small></label>)}{saved ? <p className="form-message success">Privacy settings saved.</p> : null}<button className="btn btn-primary" type="button" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800) }}>Save Privacy Settings</button></div></Card></AppShell>
}
