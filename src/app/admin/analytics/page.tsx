import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'

export default function AdminAnalyticsPage() {
  return <AdminShell title="Analytics"><div className="grid-2"><Card><h3>Enrolments Over Time</h3><p className="muted">Chart appears when enrolment events are available.</p></Card><Card><h3>Referral Conversions</h3><p className="muted">Track clicks, registrations, paid enrolments and qualified sales.</p></Card><Card><h3>Revenue Over Time</h3><p className="muted">Uses verified Paystack and payment records.</p></Card><Card><h3>Learning Completion</h3><p className="muted">Uses module and project completion records.</p></Card></div></AdminShell>
}
