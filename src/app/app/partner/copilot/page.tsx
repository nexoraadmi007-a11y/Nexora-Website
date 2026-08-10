import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

export default function PartnerCopilotPage() {
  return <AppShell title="Growth Copilot"><Card><form className="form-grid"><label className="field"><span>Paste prospect message</span><textarea name="message" /></label><button className="btn btn-primary" type="button">Generate reply</button><p className="muted">Copilot will connect to canonical programme data before production use.</p></form></Card></AppShell>
}
