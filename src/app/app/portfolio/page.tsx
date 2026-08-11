import { BriefcaseBusiness, CheckCircle2, FileText, Link2 } from 'lucide-react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { MetricCard, ProgressBar } from '@/components/product'

export default function PortfolioPage() {
  return (
    <AppShell title="My Portfolio">
      <div className="page-grid">
        <div className="metric-grid">
          <MetricCard icon={BriefcaseBusiness} label="Projects" value="0" note="Complete projects to add proof of work." />
          <MetricCard icon={CheckCircle2} label="Verified Skills" value="0" note="Skills are verified after project review." />
          <MetricCard icon={FileText} label="Case Studies" value="0" note="Case studies unlock after submissions." />
          <MetricCard icon={Link2} label="Completion" value="15%" note="Complete your profile to improve this." />
          <MetricCard label="Public Preview" value="Off" note="You choose when to publish." />
        </div>
        <Card>
          <h3>Portfolio Completion</h3>
          <ProgressBar value={15} />
          <p className="muted">Add your profile details, complete a project and upload professional links before publishing a public portfolio.</p>
          <a className="btn btn-primary" href="/app/profile">Complete Your Profile</a>
        </Card>
        <div className="grid-2">
          <Card><h3>Projects</h3><p className="muted">Reviewed project outputs will appear here.</p></Card>
          <Card><h3>Professional Links</h3><p className="muted">Add LinkedIn, CV and relevant portfolio links from your profile.</p></Card>
        </div>
      </div>
    </AppShell>
  )
}
