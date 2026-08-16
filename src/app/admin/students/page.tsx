import { AdminShell } from '@/components/shell'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'
import { adminStudents } from '@/lib/admin-services'

export default async function AdminStudentsPage() {
  await requireAdmin()
  const students = await adminStudents()
  return <AdminShell title="Students"><DataTable headers={['Student', 'Contact', 'Programme', 'Track', 'Enrollment', 'Payment', 'Joined']} emptyMessage="No student registrations yet." rows={students.map((student: any) => {
    const enrolment = student.enrolments?.[0]
    const payment = enrolment?.payments?.[0]
    return [student.full_name || 'Unnamed student', student.email || student.whatsapp || '-', enrolment?.programmes?.name || '-', enrolment?.programme_tracks?.name || '-', enrolment?.status || 'Not enrolled', payment?.status || 'No payment', student.created_at ? new Date(student.created_at).toLocaleDateString() : '-']
  })} /></AdminShell>
}
