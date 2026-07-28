export type GrowthAllocationMode = 'DAILY_FIXED' | 'BATCH_COMPLETION' | 'MANUAL_ADMIN' | 'HYBRID'

function bool(name: string, fallback: boolean) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

function int(name: string, fallback: number, min: number, max: number) {
  const parsed = Number(process.env[name])
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.round(parsed), min), max)
}

function mode(): GrowthAllocationMode {
  const raw = (process.env.GROWTH_ALLOCATION_MODE || 'HYBRID').toUpperCase()
  return ['DAILY_FIXED', 'BATCH_COMPLETION', 'MANUAL_ADMIN', 'HYBRID'].includes(raw)
    ? raw as GrowthAllocationMode
    : 'HYBRID'
}

export const growthConfig = {
  enableIndividualGrowthEngine: bool('ENABLE_INDIVIDUAL_GROWTH_ENGINE', true),
  enableSmeGrowthEngine: bool('ENABLE_SME_GROWTH_ENGINE', false),
  enableCorporateGrowthEngine: bool('ENABLE_CORPORATE_GROWTH_ENGINE', false),
  enableAutomaticLeadAllocation: bool('ENABLE_AUTOMATIC_LEAD_ALLOCATION', true),
  enableReferralRepair: bool('ENABLE_REFERRAL_REPAIR', true),
  defaultDailyIndividualLeadQuota: int('DEFAULT_DAILY_INDIVIDUAL_LEAD_QUOTA', 10, 1, 25),
  individualBatchProcessedThreshold: int('INDIVIDUAL_BATCH_PROCESSED_THRESHOLD', 8, 1, 25),
  allocationMode: mode(),
  timezone: process.env.GROWTH_REPORT_TIMEZONE || 'Africa/Lagos',
}

