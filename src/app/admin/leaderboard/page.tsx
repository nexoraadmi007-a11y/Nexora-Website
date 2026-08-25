import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { requireAdmin } from '@/lib/admin-auth'
import { adminGrowthReferralData } from '@/lib/growth-associate-referrals'

export const dynamic = 'force-dynamic'
const money = (value: number) => `₦${Number(value || 0).toLocaleString('en-NG')}`
export default async function Leaderboard({ searchParams }: { searchParams?: Promise<{ month?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const data = await adminGrowthReferralData(params?.month)
  return <AdminShell title="Leaderboard"><div className="page-grid"><Card><form className="card-actions"><label>Month <input type="month" name="month" defaultValue={data.month.slice(0,7)}/></label><button className="btn btn-primary">View</button></form></Card><Card><div className="responsive-table"><table><thead><tr><th>Rank</th><th>Associate</th><th>Referrals</th><th>Target</th><th>Progress</th><th>L1</th><th>L2</th><th>Total</th></tr></thead><tbody>{data.performance.map((item:any,index:number)=>{const partner:any=data.partners.find((p:any)=>p.id===item.partner_id);return <tr key={item.id}><td>#{index+1}</td><td>{partner?.full_name||'Associate'}</td><td>{item.successful_referrals}</td><td>30</td><td>{Math.min(Math.round(Number(item.successful_referrals)/30*100),100)}%</td><td>{money(item.l1_commission_ngn)}</td><td>{money(item.l2_commission_ngn)}</td><td>{money(item.commission_amount_ngn)}</td></tr>})}</tbody></table></div></Card></div></AdminShell>
}
