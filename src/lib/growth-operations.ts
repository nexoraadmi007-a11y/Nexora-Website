import { createRecord, escapeFormula, listRecords, updateRecord, type AirtableRecord } from './airtable'

export type Fields = Record<string, any>

export type TargetStatus = 'AHEAD' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'TARGET_ACHIEVED'

export type AssociatePerformance = {
  associateId: string
  associateName: string
  referralCode: string
  referralLink: string
  active: boolean
  target: number
  confirmedIntake: number
  remainingTarget: number
  achievementPercentage: number
  daysRemaining: number
  dailyPaceRequired: number
  projectedMonthEnd: number
  status: TargetStatus
  grossRevenue: number
  refundAmount: number
  netRevenue: number
  conversionRate: number
  rank: number
  bonusEligible: boolean
  provisionalBonusAmount: number | null
  bonusStatus: string
}

export type BonusConfiguration = {
  id?: string
  name: string
  numberOfWinners: number
  minimumTargetRequired: boolean
  bonusType: string
  rankAmounts: Record<string, number | null>
}

export type GrowthOverview = {
  month: string
  generatedAt: string
  defaultMonthlyTarget: number
  associates: AssociatePerformance[]
  topAssociate?: AssociatePerformance
  totals: {
    activeAssociates: number
    confirmedIntake: number
    netRevenue: number
    grossRevenue: number
    projectedMonthEnd: number
    target: number
  }
  bonusConfiguration: BonusConfiguration
}

const DEFAULT_TARGET = 30
const DEFAULT_TIMEZONE = process.env.GROWTH_REPORT_TIMEZONE || 'Africa/Lagos'

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function monthKey(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || String(date.getUTCFullYear())
  const month = parts.find((part) => part.type === 'month')?.value || String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function daysInMonth(month: string) {
  const [year, rawMonth] = month.split('-').map(Number)
  return new Date(year, rawMonth, 0).getDate()
}

function dayOfMonth(date: Date, timeZone = DEFAULT_TIMEZONE) {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    day: '2-digit',
  }).formatToParts(date).find((part) => part.type === 'day')?.value
  return Number(day || date.getUTCDate())
}

function monthBounds(month: string) {
  const [year, rawMonth] = month.split('-').map(Number)
  const start = `${year}-${String(rawMonth).padStart(2, '0')}-01`
  const end = `${year}-${String(rawMonth).padStart(2, '0')}-${String(daysInMonth(month)).padStart(2, '0')}`
  return { start, end }
}

function value(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'true' : 'false'
  return typeof raw === 'string' ? raw.trim() : ''
}

function linkId(fields: Fields, name: string) {
  const raw = fields[name]
  return Array.isArray(raw) ? text(raw[0], 120) : ''
}

function targetStatus(confirmed: number, target: number, projected: number, achievement: number): TargetStatus {
  if (target > 0 && confirmed >= target) return 'TARGET_ACHIEVED'
  if (target <= 0) return 'ON_TRACK'
  if (projected >= target * 1.1) return 'AHEAD'
  if (projected >= target) return 'ON_TRACK'
  if (achievement >= 0.5 || projected >= target * 0.75) return 'AT_RISK'
  return 'BEHIND'
}

function parseRankAmounts(raw: string) {
  try {
    const parsed = JSON.parse(raw || '{}') as Record<string, unknown>
    return Object.fromEntries(Object.entries(parsed).map(([rank, amount]) => [rank, amount === null || amount === '' ? null : number(amount)]))
  } catch {
    return { '1': null }
  }
}

export function calculateTargetProgress(input: {
  target: number
  confirmedIntake: number
  month: string
  now?: Date
}) {
  const now = input.now || new Date()
  const totalDays = daysInMonth(input.month)
  const today = Math.min(dayOfMonth(now), totalDays)
  const daysRemaining = Math.max(totalDays - today, 0)
  const elapsedDays = Math.max(today, 1)
  const remainingTarget = Math.max(input.target - input.confirmedIntake, 0)
  const dailyPaceRequired = daysRemaining ? remainingTarget / daysRemaining : remainingTarget
  const projectedMonthEnd = Math.round((input.confirmedIntake / elapsedDays) * totalDays)
  const achievementPercentage = input.target > 0 ? input.confirmedIntake / input.target : 0

  return {
    remainingTarget,
    achievementPercentage,
    daysRemaining,
    dailyPaceRequired,
    projectedMonthEnd,
    status: targetStatus(input.confirmedIntake, input.target, projectedMonthEnd, achievementPercentage),
  }
}

export function calculateLeaderboard(associates: AssociatePerformance[]) {
  return [...associates]
    .filter((associate) => associate.active)
    .sort((a, b) => {
      if (b.confirmedIntake !== a.confirmedIntake) return b.confirmedIntake - a.confirmedIntake
      if (b.netRevenue !== a.netRevenue) return b.netRevenue - a.netRevenue
      if (b.conversionRate !== a.conversionRate) return b.conversionRate - a.conversionRate
      return a.associateName.localeCompare(b.associateName)
    })
    .map((associate, index) => ({ ...associate, rank: index + 1 }))
}

export function calculateBonusAwards(leaderboard: AssociatePerformance[], config: BonusConfiguration) {
  return leaderboard.map((associate) => {
    const withinWinnerCount = associate.rank <= config.numberOfWinners
    const meetsTarget = !config.minimumTargetRequired || associate.confirmedIntake >= associate.target
    const bonusAmount = config.rankAmounts[String(associate.rank)] ?? null
    return {
      ...associate,
      bonusEligible: withinWinnerCount && meetsTarget,
      provisionalBonusAmount: withinWinnerCount && meetsTarget ? bonusAmount : null,
      bonusStatus: withinWinnerCount && meetsTarget ? 'CALCULATED' : 'DRAFT',
    }
  })
}

async function getAssociates() {
  return listRecords<Fields>('Ambassadors', {
    formula: "OR({Ambassador Status}='Active',{Active}=TRUE())",
    maxRecords: 100,
  }).catch(async () => listRecords<Fields>('Ambassadors', { maxRecords: 100 }))
}

async function getAttributions(month: string) {
  const { start, end } = monthBounds(month)
  const formula = `AND({Attribution Status}='APPROVED',IS_AFTER({Created At},'${start}'),IS_BEFORE({Created At},'${end}'))`
  return listRecords<Fields>('Conversion Attribution', {
    formula,
    maxRecords: 100,
  }).catch(() => [])
}

async function getPayments(month: string) {
  const { start, end } = monthBounds(month)
  const formula = `AND({Payment Status}='Confirmed',IS_AFTER({Payment Date},'${start}'),IS_BEFORE({Payment Date},'${end}'))`
  return listRecords<Fields>('Payments', {
    formula,
    maxRecords: 100,
  }).catch(() => [])
}

async function getBonusConfiguration(): Promise<BonusConfiguration> {
  const records = await listRecords<Fields>('Bonus Configurations', {
    formula: '{Active}=TRUE()',
    maxRecords: 1,
  }).catch(() => [])
  const fields = records[0]?.fields || {}
  return {
    id: records[0]?.id,
    name: text(fields.Name) || 'Default Monthly Growth Bonus',
    numberOfWinners: Math.max(number(fields['Number Of Winners']) || 1, 1),
    minimumTargetRequired: bool(fields['Minimum Target Required'], true),
    bonusType: text(fields['Bonus Type']) || 'TIERED_RANK_BONUS',
    rankAmounts: parseRankAmounts(text(fields['Rank Amounts JSON'])),
  }
}

function attributionMetrics(associate: AirtableRecord<Fields>, attributions: Array<AirtableRecord<Fields>>, payments: Array<AirtableRecord<Fields>>) {
  const direct = attributions.filter((record) => linkId(record.fields, 'Associate') === associate.id)
  const paidReferences = new Set(payments.map((payment) => value(payment.fields, 'Payment Reference')).filter(Boolean))
  const confirmed = direct.filter((record) => {
    const reference = value(record.fields, 'Payment Reference')
    const status = value(record.fields, 'Attribution Status')
    return status !== 'REJECTED' && (!reference || paidReferences.has(reference))
  })
  const grossRevenue = confirmed.reduce((sum, record) => sum + number(record.fields['Attributed Amount']), 0)
  const netRevenue = confirmed.reduce((sum, record) => sum + (number(record.fields['Net Amount']) || number(record.fields['Attributed Amount'])), 0)
  return {
    confirmedIntake: confirmed.length,
    grossRevenue,
    refundAmount: Math.max(grossRevenue - netRevenue, 0),
    netRevenue,
  }
}

export async function calculateMonthlyAssociatePerformance(month = monthKey()): Promise<GrowthOverview> {
  const [associates, attributions, payments, bonusConfiguration] = await Promise.all([
    getAssociates(),
    getAttributions(month),
    getPayments(month),
    getBonusConfiguration(),
  ])

  const base = associates.map((associate) => {
    const fields = associate.fields
    const target = number(fields['Monthly Intake Target']) || DEFAULT_TARGET
    const metrics = attributionMetrics(associate, attributions, payments)
    const progress = calculateTargetProgress({ target, confirmedIntake: metrics.confirmedIntake, month })
    const assignedLeads = number(fields['Total Referral Leads'])
    const conversionRate = assignedLeads > 0 ? metrics.confirmedIntake / assignedLeads : 0

    return {
      associateId: associate.id,
      associateName: value(fields, 'Ambassador Name') || value(fields, 'Full Name') || 'Unnamed associate',
      referralCode: value(fields, 'Referral Code'),
      referralLink: value(fields, 'Referral Link') || value(fields, 'Ambassador Referral Link'),
      active: value(fields, 'Ambassador Status') === 'Active' || bool(fields.Active, true),
      target,
      confirmedIntake: metrics.confirmedIntake,
      grossRevenue: metrics.grossRevenue,
      refundAmount: metrics.refundAmount,
      netRevenue: metrics.netRevenue,
      conversionRate,
      rank: 0,
      bonusEligible: false,
      provisionalBonusAmount: null,
      bonusStatus: 'DRAFT',
      ...progress,
    } satisfies AssociatePerformance
  })

  const leaderboard = calculateBonusAwards(calculateLeaderboard(base), bonusConfiguration)
  const inactive = base.filter((associate) => !associate.active)
  const associatesWithRanks = [...leaderboard, ...inactive]
  const totals = associatesWithRanks.reduce((acc, associate) => {
    acc.activeAssociates += associate.active ? 1 : 0
    acc.confirmedIntake += associate.confirmedIntake
    acc.netRevenue += associate.netRevenue
    acc.grossRevenue += associate.grossRevenue
    acc.projectedMonthEnd += associate.projectedMonthEnd
    acc.target += associate.target
    return acc
  }, { activeAssociates: 0, confirmedIntake: 0, netRevenue: 0, grossRevenue: 0, projectedMonthEnd: 0, target: 0 })

  return {
    month,
    generatedAt: new Date().toISOString(),
    defaultMonthlyTarget: DEFAULT_TARGET,
    associates: associatesWithRanks,
    topAssociate: leaderboard[0],
    totals,
    bonusConfiguration,
  }
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

export async function upsertMonthlyPerformance(overview: GrowthOverview) {
  for (const associate of overview.associates) {
    const existing = await listRecords<Fields>('Monthly Performance', {
      formula: `AND({Month}='${escapeFormula(overview.month)}',FIND('${escapeFormula(associate.associateId)}',ARRAYJOIN({Associate})))`,
      maxRecords: 1,
    }).catch(() => [])
    const fields = compact({
      Associate: [associate.associateId],
      Month: overview.month,
      Target: associate.target,
      'Confirmed Intake': associate.confirmedIntake,
      'Gross Revenue': associate.grossRevenue,
      'Refund Amount': associate.refundAmount,
      'Net Revenue': associate.netRevenue,
      'Conversion Rate': associate.conversionRate,
      'Target Achievement Percentage': associate.achievementPercentage,
      Rank: associate.rank || undefined,
      Status: associate.status,
      'Calculated At': overview.generatedAt,
    })

    if (existing[0]) {
      await updateRecord('Monthly Performance', existing[0].id, fields)
    } else {
      await createRecord('Monthly Performance', {
        'Performance ID': `PERF-${overview.month}-${associate.associateId.slice(-6)}`,
        ...fields,
      })
    }
  }
}

export async function getGrowthOverview(month?: string) {
  const overview = await calculateMonthlyAssociatePerformance(month || monthKey())
  return overview
}
