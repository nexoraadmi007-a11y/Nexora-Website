import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getGrowthAssociatePortalUrl, getGrowthAssociateReferralUrl } from '@/lib/growth-associate-urls'

export const MONTHLY_TARGET = 30
export const LEVEL_1_COMMISSION_NGN = 1500
export const LEVEL_2_COMMISSION_NGN = 500

function monthStart(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit' }).formatToParts(value)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  return `${year}-${month}-01`
}

function normalizeMonth(value?: string) { return /^\d{4}-\d{2}(?:-01)?$/.test(value || '') ? `${value!.slice(0, 7)}-01` : monthStart() }

function maskName(value = '') {
  return value.split(/\s+/).filter(Boolean).map((part) => `${part[0] || ''}.`).join(' ') || 'Referred learner'
}

export async function requireGrowthAssociateDashboard() {
  const auth = await createSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user?.email) return null
  const db = createSupabaseAdminClient()
  const partnerFields = '*,referral_codes(id,code,referral_url,active)'
  let { data: partner } = await db.from('partners').select(partnerFields).eq('user_id', user.id).maybeSingle()
  if (!partner) {
    const lookup = await db.from('partners').select(partnerFields).ilike('email', user.email).maybeSingle()
    partner = lookup.data
    if (partner && !partner.user_id) await db.from('partners').update({ user_id: user.id, updated_at: new Date().toISOString() }).eq('id', partner.id)
  }
  if (!partner || partner.status !== 'ACTIVE') return null
  const currentMonth = monthStart()
  const [performanceResult, historyResult, eventsResult, payoutsResult, leaderboardResult, commissionsResult] = await Promise.all([
    db.from('associate_monthly_performance').select('*').eq('partner_id', partner.id).order('month_start', { ascending: false }),
    db.from('referral_conversions').select('id,referred_user_id,first_payment_id,successful_at,status,commission_amount_ngn').eq('partner_id', partner.id).order('successful_at', { ascending: false }).limit(200),
    db.from('referral_events').select('event_type,occurred_at').eq('partner_id', partner.id).gte('occurred_at', `${currentMonth}T00:00:00+01:00`).limit(2000),
    db.from('payout_requests').select('*').eq('partner_id', partner.id).order('created_at', { ascending: false }),
    db.from('associate_monthly_performance').select('partner_id,successful_referrals,commissionable_referrals,commission_amount_ngn,partners(full_name,partner_id,status)').eq('month_start', currentMonth).order('successful_referrals', { ascending: false }),
    db.from('commissions').select('amount_ngn,status,level,created_at').eq('partner_id', partner.id),
  ])
  const userIds = (historyResult.data || []).map((item: any) => item.referred_user_id)
  const paymentIds = (historyResult.data || []).map((item: any) => item.first_payment_id)
  const profiles = userIds.length ? (await db.from('profiles').select('id,full_name').in('id', userIds)).data || [] : []
  const paymentItems = paymentIds.length ? (await db.from('payment_items').select('payment_id,programmes(name)').in('payment_id', paymentIds)).data || [] : []
  const names = new Map(profiles.map((profile: any) => [profile.id, maskName(profile.full_name)]))
  const performances = performanceResult.data || []
  const current = performances.find((item: any) => item.month_start === currentMonth) || { month_start: currentMonth, target: 30, successful_referrals: 0, commissionable_referrals: 0, commission_amount_ngn: 0, status: 'CALCULATED' }
  const events = eventsResult.data || []
  const clicks = events.filter((item: any) => item.event_type === 'LINK_CLICKED').length
  const leaderboard = (leaderboardResult.data || []).filter((item: any) => item.partners?.status === 'ACTIVE').map((item: any, index: number) => ({ rank: index + 1, name: item.partners?.full_name || item.partners?.partner_id || 'Associate', referrals: item.successful_referrals, target: 30, commission: item.commission_amount_ngn, partnerId: item.partner_id }))
  const storedReferral = (partner.referral_codes || []).find((item: any) => item.active) || partner.referral_codes?.[0]
  const referral = storedReferral ? { ...storedReferral, referral_url: getGrowthAssociateReferralUrl(storedReferral.code) } : null
  const commissions = commissionsResult.data || []
  return {
    partner, referral, current, performances, payouts: payoutsResult.data || [], leaderboard,
    position: leaderboard.find((item: any) => item.partnerId === partner.id)?.rank || null,
    clicks, conversionRate: clicks ? Math.round((Number(current.successful_referrals) / clicks) * 1000) / 10 : null,
    commissionSummary: {
      pending: commissions.filter((x: any) => x.status === 'PENDING').reduce((s: number, x: any) => s + Number(x.amount_ngn), 0),
      approved: commissions.filter((x: any) => x.status === 'APPROVED').reduce((s: number, x: any) => s + Number(x.amount_ngn), 0),
      paid: commissions.filter((x: any) => x.status === 'PAID').reduce((s: number, x: any) => s + Number(x.amount_ngn), 0),
      total: commissions.filter((x: any) => x.status !== 'REVERSED').reduce((s: number, x: any) => s + Number(x.amount_ngn), 0),
    },
    history: (historyResult.data || []).map((item: any) => ({ id: item.id, name: names.get(item.referred_user_id) || 'Referred learner', date: item.successful_at, status: item.status === 'VALID' ? 'Successful' : 'Invalidated', course: paymentItems.filter((entry: any) => entry.payment_id === item.first_payment_id).map((entry: any) => entry.programmes?.name).filter(Boolean).join(', ') || 'Nexora course', commission: item.commission_amount_ngn })),
  }
}

export async function adminGrowthReferralData(requestedMonth?: string) {
  const month = normalizeMonth(requestedMonth)
  const db = createSupabaseAdminClient()
  const [partners, performance, conversions, payouts] = await Promise.all([
    db.from('partners').select('*,referral_codes(code,referral_url,active)').order('full_name'),
    db.from('associate_monthly_performance').select('*').eq('month_start', month).order('successful_referrals', { ascending: false }),
    db.from('referral_conversions').select('*,partners(full_name,partner_id),referral_codes(code),payments(paystack_reference,status,payment_items(programmes(name)))').order('successful_at', { ascending: false }).limit(500),
    db.from('payout_requests').select('*,partners(full_name,partner_id),associate_monthly_performance(month_start,commission_amount_ngn)').order('created_at', { ascending: false }).limit(300),
  ])
  return { month, partners: (partners.data || []).map((partner: any) => ({
    ...partner,
    portal_url: getGrowthAssociatePortalUrl(partner.partner_id),
    referral_codes: (partner.referral_codes || []).map((code: any) => ({ ...code, referral_url: getGrowthAssociateReferralUrl(code.code) })),
  })), performance: performance.data || [], conversions: conversions.data || [], payouts: payouts.data || [] }
}
