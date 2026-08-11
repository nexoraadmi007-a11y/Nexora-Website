import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

export default function PartnerCopilotPage() {
  return (
    <AppShell title="Growth Copilot">
      <div className="dashboard-grid">
        <Card>
          <form className="form-grid">
            <label className="field"><span>Prospect Message</span><textarea name="message" placeholder="Paste the prospect's message or describe the situation." /></label>
            <button className="btn btn-primary" type="button">Get Suggested Reply</button>
          </form>
        </Card>
        <Card>
          <h3>Reply to Send</h3>
          <p className="muted">Your suggested reply will appear here after the Copilot is connected to this workspace route.</p>
          <h3>Next Best Action</h3>
          <p className="muted">The next action will help you decide whether to clarify, send a programme link or follow up later.</p>
        </Card>
      </div>
    </AppShell>
  )
}
