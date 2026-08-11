import { AppShell } from '@/components/shell'
import { ProgrammeCard } from '@/components/product'
import { Card } from '@/components/ui'
import { programmes } from '@/config/programmes'

export default function AppProgrammesPage() {
  return (
    <AppShell title="Explore Programmes">
      <div className="page-grid">
        <Card>
          <p className="eyebrow">Programme Discovery</p>
          <h3>Choose the pathway that matches what you want to build.</h3>
          <p className="muted">Career learners can choose one AI Income Accelerator track. Business owners should use the Business Transformation Programme.</p>
        </Card>
        <div className="grid-2">
          {programmes.map((programme) => <ProgrammeCard key={programme.code} programme={programme} />)}
        </div>
      </div>
    </AppShell>
  )
}
