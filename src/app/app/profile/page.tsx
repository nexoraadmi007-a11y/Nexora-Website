'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'
import { ChecklistItem, ProgressBar } from '@/components/product'
import { programmes } from '@/config/programmes'

const storageKey = 'nexora_profile'

export default function ProfilePage() {
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<Record<string, string>>({})
  const [cvName, setCvName] = useState('')

  useEffect(() => {
    setProfile(JSON.parse(window.localStorage.getItem(storageKey) || '{}'))
  }, [])

  const checks = useMemo(() => [
    ['Name', profile.firstName || profile.lastName],
    ['Email', profile.email],
    ['Phone', profile.whatsapp],
    ['Location', profile.country || profile.state || profile.city],
    ['LinkedIn', profile.linkedin],
    ['CV', cvName || profile.cvUrl],
    ['Availability', profile.availability],
  ], [profile, cvName])
  const completion = Math.round((checks.filter(([, value]) => Boolean(value)).length / checks.length) * 100)

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const next = Object.fromEntries(Array.from(formData.entries()).filter(([, value]) => typeof value === 'string')) as Record<string, string>
    next.cvFileName = cvName
    window.localStorage.setItem(storageKey, JSON.stringify(next))
    setProfile(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <AppShell title="Profile">
      <div className="page-grid">
        <Card>
          <div className="split-card">
            <div>
              <span className="avatar">{(profile.firstName?.[0] || 'N')}{(profile.lastName?.[0] || 'I')}</span>
              <h3>{profile.firstName || profile.lastName ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 'Your Nexora Profile'}</h3>
              <p className="muted">{profile.goal || 'Add your professional headline and goal.'}</p>
              <p className="price">{completion}%</p>
              <ProgressBar value={completion} />
            </div>
            <div>
              <h3>Profile Completion</h3>
              <ul className="checklist">{checks.map(([label, value]) => <ChecklistItem key={label} done={Boolean(value)}>{label}</ChecklistItem>)}</ul>
            </div>
          </div>
        </Card>

        <Card>
          <form className="form-grid" onSubmit={saveProfile}>
            <h3>Personal Information</h3>
            <div className="grid-2">
              <Field name="firstName" label="First Name" />
              <Field name="lastName" label="Last Name" />
              <Field name="email" label="Email" type="email" />
              <Field name="whatsapp" label="Phone / WhatsApp" />
              <Field name="country" label="Country" />
              <Field name="state" label="State" />
              <Field name="city" label="City" />
            </div>
            <h3>Career Information</h3>
            <div className="grid-2">
              <Field name="goal" label="Professional Goal" />
              <label className="field"><span>Current Programme</span><select name="programme" defaultValue={profile.programme || ''}><option value="">Not selected</option>{programmes.map((programme) => <option key={programme.code} value={programme.slug}>{programme.name}</option>)}</select></label>
              <label className="field"><span>Track</span><select name="track" defaultValue={profile.track || ''}><option value="">Not selected</option>{programmes[0].tracks.map((track) => <option key={track.code} value={track.slug}>{track.name}</option>)}</select></label>
              <Field name="educationStatus" label="Education Status" />
              <Field name="linkedin" label="LinkedIn URL" />
              <Field name="cvUrl" label="CV URL" />
              <label className="field"><span>Upload CV</span><input accept=".pdf,.doc,.docx" type="file" onChange={(event) => setCvName(event.target.files?.[0]?.name || '')} /></label>
              <Field name="availability" label="Availability" />
            </div>
            {saved ? <p className="form-message success">Profile updated successfully.</p> : null}
            <button className="btn btn-primary" type="submit">{saved ? 'Saved' : 'Save Changes'}</button>
          </form>
        </Card>
      </div>
    </AppShell>
  )
}
