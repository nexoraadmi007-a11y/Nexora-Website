import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function AppHomePage() {
  return (
    <AppShell title="What should I do next?">
      <div className="grid-3">
        <Card><h3>Learning Progress</h3><EmptyState title="No active enrolment yet.">After verified payment, your programme progress and current module will appear here.</EmptyState></Card>
        <Card><h3>Next Live Class</h3><EmptyState title="No class scheduled.">Your next class appears after your cohort and track are confirmed.</EmptyState></Card>
        <Card><h3>Readiness</h3><EmptyState title="Readiness not calculated yet.">Income and opportunity readiness will be based on profile, projects, portfolio and completion.</EmptyState></Card>
      </div>
    </AppShell>
  )
}
