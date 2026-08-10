import { AppShell } from '@/components/shell'
import { Card, EmptyState } from '@/components/ui'

export default function LearningPage() {
  return <AppShell title="Learning"><Card><EmptyState title="Modules unlock after enrolment.">V2 learning will show curriculum, lessons, live-class status, assignments and project completion.</EmptyState></Card></AppShell>
}
