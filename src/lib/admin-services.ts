import { createSupabaseAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin'

type RangeKey = 'today' | '7d' | '30d' | 'this-month' | 'last-month' | '90d' | 'this-year'

function supabase() {
  if (!hasSupabaseAdminConfig()) throw new Error('Supabase admin client is not configured.')
  return createSupabaseAdminClient()
}

export function formatNgn(value: number) {
  return `NGN ${Math.round(value || 0).toLocaleString()}`
}

export function dateRange(key?: string) {
  const now = new Date()
  const range = (key || 'this-month') as RangeKey
  const start = new Date(now)
  const end = new Date(now)
  if (range === 'today') start.setHours(0, 0, 0, 0)
  else if (range === '7d') start.setDate(now.getDate() - 7)
  else if (range === '30d') start.setDate(now.getDate() - 30)
  else if (range === '90d') start.setDate(now.getDate() - 90)
  else if (range === 'this-year') start.setMonth(0, 1)
  else if (range === 'last-month') {
    start.setMonth(now.getMonth() - 1, 1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(now.getMonth(), 0)
    end.setHours(23, 59, 59, 999)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }
  const previousStart = new Date(start)
  const previousEnd = new Date(start)
  const span = Math.max(1, end.getTime() - start.getTime())
  previousStart.setTime(start.getTime() - span)
  previousEnd.setTime(start.getTime() - 1)
  return { start, end, previousStart, previousEnd, label: range }
}

function pct(current: number, previous: number) {
  if (!previous && !current) return '0%'
  if (!previous) return '+100%'
  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? '+' : ''}${Math.round(change * 10) / 10}%`
}

async function count(table: string, field = 'created_at', start?: Date, end?: Date, filters?: Record<string, string>) {
  let query = supabase().from(table).select('id', { count: 'exact', head: true })
  if (start) query = query.gte(field, start.toISOString())
  if (end) query = query.lte(field, end.toISOString())
  for (const [key, value] of Object.entries(filters || {})) query = query.eq(key, value)
  const { count: result, error } = await query
  if (error) throw new Error(`${table} count failed: ${error.message}`)
  return result || 0
}

async function rows(table: string, select = '*', limit = 100) {
  const { data, error } = await supabase().from(table).select(select).order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`${table} list failed: ${error.message}`)
  return data || []
}

export async function adminOverview(rangeKey?: string) {
  const range = dateRange(rangeKey)
  const [
    totalLearners,
    activeLearners,
    newLearners,
    previousLearners,
    activePartners,
    newPartners,
    previousPartners,
    payments,
    previousPayments,
    pendingCommissions,
    upcomingClasses,
    openTickets,
  ] = await Promise.all([
    count('profiles'),
    count('enrolments', 'created_at', undefined, undefined, { status: 'ENROLLED' }),
    count('profiles', 'created_at', range.start, range.end),
    count('profiles', 'created_at', range.previousStart, range.previousEnd),
    count('partners', 'created_at', undefined, undefined, { status: 'ACTIVE' }),
    count('partners', 'created_at', range.start, range.end),
    count('partners', 'created_at', range.previousStart, range.previousEnd),
    rows('payments', 'amount_ngn, status, created_at, programme_id, programmes(name, family)', 1000),
    rows('payments', 'amount_ngn, status, created_at', 1000),
    rows('commissions', 'amount_ngn, status', 1000),
    count('classes', 'created_at', undefined, undefined, { status: 'SCHEDULED' }).catch(() => 0),
    count('support_tickets', 'created_at', undefined, undefined, { status: 'OPEN' }).catch(() => 0),
  ])
  const inRange = payments.filter((item: any) => item.status === 'PAID' && new Date(item.created_at) >= range.start && new Date(item.created_at) <= range.end)
  const previousInRange = previousPayments.filter((item: any) => item.status === 'PAID' && new Date(item.created_at) >= range.previousStart && new Date(item.created_at) <= range.previousEnd)
  const revenue = inRange.reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const previousRevenue = previousInRange.reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const pendingPayout = pendingCommissions.filter((item: any) => item.status === 'PENDING').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  return {
    range,
    metrics: [
      ['Total Learners', totalLearners, 'All profiles'],
      ['Active Learners', activeLearners, 'Enrolled learners'],
      ['New Learners This Month', newLearners, `${pct(newLearners, previousLearners)} vs previous period`],
      ['Active Partners', activePartners, 'Partner records'],
      ['New Partners This Month', newPartners, `${pct(newPartners, previousPartners)} vs previous period`],
      ['Verified Revenue This Month', formatNgn(revenue), `${pct(revenue, previousRevenue)} vs previous period`],
      ['Pending Payout Liability', formatNgn(pendingPayout), 'Pending commissions'],
      ['Upcoming Classes', upcomingClasses, 'Scheduled classes'],
    ],
    queues: [
      ['Partner Activations', activePartners ? 'Review active partner quality and sales activity' : 'No active partners awaiting review', '/admin/partners'],
      ['Payout Requests', pendingPayout ? `${formatNgn(pendingPayout)} pending liability` : 'No pending payout liability', '/admin/payouts'],
      ['Classes', upcomingClasses ? `${upcomingClasses} scheduled classes` : 'No scheduled classes yet', '/admin/classes'],
      ['Projects', 'Review project submissions and deadlines', '/admin/projects'],
      ['Support Tickets', `${openTickets} open tickets`, '/admin/users'],
    ],
  }
}

export async function adminAnalytics(rangeKey?: string) {
  const overview = await adminOverview(rangeKey)
  const [registrations, paid, referrals, commissions] = await Promise.all([
    rows('profiles', 'created_at, role', 1000),
    rows('payments', 'created_at, amount_ngn, status, programmes(name, family)', 1000),
    rows('referral_events', 'event_type, created_at, referral_code_text', 1000),
    rows('commissions', 'amount_ngn, status, created_at', 1000),
  ])
  const paidPayments = paid.filter((item: any) => item.status === 'PAID')
  const grossRevenue = paidPayments.reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const commissionLiability = commissions.filter((item: any) => item.status !== 'PAID').reduce((sum: number, item: any) => sum + Number(item.amount_ngn || 0), 0)
  const referralClicks = referrals.filter((item: any) => item.event_type === 'LINK_CLICKED').length
  const referralRegs = referrals.filter((item: any) => ['REGISTRATION_COMPLETED', 'APPLICATION_STARTED', 'APPLICATION_COMPLETED'].includes(item.event_type)).length
  return {
    overview,
    enrolment: {
      totalRegistrations: registrations.length,
      paidEnrolments: paidPayments.length,
      paymentConversionRate: registrations.length ? `${Math.round((paidPayments.length / registrations.length) * 1000) / 10}%` : '0%',
      activeLearners: overview.metrics[1][1],
    },
    revenue: {
      grossVerifiedRevenue: formatNgn(grossRevenue),
      partnerCommissionLiability: formatNgn(commissionLiability),
      netRecognisedRevenue: formatNgn(grossRevenue - commissionLiability),
    },
    referrals: { referralClicks, referralRegs, paidEnrolments: paidPayments.length, conversion: referralClicks ? `${Math.round((paidPayments.length / referralClicks) * 1000) / 10}%` : '0%' },
  }
}

export async function adminUsers(search = '') {
  const client = supabase()
  const { data: users, error } = await client.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error(`Admin users failed: ${error.message}`)
  const query = search.toLowerCase()
  return (users || []).filter((user: any) => !query || `${user.full_name} ${user.email} ${user.whatsapp} ${user.role}`.toLowerCase().includes(query))
}

export async function adminProgrammes() {
  const { data, error } = await supabase().from('programmes').select('*').order('family').order('name')
  if (error) throw new Error(`Admin programmes failed: ${error.message}`)
  return data || []
}

export async function adminPartners(search = '') {
  const { data, error } = await supabase().from('partners').select('*, referral_codes(code, referral_url), partner_bank_accounts(verification_status, bank_name, account_name)').order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error(`Admin partners failed: ${error.message}`)
  const query = search.toLowerCase()
  return (data || []).filter((partner: any) => !query || `${partner.full_name} ${partner.email} ${partner.whatsapp} ${partner.partner_id} ${partner.referral_codes?.[0]?.code}`.toLowerCase().includes(query))
}

export async function adminReferrals() {
  const [events, commissions] = await Promise.all([
    rows('referral_events', 'event_type, referral_code_text, payment_reference, occurred_at, partners(full_name, partner_id)', 1000),
    rows('commissions', 'amount_ngn, status, partner_id, payments(paystack_reference, amount_ngn, status)', 1000),
  ])
  return { events, commissions }
}

export async function adminSimpleTable(table: string, select = '*') {
  return rows(table, select, 200)
}

export async function adminSettings() {
  const { data, error } = await supabase().from('admin_settings').select('*').order('category')
  if (error) throw new Error(`Admin settings failed: ${error.message}`)
  return data || []
}
