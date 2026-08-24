import { AppShell } from '@/components/shell'
import { AssignmentList } from '@/components/assignment-list'
import { studentProjectsAndAssignments } from '@/lib/student-learning'
export const dynamic = 'force-dynamic'
export default async function AssignmentsPage() { const { assignments } = await studentProjectsAndAssignments(); return <AppShell title="Assignments"><AssignmentList assignments={assignments} /></AppShell> }
