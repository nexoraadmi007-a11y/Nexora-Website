import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

const sections = ['Account', 'Password & Security', 'Notifications', 'Privacy', 'Partner Payment Details']

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="grid-2">
        {sections.map((section) => <Card key={section}><h3>{section}</h3><p className="muted">Manage {section.toLowerCase()} preferences from this workspace.</p><button className="btn btn-secondary" type="button">Open</button></Card>)}
      </div>
    </AppShell>
  )
}
