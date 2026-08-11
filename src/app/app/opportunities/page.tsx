import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

export default function AppOpportunitiesPage() {
  return (
    <AppShell title="Opportunities">
      <div className="page-grid">
        <div className="tabs"><span>Recommended</span><span>All Opportunities</span><span>Applications</span><span>Saved</span></div>
        <div className="tag-row"><span>Internship</span><span>Junior Role</span><span>Freelance</span><span>AI Data Project</span><span>Remote</span></div>
        <Card>
          <h3>Verified opportunities will appear as they become available.</h3>
          <p className="muted">Improve your opportunity readiness while you wait by completing your profile, learning path and portfolio projects.</p>
          <div className="card-actions"><a className="btn btn-primary" href="/app/profile">Build My Profile</a><a className="btn btn-secondary" href="/app/portfolio">Open Portfolio</a></div>
        </Card>
      </div>
    </AppShell>
  )
}
