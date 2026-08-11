import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

const resources = ['Career Resources', 'Income Resources', 'Templates', 'Tools', 'Recordings', 'Guides']

export default function AppResourcesPage() {
  return (
    <AppShell title="Resources">
      <div className="page-grid">
        <Card>
          <h3>Resource Centre</h3>
          <p className="muted">Use these resources to prepare for learning, portfolio building, career positioning and income development.</p>
        </Card>
        <div className="grid-3">{resources.map((resource) => <Card key={resource}><h3>{resource}</h3><p className="muted">Curated materials will be published here by the Nexora team.</p></Card>)}</div>
      </div>
    </AppShell>
  )
}
