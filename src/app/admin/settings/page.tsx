import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'

export default function AdminSettingsPage() {
  return <AdminShell title="Settings"><div className="grid-2">{['Feature Flags', 'Integrations', 'Programme Source', 'Access Policies'].map((section) => <Card key={section}><h3>{section}</h3><p className="muted">Review and manage {section.toLowerCase()}.</p><button className="btn btn-secondary" type="button">Open</button></Card>)}</div></AdminShell>
}
