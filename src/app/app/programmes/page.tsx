import { AppShell } from '@/components/shell'
import { ProgrammeCard } from '@/components/product'
import { Card } from '@/components/ui'
import { programmes } from '@/config/programmes'

export default function AppProgrammesPage() {
  return (
    <AppShell title="My Courses">
      <div className="page-grid">
        <Card>
          <p className="eyebrow">Course Catalogue</p>
          <h3>Choose one or more practical AI courses.</h3>
          <p className="muted">Each course costs ₦10,000 and has its own enrolment, classes and assignments.</p>
        </Card>
        <div className="grid-2">
          {programmes.map((programme) => <ProgrammeCard key={programme.code} programme={programme} />)}
        </div>
      </div>
    </AppShell>
  )
}
