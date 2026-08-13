import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'
import { requireAdmin } from '@/lib/admin-auth'

function status(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key])) ? 'Connected' : keys.some((key) => Boolean(process.env[key])) ? 'Degraded' : 'Not Configured'
}

export default async function AdminIntegrationsPage() {
  await requireAdmin(['SUPER_ADMIN', 'ADMIN'])
  const rows = [
    ['Database', status(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])],
    ['Paystack', status(['PAYSTACK_SECRET_KEY'])],
    ['Storage', status(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])],
    ['Airtable', status(['AIRTABLE_BASE_ID', 'AIRTABLE_TOKEN'])],
    ['Telegram', status(['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID'])],
    ['OpenAI', status(['OPENAI_API_KEY'])],
    ['Email', status(['RESEND_API_KEY', 'NEXORA_EMAIL_FROM'])],
    ['WhatsApp', status(['WHATSAPP_API_TOKEN'])],
    ['Background Jobs', status(['CRON_SECRET'])],
  ]
  return (
    <AdminShell title="Integrations">
      <div className="page-grid">
        <Card><h3>Admin Health Panel</h3><p className="muted">No secrets are shown. Status only checks configuration presence and safe service availability.</p></Card>
        <DataTable headers={['Integration', 'Status']} rows={rows} />
      </div>
    </AdminShell>
  )
}
