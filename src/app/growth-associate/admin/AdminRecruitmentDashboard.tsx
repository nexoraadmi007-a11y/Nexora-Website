'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Eye, EyeOff, ExternalLink, RefreshCw, Search, ShieldCheck, X, XCircle } from 'lucide-react'

type Applicant = {
  id: string
  fields: Record<string, unknown>
}

type ApiResult = {
  stages?: string[]
  applicants?: Applicant[]
  error?: string
}

type AssociatePerformance = {
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
  status: string
  grossRevenue: number
  netRevenue: number
  conversionRate: number
  rank: number
  bonusEligible: boolean
  provisionalBonusAmount: number | null
  bonusStatus: string
}

type GrowthOverview = {
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
  bonusConfiguration: {
    name: string
    numberOfWinners: number
    minimumTargetRequired: boolean
    bonusType: string
  }
  error?: string
}

type AttributionRecord = {
  id: string
  fields: Record<string, unknown>
}

type AssociateOption = {
  id: string
  name: string
  referralCode: string
}

type LeadQueue = {
  associateCount: number
  totalAvailable: number
  estimatedAssignable?: number
  sectors: Array<{ name: string; count: number }>
  sample: Array<{ id: string; name: string; sector: string; status: string; location: string; score: string }>
}

type ApifyImportResult = {
  received: number
  normalized: number
  imported: Array<{ id: string; name: string; sector?: string; score?: number }>
  skipped: Array<{ name: string; reason: string }>
  failed?: Array<{ name: string; error: string }>
  error?: string
}

type DailyAutomationResult = {
  dryRun: boolean
  importPlan: Array<{ sector: string; location: string }>
  imports: Array<{ sector: string; location: string; received: number; normalized: number; imported: number; skipped: number; failed?: number; error?: string }>
  associateCount: number
  estimatedAssignable: number
  queueBeforeAssignment: LeadQueue
  queueAfterAssignment: LeadQueue
  assignment?: { totalAssigned: number } | null
  error?: string
}

type SystemHealthIssue = {
  id: string
  recordId: string
  entity: string
  code: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  name: string
  message: string
}

type SystemHealthResult = {
  generatedAt: string
  associatesScanned: number
  registrationsScanned: number
  leadsScanned: number
  issueCount: number
  issues: SystemHealthIssue[]
  error?: string
}

type ReferralRepairResult = {
  dryRun: boolean
  scanned: number
  valid: number
  repaired: number
  wouldRepair: number
  skipped: number
  failed: number
  error?: string
}

type IndividualLeadImportResult = {
  received: number
  imported: number
  skipped: number
  failed: number
  error?: string
}

const actions = [
  { key: 'schedule_interview', label: 'Schedule Interview', tone: 'neutral' },
  { key: 'pass_interview', label: 'Pass Interview', tone: 'green' },
  { key: 'reject', label: 'Reject', tone: 'red' },
]

function value(fields: Record<string, unknown>, key: string) {
  const data = fields[key]
  if (Array.isArray(data)) return data.join(', ')
  if (typeof data === 'number') return String(data)
  if (typeof data === 'boolean') return data ? 'Yes' : 'No'
  return typeof data === 'string' ? data : ''
}

function linkedRecordId(fields: Record<string, unknown>, key: string) {
  const data = fields[key]
  return Array.isArray(data) && typeof data[0] === 'string' ? data[0] : ''
}

function rawAnswer(fields: Record<string, unknown>, key: string) {
  try {
    const raw = value(fields, 'Raw Channel Response')
    if (!raw) return ''
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const item = parsed[key]
    return typeof item === 'string' ? item : typeof item === 'number' ? String(item) : ''
  } catch {
    return ''
  }
}

function short(text: string, max = 160) {
  return text.length > max ? `${text.slice(0, max)}...` : text
}

const questionLabels: Array<[string, string]> = [
  ['fullName', 'Full name'],
  ['email', 'Email address'],
  ['phoneNumber', 'Phone number'],
  ['whatsAppNumber', 'WhatsApp number'],
  ['gender', 'Gender'],
  ['state', 'State'],
]

function rawAnswers(fields: Record<string, unknown>) {
  try {
    const raw = value(fields, 'Raw Channel Response')
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

export default function AdminRecruitmentDashboard() {
  const [secret, setSecret] = useState('')
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('')
  const [note, setNote] = useState('')
  const [stages, setStages] = useState<string[]>([])
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [growthOverview, setGrowthOverview] = useState<GrowthOverview | null>(null)
  const [growthLoading, setGrowthLoading] = useState(false)
  const [attributions, setAttributions] = useState<AttributionRecord[]>([])
  const [associates, setAssociates] = useState<AssociateOption[]>([])
  const [attributionLoading, setAttributionLoading] = useState(false)
  const [selectedAssociates, setSelectedAssociates] = useState<Record<string, string>>({})
  const [leadQueue, setLeadQueue] = useState<LeadQueue | null>(null)
  const [leadQueueLoading, setLeadQueueLoading] = useState(false)
  const [leadBatchSize, setLeadBatchSize] = useState(10)
  const [apifyLoading, setApifyLoading] = useState(false)
  const [apifySector, setApifySector] = useState('NYSC members')
  const [apifyLocation, setApifyLocation] = useState('Nigeria')
  const [apifyLimit, setApifyLimit] = useState(20)
  const [apifyResult, setApifyResult] = useState<ApifyImportResult | null>(null)
  const [automationLoading, setAutomationLoading] = useState(false)
  const [automationResult, setAutomationResult] = useState<DailyAutomationResult | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealthResult | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [repairResult, setRepairResult] = useState<ReferralRepairResult | null>(null)
  const [individualLeadBulk, setIndividualLeadBulk] = useState('')
  const [individualLeadImporting, setIndividualLeadImporting] = useState(false)
  const [individualLeadResult, setIndividualLeadResult] = useState<IndividualLeadImportResult | null>(null)
  const [hrLoading, setHrLoading] = useState<Record<string, boolean>>({})
  const [employmentStartDate, setEmploymentStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [employmentWorkMode, setEmploymentWorkMode] = useState('Hybrid')

  const visibleApplicants = useMemo(() => applicants, [applicants])

  async function load(options?: { quiet?: boolean }) {
    if (!secret) {
      setMessage('Enter the admin secret to load recruitment records.')
      return
    }
    setLoading(true)
    if (!options?.quiet) setMessage('')
    try {
      const params = new URLSearchParams()
      if (stage) params.set('stage', stage)
      if (query) params.set('q', query)
      const response = await fetch(`/api/growth-associate/admin?${params}`, {
        headers: { 'x-nexora-admin-secret': secret },
      })
      const result = (await response.json()) as ApiResult
      if (!response.ok) throw new Error(result.error || 'Could not load applicants.')
      setStages(result.stages || [])
      setApplicants(result.applicants || [])
      setHasLoaded(true)
      if (!options?.quiet) setMessage(`${result.applicants?.length || 0} application${result.applicants?.length === 1 ? '' : 's'} loaded.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load applicants.')
    } finally {
      setLoading(false)
    }
  }

  async function act(applicant: Applicant, action: string) {
    if (!secret) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth-associate/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ id: applicant.id, action, note }),
      })
      const result = (await response.json()) as { error?: string; stage?: string; applicantNotification?: string }
      if (!response.ok) throw new Error(result.error || 'Action failed.')
      await load({ quiet: true })
      setMessage(`Updated ${value(applicant.fields, 'Full Name') || applicant.id} to ${result.stage}. ${result.applicantNotification || ''}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.')
    } finally {
      setLoading(false)
    }
  }

  async function createHrLink(applicant: Applicant) {
    if (!secret) return
    const associateId = linkedRecordId(applicant.fields, 'Created Ambassador')
    if (!associateId) {
      setMessage('Pass the interview first so the official Growth Associate record can be created.')
      return
    }
    setHrLoading((current) => ({ ...current, [associateId]: true }))
    setMessage('')
    try {
      const response = await fetch(`/api/admin/associates/${associateId}/hr-onboarding-link`, {
        method: 'POST',
        headers: { 'x-nexora-admin-secret': secret },
      })
      const result = (await response.json()) as { error?: string; url?: string; notification?: string }
      if (!response.ok) throw new Error(result.error || 'Could not create HR onboarding link.')
      await navigator.clipboard?.writeText(result.url || '')
      setMessage(`HR onboarding link ready and copied: ${result.url}. ${result.notification || ''}`)
      await load({ quiet: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create HR onboarding link.')
    } finally {
      setHrLoading((current) => ({ ...current, [associateId]: false }))
    }
  }

  async function revokeHrLink(applicant: Applicant) {
    if (!secret) return
    const associateId = linkedRecordId(applicant.fields, 'Created Ambassador')
    if (!associateId) return
    setHrLoading((current) => ({ ...current, [associateId]: true }))
    setMessage('')
    try {
      const response = await fetch(`/api/admin/associates/${associateId}/hr-onboarding-link/revoke`, {
        method: 'POST',
        headers: { 'x-nexora-admin-secret': secret },
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not revoke HR onboarding link.')
      setMessage('HR onboarding link revoked.')
      await load({ quiet: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not revoke HR onboarding link.')
    } finally {
      setHrLoading((current) => ({ ...current, [associateId]: false }))
    }
  }

  async function viewEmploymentLetter(applicant: Applicant) {
    if (!secret) return
    const associateId = linkedRecordId(applicant.fields, 'Created Ambassador')
    if (!associateId) {
      setMessage('Pass the interview first so the official Growth Associate record can be created.')
      return
    }
    setHrLoading((current) => ({ ...current, [associateId]: true }))
    setMessage('')
    try {
      const params = new URLSearchParams({
        startDate: employmentStartDate,
        workMode: employmentWorkMode,
      })
      const response = await fetch(`/api/admin/associates/${associateId}/employment-letter?${params}`, {
        headers: { 'x-nexora-admin-secret': secret },
      })
      const html = await response.text()
      if (!response.ok) {
        try {
          const parsed = JSON.parse(html) as { error?: string }
          throw new Error(parsed.error || 'Could not preview employment letter.')
        } catch {
          throw new Error('Could not preview employment letter.')
        }
      }
      const blob = new Blob([html], { type: 'text/html' })
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer')
      setMessage('Employment letter preview opened. Use browser print to save as PDF.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not preview employment letter.')
    } finally {
      setHrLoading((current) => ({ ...current, [associateId]: false }))
    }
  }

  async function saveEmploymentLetter(applicant: Applicant) {
    if (!secret) return
    const associateId = linkedRecordId(applicant.fields, 'Created Ambassador')
    if (!associateId) return
    setHrLoading((current) => ({ ...current, [associateId]: true }))
    setMessage('')
    try {
      const response = await fetch(`/api/admin/associates/${associateId}/employment-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ startDate: employmentStartDate, workMode: employmentWorkMode }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not save employment letter record.')
      setMessage('Employment letter record saved in Airtable.')
      await load({ quiet: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save employment letter record.')
    } finally {
      setHrLoading((current) => ({ ...current, [associateId]: false }))
    }
  }

  async function downloadSignedLetter(applicant: Applicant) {
    if (!secret) return
    const associateId = linkedRecordId(applicant.fields, 'Created Ambassador')
    if (!associateId) return
    setHrLoading((current) => ({ ...current, [associateId]: true }))
    setMessage('')
    try {
      const response = await fetch(`/api/admin/associates/${associateId}/signed-letter/download`, {
        headers: { 'x-nexora-admin-secret': secret },
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(result.error || 'Could not download signed letter.')
      }
      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition') || ''
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || 'signed-employment-letter.pdf'
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setMessage('Signed employment letter downloaded for review.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not download signed letter.')
    } finally {
      setHrLoading((current) => ({ ...current, [associateId]: false }))
    }
  }

  async function reviewSignedLetter(applicant: Applicant, action: 'approve' | 'request-correction' | 'reject') {
    if (!secret) return
    const associateId = linkedRecordId(applicant.fields, 'Created Ambassador')
    if (!associateId) return
    setHrLoading((current) => ({ ...current, [associateId]: true }))
    setMessage('')
    try {
      const response = await fetch(`/api/admin/associates/${associateId}/signed-letter/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ action, note }),
      })
      const result = (await response.json()) as { error?: string; status?: string }
      if (!response.ok) throw new Error(result.error || 'Signed-letter review action failed.')
      setMessage(`Signed-letter review updated: ${result.status}.`)
      await load({ quiet: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Signed-letter review action failed.')
    } finally {
      setHrLoading((current) => ({ ...current, [associateId]: false }))
    }
  }

  async function loadGrowthPerformance(options?: { persist?: boolean }) {
    if (!secret) {
      setMessage('Enter the admin secret to load growth performance.')
      return
    }
    setGrowthLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/performance', {
        method: options?.persist ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: options?.persist ? JSON.stringify({ persist: true }) : undefined,
      })
      const result = (await response.json()) as GrowthOverview | { error?: string; overview?: GrowthOverview }
      if (!response.ok) throw new Error(result.error || 'Could not load growth performance.')
      const overview = 'overview' in result && result.overview ? result.overview : result as GrowthOverview
      setGrowthOverview(overview)
      setMessage(options?.persist ? 'Growth performance recalculated and saved.' : 'Growth performance loaded.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load growth performance.')
    } finally {
      setGrowthLoading(false)
    }
  }

  async function assignLeads(associate: AssociatePerformance, count = 5) {
    if (!secret) return
    setGrowthLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ associateId: associate.associateId, count }),
      })
      const result = (await response.json()) as { error?: string; assignedCount?: number }
      if (!response.ok) throw new Error(result.error || 'Lead assignment failed.')
      setMessage(`Assigned ${result.assignedCount || 0} lead${result.assignedCount === 1 ? '' : 's'} to ${associate.associateName}.`)
      await loadGrowthPerformance()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lead assignment failed.')
    } finally {
      setGrowthLoading(false)
    }
  }

  async function loadAttributionReview() {
    if (!secret) {
      setMessage('Enter the admin secret to load attribution review records.')
      return
    }
    setAttributionLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/attribution-review', {
        headers: { 'x-nexora-admin-secret': secret },
      })
      const result = (await response.json()) as { error?: string; attributions?: AttributionRecord[]; associates?: AssociateOption[] }
      if (!response.ok) throw new Error(result.error || 'Could not load attribution review records.')
      setAttributions(result.attributions || [])
      setAssociates(result.associates || [])
      setMessage(`${result.attributions?.length || 0} attribution review record${result.attributions?.length === 1 ? '' : 's'} loaded.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load attribution review records.')
    } finally {
      setAttributionLoading(false)
    }
  }

  async function reviewAttribution(record: AttributionRecord, action: 'approve' | 'reject' | 'assign') {
    if (!secret) return
    const selectedAssociate = selectedAssociates[record.id] || linkedRecordId(record.fields, 'Associate')
    setAttributionLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/attribution-review', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({
          id: record.id,
          action,
          associateId: selectedAssociate,
          note,
        }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Attribution review action failed.')
      await loadAttributionReview()
      await loadGrowthPerformance()
      setMessage(`Attribution ${action} completed for ${value(record.fields, 'Payment Reference') || record.id}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Attribution review action failed.')
    } finally {
      setAttributionLoading(false)
    }
  }

  async function loadLeadQueue() {
    if (!secret) {
      setMessage('Enter the admin secret to load the lead queue.')
      return
    }
    setLeadQueueLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/lead-queue', {
        headers: { 'x-nexora-admin-secret': secret },
      })
      const result = (await response.json()) as LeadQueue & { error?: string }
      if (!response.ok) throw new Error(result.error || 'Lead queue could not be loaded.')
      setLeadQueue(result)
      setMessage(`${result.totalAvailable || 0} unassigned lead${result.totalAvailable === 1 ? '' : 's'} available for ${result.associateCount || 0} associate${result.associateCount === 1 ? '' : 's'}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lead queue could not be loaded.')
    } finally {
      setLeadQueueLoading(false)
    }
  }

  async function assignDailyQueue(dryRun = false) {
    if (!secret) return
    setLeadQueueLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/lead-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ countPerAssociate: leadBatchSize, dryRun }),
      })
      const result = (await response.json()) as LeadQueue & { error?: string; totalAssigned?: number; estimatedAssignable?: number }
      if (!response.ok) throw new Error(result.error || 'Daily queue assignment failed.')
      if (dryRun) {
        setLeadQueue(result)
        setMessage(`Dry run: ${result.estimatedAssignable || 0} lead${result.estimatedAssignable === 1 ? '' : 's'} can be assigned.`)
      } else {
        setMessage(`Daily queue assigned: ${result.totalAssigned || 0} lead${result.totalAssigned === 1 ? '' : 's'} distributed.`)
        await loadLeadQueue()
        await loadGrowthPerformance()
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Daily queue assignment failed.')
    } finally {
      setLeadQueueLoading(false)
    }
  }

  async function importApifyLeads() {
    if (!secret) {
      setMessage('Enter the admin secret to import Apify leads.')
      return
    }
    setApifyLoading(true)
    setMessage('')
    setApifyResult(null)
    try {
      const response = await fetch('/api/growth/apify-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({
          sector: apifySector,
          location: apifyLocation,
          query: apifySector,
          limit: apifyLimit,
        }),
      })
      const result = (await response.json()) as ApifyImportResult
      if (!response.ok) throw new Error(result.error || 'Apify lead import failed.')
      setApifyResult(result)
      setMessage(`Apify import complete: ${result.imported?.length || 0} imported, ${result.skipped?.length || 0} skipped.`)
      await loadLeadQueue()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Apify lead import failed.')
    } finally {
      setApifyLoading(false)
    }
  }

  async function runDailyAutomation(dryRun = true) {
    if (!secret) {
      setMessage('Enter the admin secret to run daily automation.')
      return
    }
    setAutomationLoading(true)
    setMessage('')
    setAutomationResult(null)
    try {
      const response = await fetch('/api/growth/daily-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({
          dryRun,
          sectors: [apifySector],
          locations: [apifyLocation],
          importLimit: apifyLimit,
          countPerAssociate: leadBatchSize,
        }),
      })
      const result = (await response.json()) as DailyAutomationResult
      if (!response.ok) throw new Error(result.error || 'Daily automation failed.')
      setAutomationResult(result)
      setLeadQueue(result.queueAfterAssignment || result.queueBeforeAssignment)
      const imported = result.imports?.reduce((sum, item) => sum + (item.imported || 0), 0) || 0
      const assigned = result.assignment?.totalAssigned || 0
      setMessage(dryRun
        ? `Automation dry run ready: ${result.estimatedAssignable || 0} lead${result.estimatedAssignable === 1 ? '' : 's'} can be assigned.`
        : `Daily automation complete: ${imported} imported, ${assigned} assigned.`)
      if (!dryRun) await loadGrowthPerformance()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Daily automation failed.')
    } finally {
      setAutomationLoading(false)
    }
  }

  async function loadSystemHealth() {
    if (!secret) {
      setMessage('Enter the admin secret to load system health.')
      return
    }
    setHealthLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/system-health', {
        headers: { 'x-nexora-admin-secret': secret },
      })
      const result = (await response.json()) as SystemHealthResult
      if (!response.ok) throw new Error(result.error || 'System health check failed.')
      setSystemHealth(result)
      setMessage(`${result.issueCount || 0} system health issue${result.issueCount === 1 ? '' : 's'} found.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'System health check failed.')
    } finally {
      setHealthLoading(false)
    }
  }

  async function runReferralRepair(apply = false) {
    if (!secret) {
      setMessage('Enter the admin secret to run referral repair.')
      return
    }
    setHealthLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/referral-repair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ apply, actor: 'growth-admin-dashboard' }),
      })
      const result = (await response.json()) as ReferralRepairResult
      if (!response.ok) throw new Error(result.error || 'Referral repair failed.')
      setRepairResult(result)
      setMessage(apply
        ? `Referral repair applied: ${result.repaired || 0} repaired, ${result.failed || 0} failed.`
        : `Referral repair dry run: ${result.wouldRepair || 0} would be repaired.`)
      await loadSystemHealth()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Referral repair failed.')
    } finally {
      setHealthLoading(false)
    }
  }

  async function generateMissingReferral(associateId: string) {
    if (!secret) return
    setHealthLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/growth/system-health', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ action: 'generate_missing_referral', associateId, actor: 'growth-admin-dashboard' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Referral generation failed.')
      setMessage('Missing referral generated.')
      await loadSystemHealth()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Referral generation failed.')
    } finally {
      setHealthLoading(false)
    }
  }

  async function importIndividualLeads() {
    if (!secret) {
      setMessage('Enter the admin secret to import individual leads.')
      return
    }
    if (!individualLeadBulk.trim()) {
      setMessage('Paste at least one individual lead before importing.')
      return
    }
    setIndividualLeadImporting(true)
    setMessage('')
    setIndividualLeadResult(null)
    try {
      const response = await fetch('/api/growth/individual-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nexora-admin-secret': secret,
        },
        body: JSON.stringify({ bulk: individualLeadBulk }),
      })
      const result = (await response.json()) as IndividualLeadImportResult
      if (!response.ok) throw new Error(result.error || 'Individual lead import failed.')
      setIndividualLeadResult(result)
      setMessage(`Individual leads imported: ${result.imported || 0} imported, ${result.skipped || 0} skipped, ${result.failed || 0} failed.`)
      await loadLeadQueue()
      await loadSystemHealth()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Individual lead import failed.')
    } finally {
      setIndividualLeadImporting(false)
    }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem('nexora-growth-admin-secret') || ''
    setSecret(saved)
  }, [])

  useEffect(() => {
    if (secret) window.localStorage.setItem('nexora-growth-admin-secret', secret)
  }, [secret])

  return (
    <main className="min-h-screen bg-[#020812] px-5 py-24 text-white md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Private recruitment command center</span>
            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Growth Associate Recruitment</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-steel md:text-base">
              Review applications, shortlist candidates, track interview and bootcamp stages, then activate official associates with referral tools.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-steel">
            <ShieldCheck className="h-5 w-5 text-[#7fd3a6]" />
            Admin only
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr_auto]">
          <label className="grid gap-2 text-sm text-steel">
            Admin secret
            <span className="flex min-h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-4 focus-within:border-signal">
              <input
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                type={showSecret ? 'text' : 'password'}
                className="min-w-0 flex-1 bg-transparent text-white outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSecret((current) => !current)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-steel transition hover:bg-white/10 hover:text-white"
                aria-label={showSecret ? 'Hide admin secret' : 'Show admin secret'}
                title={showSecret ? 'Hide admin secret' : 'Show admin secret'}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
          <label className="grid gap-2 text-sm text-steel">
            Stage
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="min-h-12 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-white outline-none focus:border-signal">
              <option value="">All stages</option>
              {stages.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-steel">
            Search
            <span className="flex min-h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-4">
              <Search className="h-4 w-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-white outline-none" />
            </span>
          </label>
          <button onClick={() => load()} disabled={loading} className="button-primary mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Load
          </button>
        </div>

        <label className="mt-5 grid gap-2 text-sm text-steel">
          Admin note for next action
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-white outline-none focus:border-signal" />
        </label>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">HR letter settings</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-steel">
              Employment start date
              <input
                type="date"
                value={employmentStartDate}
                onChange={(event) => setEmploymentStartDate(event.target.value)}
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-white outline-none focus:border-signal"
              />
            </label>
            <label className="grid gap-2 text-sm text-steel">
              Work mode
              <select
                value={employmentWorkMode}
                onChange={(event) => setEmploymentWorkMode(event.target.value)}
                className="min-h-11 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-white outline-none focus:border-signal"
              >
                <option>Hybrid</option>
                <option>Remote</option>
                <option>Field</option>
              </select>
            </label>
          </div>
        </div>

        <div aria-live="polite" className="min-h-8 pt-5 text-sm font-semibold text-[#9ec2f7]">{message}</div>

        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">System Health</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Associate referrals and individual growth readiness</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
                Detects approved associates missing referral IDs, incomplete records, duplicate codes, and lead-quality issues without changing production data.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={loadSystemHealth} disabled={healthLoading || !secret} className="button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
                Recheck health
              </button>
              <button onClick={() => runReferralRepair(false)} disabled={healthLoading || !secret} className="button-secondary inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                Referral dry run
              </button>
              <button onClick={() => runReferralRepair(true)} disabled={healthLoading || !secret} className="button-primary inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                Repair missing referrals
              </button>
            </div>
          </div>

          {systemHealth ? (
            <div className="mt-6 grid gap-5">
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Issues" value={String(systemHealth.issueCount || 0)} />
                <MetricCard label="Associates scanned" value={String(systemHealth.associatesScanned || 0)} />
                <MetricCard label="Registrations scanned" value={String(systemHealth.registrationsScanned || 0)} />
                <MetricCard label="Leads scanned" value={String(systemHealth.leadsScanned || 0)} />
              </div>
              {repairResult ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard label={repairResult.dryRun ? 'Would repair' : 'Repaired'} value={String(repairResult.dryRun ? repairResult.wouldRepair || 0 : repairResult.repaired || 0)} />
                  <MetricCard label="Valid" value={String(repairResult.valid || 0)} />
                  <MetricCard label="Skipped" value={String(repairResult.skipped || 0)} />
                  <MetricCard label="Failed" value={String(repairResult.failed || 0)} />
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="min-w-[980px] w-full border-collapse text-left text-sm">
                  <thead className="bg-black/30 text-xs uppercase tracking-[0.12em] text-steel">
                    <tr>
                      <th className="p-3">Record</th>
                      <th className="p-3">Issue</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemHealth.issues?.slice(0, 40).map((issue) => (
                      <tr key={issue.id} className="border-t border-white/10 align-top">
                        <td className="p-3">
                          <p className="font-semibold text-white">{issue.name}</p>
                          <p className="mt-1 text-xs text-steel">{issue.recordId}</p>
                        </td>
                        <td className="p-3 text-steel">{issue.code}</td>
                        <td className="p-3 text-steel">{issue.severity}</td>
                        <td className="p-3 text-steel">{issue.message}</td>
                        <td className="p-3">
                          {issue.entity === 'Ambassadors' && ['MISSING_REFERRAL_CODE', 'MISSING_REFERRAL_LINK'].includes(issue.code) ? (
                            <button onClick={() => generateMissingReferral(issue.recordId)} disabled={healthLoading} className="button-secondary min-h-9 rounded-lg px-3 text-xs font-bold disabled:opacity-60">
                              Generate referral
                            </button>
                          ) : <span className="text-xs text-steel">Review</span>}
                        </td>
                      </tr>
                    ))}
                    {!systemHealth.issues?.length ? (
                      <tr><td colSpan={5} className="p-5 text-center text-steel">No system health issues found.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">Individual Lead Importer</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Add qualified Career Accelerator leads</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
                Paste one lead per line. Format: Full name, Audience type, Public profile URL, Source URL, Observable evidence, Institution, Course, Level, NYSC status, State, Career interest, Programme match, Email, Phone.
              </p>
            </div>
            <button onClick={importIndividualLeads} disabled={individualLeadImporting || !secret} className="button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${individualLeadImporting ? 'animate-spin' : ''}`} />
              Import leads
            </button>
          </div>
          <textarea
            value={individualLeadBulk}
            onChange={(event) => setIndividualLeadBulk(event.target.value)}
            rows={7}
            placeholder={'Example:\nAmina Yusuf,NYSC_MEMBER,https://linkedin.com/in/example,https://source.example/post,\"Currently serving NYSC and asking for UI/UX portfolio guidance\",University of Lagos,Computer Science,,Currently serving,Lagos,UI/UX,Certified UI/UX Designer,,\nTunde Ade,FINAL_YEAR_STUDENT,https://x.com/example,https://x.com/example/status/1,\"Final-year student looking for internship and digital skills\",OOU,Accounting,400 level,,Ogun,Financial analysis,AI Financial Analyst,,'}
            className="mt-5 w-full rounded-lg border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-signal"
          />
          {individualLeadResult ? (
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <MetricCard label="Received" value={String(individualLeadResult.received || 0)} />
              <MetricCard label="Imported" value={String(individualLeadResult.imported || 0)} />
              <MetricCard label="Skipped" value={String(individualLeadResult.skipped || 0)} />
              <MetricCard label="Failed" value={String(individualLeadResult.failed || 0)} />
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">Individual lead generation</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Generate Career Accelerator leads</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
                Version 1 is restricted to individual Career Accelerator audiences: NYSC members, final-year students, and recent graduates. Business, restaurant, SME, and corporate discovery are disabled by feature flags.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={importApifyLeads} disabled={apifyLoading || !secret} className="button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${apifyLoading ? 'animate-spin' : ''}`} />
                Run Apify import
              </button>
              <button onClick={() => runDailyAutomation(true)} disabled={automationLoading || !secret} className="button-secondary inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                Automation dry run
              </button>
              <button onClick={() => runDailyAutomation(false)} disabled={automationLoading || !secret} className="button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${automationLoading ? 'animate-spin' : ''}`} />
                Run daily automation
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_160px]">
            <label className="grid gap-2 text-sm text-steel">
              Audience / search
              <input value={apifySector} onChange={(event) => setApifySector(event.target.value)} className="min-h-11 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-white outline-none focus:border-signal" />
            </label>
            <label className="grid gap-2 text-sm text-steel">
              Location
              <input value={apifyLocation} onChange={(event) => setApifyLocation(event.target.value)} className="min-h-11 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-white outline-none focus:border-signal" />
            </label>
            <label className="grid gap-2 text-sm text-steel">
              Limit
              <input type="number" min={1} max={100} value={apifyLimit} onChange={(event) => setApifyLimit(Number(event.target.value || 20))} className="min-h-11 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-white outline-none focus:border-signal" />
            </label>
          </div>

          {apifyResult ? (
            <div className="mt-5 grid gap-4 md:grid-cols-5">
              <MetricCard label="Received" value={String(apifyResult.received || 0)} />
              <MetricCard label="Normalized" value={String(apifyResult.normalized || 0)} />
              <MetricCard label="Imported" value={String(apifyResult.imported?.length || 0)} />
              <MetricCard label="Duplicates skipped" value={String(apifyResult.skipped?.length || 0)} />
              <MetricCard label="Failed" value={String(apifyResult.failed?.length || 0)} />
            </div>
          ) : null}

          {automationResult ? (
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <MetricCard label="Automation searches" value={String(automationResult.importPlan?.length || 0)} />
              <MetricCard label="Imported by automation" value={String(automationResult.imports?.reduce((sum, item) => sum + (item.imported || 0), 0) || 0)} />
              <MetricCard label="Assignable" value={String(automationResult.estimatedAssignable || 0)} />
              <MetricCard label="Assigned" value={String(automationResult.assignment?.totalAssigned || 0)} />
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">Daily lead queue</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Preview and assign individual outreach leads</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
                Shows unassigned individual Career Accelerator leads only. Batch assignment gives up to 10 qualified leads and blocks new batches until enough leads have been meaningfully processed.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-steel">
                Leads per associate
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={leadBatchSize}
                  onChange={(event) => setLeadBatchSize(Number(event.target.value || 5))}
                  className="min-h-11 w-28 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-sm text-white outline-none focus:border-signal"
                />
              </label>
              <button onClick={loadLeadQueue} disabled={leadQueueLoading || !secret} className="button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${leadQueueLoading ? 'animate-spin' : ''}`} />
                Preview
              </button>
              <button onClick={() => assignDailyQueue(true)} disabled={leadQueueLoading || !secret} className="button-secondary inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                Dry run
              </button>
              <button onClick={() => assignDailyQueue(false)} disabled={leadQueueLoading || !secret} className="button-primary inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                Assign queue
              </button>
            </div>
          </div>

          {leadQueue ? (
            <div className="mt-6 grid gap-5">
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Unassigned leads" value={String(leadQueue.totalAvailable || 0)} />
                <MetricCard label="Active associates" value={String(leadQueue.associateCount || 0)} />
                <MetricCard label="Possible assignment" value={String(leadQueue.estimatedAssignable ?? Math.min((leadQueue.totalAvailable || 0), (leadQueue.associateCount || 0) * leadBatchSize))} />
                <MetricCard label="Sector spread" value={String(leadQueue.sectors?.length || 0)} />
              </div>
              <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8fb7f3]">Sectors</p>
                  <div className="mt-3 grid gap-2">
                    {leadQueue.sectors?.slice(0, 12).map((item) => (
                      <div key={item.name} className="flex justify-between gap-4 text-sm text-steel">
                        <span>{item.name}</span>
                        <span className="font-semibold text-white">{item.count}</span>
                      </div>
                    ))}
                    {!leadQueue.sectors?.length ? <p className="text-sm text-steel">No sectors available.</p> : null}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                    <thead className="bg-black/30 text-xs uppercase tracking-[0.12em] text-steel">
                      <tr>
                        <th className="p-3">Lead</th>
                        <th className="p-3">Sector</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadQueue.sample?.map((lead) => (
                        <tr key={lead.id} className="border-t border-white/10">
                          <td className="p-3 text-white">{lead.name}</td>
                          <td className="p-3 text-steel">{lead.sector}</td>
                          <td className="p-3 text-steel">{lead.location || 'Unknown'}</td>
                          <td className="p-3 text-steel">{lead.status}</td>
                          <td className="p-3 text-steel">{lead.score || '-'}</td>
                        </tr>
                      ))}
                      {!leadQueue.sample?.length ? (
                        <tr><td colSpan={5} className="p-5 text-center text-steel">No unassigned leads available.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">Referral attribution review</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Conflicts, held commissions and manual credit</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
                Review payments where referral code and assigned lead ownership need a final admin decision before commission or leaderboard credit is counted.
              </p>
            </div>
            <button onClick={loadAttributionReview} disabled={attributionLoading || !secret} className="button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${attributionLoading ? 'animate-spin' : ''}`} />
              Load review
            </button>
          </div>

          {attributions.length ? (
            <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                <thead className="bg-black/30 text-xs uppercase tracking-[0.12em] text-steel">
                  <tr>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Current credit</th>
                    <th className="p-3">Resolve to</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attributions.map((record) => {
                    const fields = record.fields
                    const currentAssociate = linkedRecordId(fields, 'Associate')
                    const selected = selectedAssociates[record.id] || currentAssociate
                    return (
                      <tr key={record.id} className="border-t border-white/10 align-top">
                        <td className="p-3">
                          <p className="font-semibold text-white">{value(fields, 'Payment Reference') || record.id}</p>
                          <p className="mt-1 text-xs text-steel">{record.id}</p>
                        </td>
                        <td className="p-3">
                          <span className="rounded-full border border-[#f2c979]/30 bg-[#f2c979]/10 px-3 py-1 text-xs font-bold text-[#f6d999]">
                            {value(fields, 'Attribution Status') || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3 text-steel">{value(fields, 'Attribution Source') || 'Not set'}</td>
                        <td className="p-3 text-frost">NGN {Number(value(fields, 'Attributed Amount') || 0).toLocaleString()}</td>
                        <td className="p-3 text-steel">{currentAssociate || 'No associate linked'}</td>
                        <td className="p-3">
                          <select
                            value={selected}
                            onChange={(event) => setSelectedAssociates((current) => ({ ...current, [record.id]: event.target.value }))}
                            className="min-h-10 w-full rounded-lg border border-white/10 bg-[#07111f] px-3 text-white outline-none focus:border-signal"
                          >
                            <option value="">Select associate</option>
                            {associates.map((associate) => (
                              <option key={associate.id} value={associate.id}>
                                {associate.name}{associate.referralCode ? ` - ${associate.referralCode}` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="max-w-[260px] p-3 text-steel">{short(value(fields, 'Conflict Reason'), 220) || 'No conflict reason.'}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => reviewAttribution(record, currentAssociate === selected ? 'approve' : 'assign')}
                              disabled={attributionLoading}
                              className="min-h-9 rounded-lg border border-[#7fd3a6]/40 bg-[#7fd3a6]/10 px-3 text-xs font-bold text-[#b7f0ce] disabled:opacity-50"
                            >
                              {currentAssociate === selected ? 'Approve' : 'Assign credit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => reviewAttribution(record, 'reject')}
                              disabled={attributionLoading}
                              className="min-h-9 rounded-lg border border-[#ff9b91]/40 bg-[#ff9b91]/10 px-3 text-xs font-bold text-[#ffc5bf] disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-white/10 p-5 text-sm text-steel">
              No attribution review records loaded yet. Click Load review to check for pending or conflicted records.
            </p>
          )}
        </section>

        <section className="mt-4 rounded-lg border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">Growth operations</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Monthly targets, ranking and provisional bonus</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
                Backend-calculated performance based on attributed paid intake. Default monthly target is 30 confirmed paid intakes per associate.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => loadGrowthPerformance()} disabled={growthLoading || !secret} className="button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${growthLoading ? 'animate-spin' : ''}`} />
                Load performance
              </button>
              <button onClick={() => loadGrowthPerformance({ persist: true })} disabled={growthLoading || !secret} className="button-primary inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-bold disabled:opacity-60">
                Recalculate month
              </button>
            </div>
          </div>

          {growthOverview ? (
            <div className="mt-6 grid gap-5">
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Active associates" value={String(growthOverview.totals.activeAssociates)} />
                <MetricCard label="Confirmed intake" value={`${growthOverview.totals.confirmedIntake}/${growthOverview.totals.target}`} />
                <MetricCard label="Net revenue" value={`NGN ${growthOverview.totals.netRevenue.toLocaleString()}`} />
                <MetricCard label="Bonus winners" value={String(growthOverview.bonusConfiguration.numberOfWinners)} />
              </div>

              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="min-w-[980px] w-full border-collapse text-left text-sm">
                  <thead className="bg-black/30 text-xs uppercase tracking-[0.12em] text-steel">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Associate</th>
                      <th className="p-3">Intake</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3">Bonus</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growthOverview.associates.map((associate) => (
                      <tr key={associate.associateId} className="border-t border-white/10">
                        <td className="p-3 text-white">{associate.rank || '-'}</td>
                        <td className="p-3">
                          <p className="font-semibold text-white">{associate.associateName}</p>
                          <p className="mt-1 text-xs text-steel">{associate.referralCode || 'No referral code'}</p>
                        </td>
                        <td className="p-3 text-frost">{associate.confirmedIntake}</td>
                        <td className="p-3 text-steel">{associate.target}</td>
                        <td className="p-3 text-steel">{Math.round(associate.achievementPercentage * 100)}% | {associate.remainingTarget} left</td>
                        <td className="p-3"><span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-bold text-frost">{associate.status}</span></td>
                        <td className="p-3 text-steel">NGN {associate.netRevenue.toLocaleString()}</td>
                        <td className="p-3 text-steel">{associate.bonusEligible ? `Eligible${associate.provisionalBonusAmount ? ` - NGN ${associate.provisionalBonusAmount.toLocaleString()}` : ''}` : 'Not eligible'}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => assignLeads(associate, 5)}
                            disabled={growthLoading}
                            className="min-h-9 rounded-lg border border-[#5793ff]/40 bg-[#5793ff]/10 px-3 text-xs font-bold text-[#bcd6ff] disabled:opacity-50"
                          >
                            Assign 5 leads
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs leading-6 text-steel">
                Month: {growthOverview.month}. Bonus config: {growthOverview.bonusConfiguration.name}, type {growthOverview.bonusConfiguration.bonusType}, minimum target required: {growthOverview.bonusConfiguration.minimumTargetRequired ? 'Yes' : 'No'}.
              </p>
            </div>
          ) : null}
        </section>

        <div className="mt-4 grid gap-5">
          {visibleApplicants.map((applicant) => {
            const fields = applicant.fields
            const currentStage = value(fields, 'Recruitment Stage') || value(fields, 'Registration Status') || 'Application Received'
            const score = Number(value(fields, 'AI Score') || 0)
            const video = rawAnswer(fields, 'videoAssessmentLink')
            const associateId = linkedRecordId(fields, 'Created Ambassador')
            const isHrBusy = associateId ? Boolean(hrLoading[associateId]) : false
            return (
              <article key={applicant.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold">{value(fields, 'Full Name') || 'Unnamed applicant'}</h2>
                      <span className="rounded-full border border-[#5793ff]/40 bg-[#5793ff]/10 px-3 py-1 text-xs font-bold uppercase text-[#9ec2f7]">{currentStage}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold uppercase text-steel">Score {score}/100</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-steel">
                      {value(fields, 'Email') || 'No email'} | {value(fields, 'Phone Number') || value(fields, 'WhatsApp Number') || 'No phone'} | {value(fields, 'Location') || 'No location'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-steel">
                      {value(fields, 'Current Status') || 'No status'} | {value(fields, 'Institution or Organization') || 'No institution'} | Reach: {value(fields, 'Estimated Reach') || '0'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-sm font-semibold">
                    {value(fields, 'AI Recommendation') === 'Strong Candidate' ? <CheckCircle2 className="h-5 w-5 text-[#7fd3a6]" /> : value(fields, 'AI Recommendation') === 'Not Recommended' ? <XCircle className="h-5 w-5 text-[#ff9b91]" /> : <Clock3 className="h-5 w-5 text-[#f2c979]" />}
                    <span>Screening: {value(fields, 'AI Recommendation') || 'Not scored'}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <Info title="Strengths" body={short(value(fields, 'AI Strengths'), 260)} />
                  <Info title="Weaknesses" body={short(value(fields, 'AI Weaknesses'), 260)} />
                  <Info title="Interview questions" body={short(value(fields, 'AI Interview Questions'), 260)} />
                </div>

                <div className="mt-5 grid gap-3 text-sm text-steel md:grid-cols-2">
                  <p><span className="font-semibold text-white">Motivation:</span> {short(value(fields, 'Why Become an Ambassador?'), 240) || 'Not provided'}</p>
                  <p><span className="font-semibold text-white">Networks:</span> {short(value(fields, 'Communities or Networks'), 240) || 'Not provided'}</p>
                  {video ? <a href={video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#9ec2f7]"><ExternalLink className="h-4 w-4" /> Open video assessment</a> : <p>No video assessment link.</p>}
                  {value(fields, 'Calendly Invite Link') ? <a href={value(fields, 'Calendly Invite Link')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#9ec2f7]"><ExternalLink className="h-4 w-4" /> Open interview invite</a> : <p>No interview invite link yet.</p>}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedApplicant(applicant)}
                    className="min-h-10 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-sm font-bold text-white transition hover:border-[#9ec2f7]/50"
                  >
                    View full application
                  </button>
                  {actions.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => act(applicant, item.key)}
                      disabled={loading}
                      className={`min-h-10 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60 ${item.tone === 'green' ? 'border-[#7fd3a6]/40 bg-[#7fd3a6]/10 text-[#b7f0ce]' : item.tone === 'red' ? 'border-[#ff9b91]/40 bg-[#ff9b91]/10 text-[#ffc5bf]' : item.tone === 'blue' ? 'border-[#5793ff]/40 bg-[#5793ff]/10 text-[#bcd6ff]' : 'border-white/10 bg-white/[0.035] text-white'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {associateId ? (
                  <div className="mt-5 rounded-lg border border-[#5793ff]/20 bg-[#5793ff]/5 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8fb7f3]">HR onboarding</p>
                        <p className="mt-1 text-sm text-steel">Official associate record: {associateId}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => createHrLink(applicant)}
                          disabled={isHrBusy}
                          className="min-h-10 rounded-lg border border-[#5793ff]/40 bg-[#5793ff]/10 px-4 text-xs font-bold text-[#bcd6ff] disabled:opacity-60"
                        >
                          Send HR link
                        </button>
                        <button
                          type="button"
                          onClick={() => viewEmploymentLetter(applicant)}
                          disabled={isHrBusy}
                          className="min-h-10 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-white disabled:opacity-60"
                        >
                          Preview letter
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEmploymentLetter(applicant)}
                          disabled={isHrBusy}
                          className="min-h-10 rounded-lg border border-[#7fd3a6]/40 bg-[#7fd3a6]/10 px-4 text-xs font-bold text-[#b7f0ce] disabled:opacity-60"
                        >
                          Save letter record
                        </button>
                        <button
                          type="button"
                          onClick={() => revokeHrLink(applicant)}
                          disabled={isHrBusy}
                          className="min-h-10 rounded-lg border border-[#ff9b91]/40 bg-[#ff9b91]/10 px-4 text-xs font-bold text-[#ffc5bf] disabled:opacity-60"
                        >
                          Revoke link
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8fb7f3]">Signed-copy verification</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => downloadSignedLetter(applicant)}
                          disabled={isHrBusy}
                          className="min-h-10 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-white disabled:opacity-60"
                        >
                          Download submitted copy
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewSignedLetter(applicant, 'approve')}
                          disabled={isHrBusy}
                          className="min-h-10 rounded-lg border border-[#7fd3a6]/40 bg-[#7fd3a6]/10 px-4 text-xs font-bold text-[#b7f0ce] disabled:opacity-60"
                        >
                          Approve signed letter
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewSignedLetter(applicant, 'request-correction')}
                          disabled={isHrBusy}
                          className="min-h-10 rounded-lg border border-[#f2c979]/40 bg-[#f2c979]/10 px-4 text-xs font-bold text-[#f6d999] disabled:opacity-60"
                        >
                          Request correction
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewSignedLetter(applicant, 'reject')}
                          disabled={isHrBusy}
                          className="min-h-10 rounded-lg border border-[#ff9b91]/40 bg-[#ff9b91]/10 px-4 text-xs font-bold text-[#ffc5bf] disabled:opacity-60"
                        >
                          Reject document
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
          {!loading && !visibleApplicants.length ? (
            <p className="rounded-lg border border-white/10 p-8 text-center text-steel">
              {hasLoaded ? 'No applications match the current search or stage filter.' : 'Enter the admin secret, leave Stage as All stages, then click Load to show applications.'}
            </p>
          ) : null}
        </div>
      </section>
      {selectedApplicant ? <ApplicationModal applicant={selectedApplicant} onClose={() => setSelectedApplicant(null)} /> : null}
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase text-[#8fb7f3]">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-steel">{body || 'Not available.'}</p>
    </div>
  )
}

function ApplicationModal({ applicant, onClose }: { applicant: Applicant; onClose: () => void }) {
  const fields = applicant.fields
  const answers = rawAnswers(fields)
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl rounded-lg border border-white/10 bg-[#07111f] p-5 text-white shadow-2xl md:p-8">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-[#8fb7f3]">Full application</p>
            <h2 className="mt-2 text-2xl font-semibold">{value(fields, 'Full Name') || 'Unnamed applicant'}</h2>
            <p className="mt-2 text-sm text-steel">{value(fields, 'Email') || 'No email'} | {value(fields, 'Phone Number') || value(fields, 'WhatsApp Number') || 'No phone'}</p>
          </div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {questionLabels.map(([key, label]) => {
            const answer = answers[key]
            const body = typeof answer === 'string' || typeof answer === 'number' || typeof answer === 'boolean'
              ? String(answer)
              : ''
            return (
              <div key={key} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase text-[#8fb7f3]">{label}</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-steel">{body || 'Not provided'}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-bold uppercase text-[#8fb7f3]">AI screening summary</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-steel">{value(fields, 'AI Screening Summary') || 'No screening summary available.'}</p>
        </div>
      </div>
    </div>
  )
}
