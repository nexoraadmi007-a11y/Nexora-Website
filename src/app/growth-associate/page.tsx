import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui'
import { ReferralLinkActions } from '@/components/referral-link-actions'
import { requireGrowthAssociateDashboard } from '@/lib/growth-associate-referrals'

export const dynamic = 'force-dynamic'
const money = (value: number) => `₦${Number(value || 0).toLocaleString('en-NG')}`

export default async function GrowthAssociatePage() {
  const data = await requireGrowthAssociateDashboard()
  if (!data) redirect('/growth-associate/login')
  const remaining = Math.max(30 - Number(data.current.successful_referrals), 0)
  return <main className="associate-portal"><header className="associate-header"><div><Link href="/" className="brand">Nexora Institute</Link><p>Growth Associate Portal</p></div><nav><a href="#dashboard">Dashboard</a><a href="#referrals">Referrals</a><a href="#earnings">Earnings</a><a href="#leaderboard">Leaderboard</a><a href="#profile">Profile</a></nav><form action="/api/auth/logout" method="post"><button className="btn btn-secondary">Log out</button></form></header>
    <section className="associate-content" id="dashboard"><p className="eyebrow">This month</p><h1>Welcome, {data.partner.full_name}</h1><div className="metric-grid associate-metrics"><Metric label="Monthly target" value="30" /><Metric label="Successful referrals" value={`${data.current.successful_referrals} / 30`} /><Metric label={remaining ? 'Remaining' : 'Target achieved ✓'} value={String(remaining)} /><Metric label="Commissionable" value={String(data.current.commissionable_referrals)} /><Metric label="Current earnings" value={money(data.current.commission_amount_ngn)} /><Metric label="Leaderboard position" value={data.position ? `#${data.position}` : '—'} /></div>
      <Card><p className="eyebrow">Your referral link</p><h2>{data.referral?.code || 'Referral code pending'}</h2><code className="referral-url">{data.referral?.referral_url || ''}</code>{data.referral?.referral_url ? <ReferralLinkActions url={data.referral.referral_url} /> : null}</Card>
      <div className="grid-2"><Card><h2>Monthly progress</h2><div className="progress"><span style={{ width: `${Math.min(Number(data.current.successful_referrals) / 30 * 100, 100)}%` }} /></div><p>{data.current.successful_referrals} successful · {data.current.commissionable_referrals} commissionable</p></Card><Card><h2>Conversion</h2><p className="price">{data.conversionRate === null ? '—' : `${data.conversionRate}%`}</p><p className="muted">{data.clicks} tracked link clicks this month.</p></Card></div>
      <div id="referrals"><Card><h2>Referral history</h2><div className="responsive-table"><table><thead><tr><th>Date</th><th>Referred learner</th><th>Status</th><th>Course</th><th>Commission</th></tr></thead><tbody>{data.history.length ? data.history.map((item: any) => <tr key={item.id}><td>{new Date(item.date).toLocaleDateString('en-NG')}</td><td>{item.name}</td><td>{item.status}</td><td>{item.course}</td><td>{money(item.commission)}</td></tr>) : <tr><td colSpan={5}>No successful referrals yet.</td></tr>}</tbody></table></div></Card></div>
      <div id="earnings"><Card><h2>Monthly earnings</h2><div className="responsive-table"><table><thead><tr><th>Month</th><th>Target</th><th>Successful</th><th>Commissionable</th><th>Commission</th><th>Status</th></tr></thead><tbody>{data.performances.length ? data.performances.map((item: any) => <tr key={item.id}><td>{new Date(`${item.month_start}T12:00:00`).toLocaleDateString('en-NG',{month:'long',year:'numeric'})}</td><td>{item.target}</td><td>{item.successful_referrals}</td><td>{item.commissionable_referrals}</td><td>{money(item.commission_amount_ngn)}</td><td>{item.status}</td></tr>) : <tr><td colSpan={6}>No monthly earnings yet.</td></tr>}</tbody></table></div></Card></div>
      <div id="leaderboard"><Card><h2>Current leaderboard</h2><div className="responsive-table"><table><thead><tr><th>Rank</th><th>Associate</th><th>Referrals</th><th>Target</th><th>Commission</th></tr></thead><tbody>{data.leaderboard.map((item: any) => <tr className={item.partnerId === data.partner.id ? 'own-rank' : ''} key={item.partnerId}><td>#{item.rank}</td><td>{item.name}</td><td>{item.referrals}</td><td>30</td><td>{money(item.commission)}</td></tr>)}</tbody></table></div></Card></div>
      <div id="profile"><Card><h2>Profile</h2><p><strong>Associate ID:</strong> {data.partner.partner_id}</p><p><strong>Name:</strong> {data.partner.full_name}</p><p><strong>Email:</strong> {data.partner.email}</p><p><strong>Status:</strong> {data.partner.status}</p></Card></div>
    </section></main>
}

function Metric({ label, value }: { label: string; value: string }) { return <Card><p className="eyebrow">{label}</p><strong className="metric-value">{value}</strong></Card> }
