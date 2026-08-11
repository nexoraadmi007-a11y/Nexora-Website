import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'

export default function ProfilePage() {
  return (
    <AppShell title="Profile">
      <Card>
        <form className="form-grid">
          <div className="split-card">
            <div>
              <span className="avatar">NI</span>
              <h3>Personal Profile</h3>
              <p className="muted">This helps Nexora recommend programmes, projects and opportunities.</p>
            </div>
            <div className="grid-2">
              <Field name="name" label="Name" />
              <Field name="email" label="Email" type="email" />
              <Field name="whatsapp" label="WhatsApp Number" />
              <Field name="location" label="Location" />
              <Field name="goal" label="Professional Goal" />
              <Field name="programme" label="Current Programme" />
              <Field name="track" label="Track" />
              <Field name="linkedin" label="LinkedIn" />
              <Field name="cv" label="CV Link" />
              <Field name="availability" label="Availability" />
            </div>
          </div>
          <button className="btn btn-primary" type="button">Save profile</button>
        </form>
      </Card>
    </AppShell>
  )
}
