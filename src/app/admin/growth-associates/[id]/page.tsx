import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { ReferralLinkActions } from '@/components/referral-link-actions'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getGrowthAssociatePortalUrl, getGrowthAssociateReferralUrl } from '@/lib/growth-associate-urls'

const money = (value: number) => `₦${Number(value || 0).toLocaleString('en-NG')}`
export const dynamic = 'force-dynamic'

export default async function AssociateProfile({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params; const db = createSupabaseAdminClient()
  const [partnerResult, performanceResult, conversionsResult, payoutsResult, commissionsResult, bankResult] = await Promise.all([
    db.from('partners').select('*,referral_codes(*)').eq('id', id).maybeSingle(),
    db.from('associate_monthly_performance').select('*').eq('partner_id', id).order('month_start', { ascending: false }),
    db.from('referral_conversions').select('*,payments(paystack_reference,amount_ngn,payment_items(programmes(name)))').eq('partner_id', id).order('successful_at', { ascending: false }),
    db.from('payout_requests').select('*').eq('partner_id', id).order('created_at', { ascending: false }),
    db.from('commissions').select('*').eq('partner_id', id).order('created_at', { ascending: false }),
    db.from('partner_bank_accounts').select('*').eq('partner_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  const p:any=partnerResult.data; if(!p) notFound(); const bank:any=bankResult.data
  const referral=p.referral_codes?.find((x:any)=>x.active)||p.referral_codes?.[0]; const referralUrl=referral?getGrowthAssociateReferralUrl(referral.code):''; const portalUrl=getGrowthAssociatePortalUrl(p.partner_id); const current:any=performanceResult.data?.[0]||{}
  const paid=(commissionsResult.data||[]).filter((x:any)=>x.status==='PAID').reduce((s:number,x:any)=>s+Number(x.amount_ngn||0),0); const pending=(commissionsResult.data||[]).filter((x:any)=>['PENDING','APPROVED'].includes(x.status)).reduce((s:number,x:any)=>s+Number(x.amount_ngn||0),0)
  return <AdminShell title="Growth Associate Profile"><div className="page-grid"><Card><div className="card-actions"><Link className="btn btn-secondary" href="/admin/growth-associates">Back</Link>{referralUrl?<a className="btn btn-primary" href={referralUrl} target="_blank">Open referral link</a>:null}<a className="btn btn-primary" href={portalUrl} target="_blank">Open portal</a></div><h2>{p.full_name}</h2><p><strong>WhatsApp:</strong> {p.whatsapp||'Not provided'} · <strong>Status:</strong> {p.status}</p><p><strong>Growth ID:</strong> {p.partner_id} · <strong>Registered:</strong> {new Date(p.created_at).toLocaleDateString('en-NG')}</p>{referralUrl?<><code className="referral-url">{referralUrl}</code><ReferralLinkActions url={referralUrl}/></>:null}</Card>
    <div className="metric-grid"><Card><p className="eyebrow">Monthly referrals</p><strong className="metric-value">{current.successful_referrals||0} / {current.target||30}</strong></Card><Card><p className="eyebrow">Progress</p><strong className="metric-value">{Math.min(Math.round(Number(current.successful_referrals||0)/30*100),100)}%</strong></Card><Card><p className="eyebrow">Pending</p><strong className="metric-value">{money(pending)}</strong></Card><Card><p className="eyebrow">Paid</p><strong className="metric-value">{money(paid)}</strong></Card></div>
    <Card><h2>Banking</h2><p><strong>Account name:</strong> {bank?.account_name||'Not submitted'}</p><p><strong>Bank:</strong> {bank?.bank_name||'Not submitted'}</p><p><strong>Account number:</strong> {bank?.account_number_last_four?`••••${bank.account_number_last_four}`:'Not submitted'}</p><p><strong>Verification:</strong> {bank?.verification_status||'Not submitted'}</p></Card>
    <Card><h2>Referral activity ({conversionsResult.data?.length||0})</h2><div className="responsive-table"><table><thead><tr><th>Date</th><th>Payment</th><th>Course</th><th>Amount</th><th>Status</th><th>Commission</th></tr></thead><tbody>{(conversionsResult.data||[]).length?(conversionsResult.data||[]).map((x:any)=><tr key={x.id}><td>{new Date(x.successful_at).toLocaleDateString()}</td><td>{x.payments?.paystack_reference}</td><td>{x.payments?.payment_items?.map((y:any)=>y.programmes?.name).filter(Boolean).join(', ')||'—'}</td><td>{money(x.payments?.amount_ngn)}</td><td>{x.status}</td><td>{money(x.commission_amount_ngn)}</td></tr>):<tr><td colSpan={6}>No successful referrals yet.</td></tr>}</tbody></table></div></Card>
    <Card><h2>Payout history</h2>{(payoutsResult.data||[]).length?(payoutsResult.data||[]).map((x:any)=><p key={x.id}>{x.created_at?.slice(0,10)} · {money(x.approved_amount_ngn||x.requested_amount_ngn)} · {x.status} · {x.reference||'—'}</p>):<p>No payouts recorded.</p>}</Card></div></AdminShell>
}
