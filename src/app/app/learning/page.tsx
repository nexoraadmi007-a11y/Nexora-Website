import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { LearningStep, ProgrammeCard } from '@/components/product'
import { programmes } from '@/config/programmes'

export default function LearningPage() {
  return (
    <AppShell title="Learning">
      <div className="page-grid">
        <Card>
          <h3>You haven't joined a programme yet.</h3>
          <p className="muted">Choose one AI Income Accelerator track or the Business Transformation Programme. Your modules, classes and assignments will appear here after enrolment.</p>
          <a className="btn btn-primary" href="/app/programmes">Explore Programmes</a>
        </Card>
        <div className="grid-2">
          {programmes.map((programme) => <ProgrammeCard key={programme.code} programme={programme} />)}
        </div>
        <Card>
          <h3>Learning Path Preview</h3>
          <ul className="learning-path">
            <LearningStep label="Foundations" state="current" />
            <LearningStep label="Core lessons and practice" state="locked" />
            <LearningStep label="Live class assignment" state="locked" />
            <LearningStep label="Portfolio project" state="locked" />
            <LearningStep label="Income pathway" state="locked" />
          </ul>
        </Card>
      </div>
    </AppShell>
  )
}
