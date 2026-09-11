import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { requireAdmin } from '@/lib/admin-auth'
import { EmailAssociatesForm } from './email-associates-form'

export const dynamic = 'force-dynamic'

export default async function EmailAssociatesPage() {
  const admin = await requireAdmin(['SUPER_ADMIN', 'ADMIN', 'TALENT_ADMIN', 'SUPPORT_ADMIN'])
  return (
    <AdminShell title="Email Associates">
      <div className="page-grid">
        <Card>
          <h2>Interview email sender</h2>
          <p className="muted">Paste rows copied from Google Sheets or Excel, preview the recipients, send a test to yourself, then send the interview email. Expected columns include name, email, WhatsApp and gender.</p>
        </Card>
        <EmailAssociatesForm adminEmail={admin.user.email} />
      </div>
    </AdminShell>
  )
}
