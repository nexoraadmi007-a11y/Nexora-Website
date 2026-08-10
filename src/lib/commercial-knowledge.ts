import { batpDeliverables, batpFaqs, batpIndustries, batpPillars } from './business-transformation-program'
import { careerAcceleratorTracks, careerTrackBasePrice } from './career-accelerator-v2'

export type ProspectSegment = 'INDIVIDUAL_CAREER' | 'BUSINESS_OWNER' | 'CORPORATE' | 'UNKNOWN'
export type ProgrammeFamily = 'CAREER_ACCELERATOR' | 'BUSINESS_TRANSFORMATION' | 'CORPORATE_AI_TRAINING'
export type KnowledgeApprovalStatus = 'APPROVED' | 'PENDING_ADMIN_APPROVAL'

export type CommercialTrack = {
  id: string
  slug: string
  name: string
  description: string
  duration: string
  currentPrice: number
  currency: 'NGN'
  priceBasis: string
  modules: Array<{ title: string; lessons: string[] }>
  projects: string[]
  capstone: string
  outcomes: string[]
  requirements: string[]
  applicationUrl: string
  paymentUrl: string
}

export type CommercialProgramme = {
  id: string
  slug: string
  name: string
  programmeFamily: ProgrammeFamily
  prospectType: ProspectSegment
  description: string
  targetAudience: string[]
  duration: string
  currentPrice: number
  currency: 'NGN'
  priceBasis: string
  active: boolean
  enrolmentOpen: boolean
  startDate: string
  deliveryMode: string
  applicationUrl: string
  paymentUrl: string
  overviewUrl: string
  modules: Array<{ title: string; lessons: string[] }>
  projects: string[]
  capstone: string
  outcomes: string[]
  requirements: string[]
  deviceRequirements: string
  certificateDetails: string
  supportDetails: string
  approvedValuePoints: string[]
  prohibitedClaims: string[]
  tracks: CommercialTrack[]
  faqs: Array<{ question: string; answer: string }>
  sourceUrl: string
  sourceVersion: string
  lastSyncedAt: string
  approvedAt: string
  approvedBy: string
}

export type KnowledgeConflict = {
  type: 'KNOWLEDGE_CONFLICT'
  field: string
  websiteValue: string
  databaseValue: string
  hardCodedValue: string
  lastUpdatedTime: string
  recommendedResolution: string
  adminApprovalStatus: KnowledgeApprovalStatus
}

export type CommercialKnowledgeSnapshot = {
  version: string
  status: 'APPROVED'
  generatedAt: string
  approvedAt: string
  approvedBy: string
  programmes: CommercialProgramme[]
  conflicts: KnowledgeConflict[]
  sync: {
    source: 'LOCAL_APPROVED_SNAPSHOT'
    websiteUrl: string
    lastSuccessfulSyncAt: string
    lastFailedSyncAt: string
    scheduledSync: 'every 6 hours'
  }
}

type WebsiteProgrammeFacts = {
  sourceUrl: string
  extractedAt: string
  careerPrice?: number
  careerProgrammeCount?: number
  businessPrice?: number
  businessDuration?: string
  rawMatches: string[]
  error?: string
}

const now = '2026-07-30T00:00:00.000Z'
const websiteBaseUrl = 'https://www.nexoragroup.ink'
const careerApplicationUrl = '/career-accelerator'
const businessApplicationUrl = '/business-transformation'

function ngn(value: number) {
  return `NGN ${value.toLocaleString('en-NG')}`
}

function careerProgramme(): CommercialProgramme {
  const tracks: CommercialTrack[] = careerAcceleratorTracks.map((track) => ({
    id: track.code,
    slug: track.slug,
    name: track.title,
    description: track.description,
    duration: track.duration,
    currentPrice: track.price,
    currency: 'NGN',
    priceBasis: 'per programme',
    modules: track.modules,
    projects: track.projects,
    capstone: track.capstone,
    outcomes: track.outcomes,
    requirements: ['Complete assignments', 'Complete capstone project', 'Participate in guided learning activities'],
    applicationUrl: `/career-accelerator/${track.slug}#enroll`,
    paymentUrl: '/api/paystack/initialize',
  }))

  return {
    id: 'career-accelerator',
    slug: 'career-accelerator',
    name: 'AI Income Accelerator',
    programmeFamily: 'CAREER_ACCELERATOR',
    prospectType: 'INDIVIDUAL_CAREER',
    description: 'A flagship skills-to-income accelerator helping young Africans learn practical AI-powered skills, build proof of work, package services, and prepare for future work opportunities.',
    targetAudience: ['Undergraduates', 'Final-year students', 'NYSC members', 'Recent graduates', 'Early-career professionals', 'Career builders'],
    duration: '4 weeks per programme',
    currentPrice: careerTrackBasePrice,
    currency: 'NGN',
    priceBasis: 'per programme',
    active: true,
    enrolmentOpen: true,
    startDate: 'Next cohort',
    deliveryMode: 'Online and guided practical delivery',
    applicationUrl: careerApplicationUrl,
    paymentUrl: '/api/paystack/initialize',
    overviewUrl: `${websiteBaseUrl}/career-accelerator`,
    modules: [],
    projects: tracks.flatMap((track) => track.projects),
    capstone: 'Each selected programme includes a reviewed capstone project.',
    outcomes: ['Practical AI skill development', 'Portfolio-ready project work', 'Income-readiness foundations', 'Career direction clarity', 'Certificate after successful completion'],
    requirements: ['Commitment to assignments', 'Internet access', 'Laptop recommended for serious project work'],
    deviceRequirements: 'Phone can support learning and communication, but a laptop is recommended for project work.',
    certificateDetails: 'Certificate is issued after assignments, portfolio assets, and final capstone are reviewed.',
    supportDetails: 'Guided learning support, feedback, accountability, and project review.',
    approvedValuePoints: ['Structured learning path', 'Practical projects', 'Guided support', 'Feedback', 'Portfolio development', 'From Skill to Income module', 'Capstone review'],
    prohibitedClaims: ['Guaranteed job', 'Guaranteed income', 'Guaranteed internship', 'Guaranteed clients'],
    tracks,
    faqs: [
      { question: 'Do I need a tech background?', answer: 'No. The programmes are built for practical learners who want to apply AI to work.' },
      { question: 'How long is each track?', answer: 'Each AI Income Accelerator track runs for 4 weeks.' },
    ],
    sourceUrl: `${websiteBaseUrl}/career-accelerator`,
    sourceVersion: 'local-approved-v2026-07-30',
    lastSyncedAt: now,
    approvedAt: now,
    approvedBy: 'NEXORA Admin',
  }
}

function businessProgramme(): CommercialProgramme {
  const modules = batpPillars.map((pillar) => ({ title: pillar.title, lessons: [...pillar.items] }))
  return {
    id: 'business-transformation',
    slug: 'business-transformation',
    name: 'AI Business Transformation Programme',
    programmeFamily: 'BUSINESS_TRANSFORMATION',
    prospectType: 'BUSINESS_OWNER',
    description: 'A practical four-week business transformation programme for business owners who want better branding, online presence, customer management, marketing, sales, automation, dashboards, and a 90-day growth plan.',
    targetAudience: ['Business owners', 'Entrepreneurs', 'SMEs', 'Instagram vendors', 'Facebook vendors', 'WhatsApp businesses', 'Social-commerce brands', 'Founder-led operations'],
    duration: '4 weeks',
    currentPrice: 25000,
    currency: 'NGN',
    priceBasis: 'programme fee',
    active: true,
    enrolmentOpen: true,
    startDate: 'Next cohort',
    deliveryMode: 'Practical business implementation programme',
    applicationUrl: businessApplicationUrl,
    paymentUrl: '/api/paystack/initialize',
    overviewUrl: `${websiteBaseUrl}/business-transformation`,
    modules,
    projects: ['Business website or landing page', 'Customer database', 'Marketing calendar', 'Sales workflow', 'Business dashboard', '90-day growth plan'],
    capstone: 'Build and review a practical business operating system for the participant business.',
    outcomes: [...batpDeliverables],
    requirements: ['Own or manage a business', 'Be ready to document business workflows', 'Laptop strongly recommended'],
    deviceRequirements: 'A laptop is strongly recommended because participants build real business assets such as website, CRM, dashboard, and marketing materials.',
    certificateDetails: 'Certificate is issued after required deliverables and programme review are completed.',
    supportDetails: 'Practical guidance for business systems, marketing workflow, sales process, customer follow-up, dashboard, and automation.',
    approvedValuePoints: ['Brand identity', 'Website', 'Customer database', 'Marketing engine', 'Sales process', 'Automation', 'Dashboards', '90-day growth plan'],
    prohibitedClaims: ['Guaranteed revenue', 'Guaranteed sales', 'Guaranteed customers', 'Guaranteed profit'],
    tracks: [],
    faqs: batpFaqs.map(([question, answer]) => ({ question, answer })),
    sourceUrl: `${websiteBaseUrl}/business-transformation`,
    sourceVersion: 'local-approved-v2026-07-30',
    lastSyncedAt: now,
    approvedAt: now,
    approvedBy: 'NEXORA Admin',
  }
}

function approvedProgrammes() {
  return [careerProgramme(), businessProgramme()]
}

export function getApprovedKnowledgeSnapshot(conflicts: KnowledgeConflict[] = []): CommercialKnowledgeSnapshot {
  return {
    version: 'commercial-knowledge-v2026-07-30.3',
    status: 'APPROVED',
    generatedAt: new Date().toISOString(),
    approvedAt: now,
    approvedBy: 'NEXORA Admin',
    programmes: approvedProgrammes(),
    conflicts,
    sync: {
      source: 'LOCAL_APPROVED_SNAPSHOT',
      websiteUrl: websiteBaseUrl,
      lastSuccessfulSyncAt: now,
      lastFailedSyncAt: '',
      scheduledSync: 'every 6 hours',
    },
  }
}

export function findProgrammeByFamily(family: ProgrammeFamily) {
  return approvedProgrammes().find((programme) => programme.programmeFamily === family)
}

export function findTrackByName(name: string) {
  const raw = name.toLowerCase()
  return careerProgramme().tracks.find((track) => {
    const haystack = `${track.name} ${track.slug} ${track.description}`.toLowerCase()
    return haystack.includes(raw) || raw.includes(track.name.toLowerCase())
  })
}

export function inferTrackFromText(input: string) {
  const raw = input.toLowerCase()
  return careerProgramme().tracks.find((track) => {
    const tokens = [track.name, track.slug, ...track.name.split(/\W+/), ...track.projects, ...track.modules.map((module) => module.title)]
      .filter(Boolean)
      .map((item) => item.toLowerCase())
    return tokens.some((token) => token.length >= 4 && raw.includes(token))
  })
}

function extractPriceNear(html: string, labelTerms: string[]) {
  const normalized = html.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
  const prices = Array.from(normalized.matchAll(/(?:NGN|₦)\s?([0-9,]+)/gi)).map((match) => ({
    raw: match[0],
    value: Number(match[1].replace(/,/g, '')),
    index: match.index || 0,
  }))
  const labels = labelTerms.map((term) => normalized.toLowerCase().indexOf(term.toLowerCase())).filter((index) => index >= 0)
  for (const labelIndex of labels) {
    const close = prices.find((price) => Math.abs(price.index - labelIndex) < 900)
    if (close) return close.value
  }
  return prices[0]?.value
}

function extractProgrammeCount(html: string) {
  const text = html.replace(/\s+/g, ' ')
  const match = text.match(/(\d+)\s+(?:career\s+)?programmes?/i) || text.match(/(\d+)\s+(?:career\s+)?tracks?/i)
  return match ? Number(match[1]) : undefined
}

export async function fetchWebsiteProgrammeFacts(baseUrl = websiteBaseUrl): Promise<WebsiteProgrammeFacts> {
  const extractedAt = new Date().toISOString()
  try {
    const [home, programs, careerPage, businessPage] = await Promise.all([baseUrl, `${baseUrl}/programs`, `${baseUrl}/career-accelerator`, `${baseUrl}/business-transformation`].map(async (url) => {
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error(`${url} returned ${response.status}`)
      return response.text()
    }))
    const html = [home, programs, careerPage, businessPage].join('\n')
    const rawMatches = Array.from(html.matchAll(/(?:NGN|₦)\s?[0-9,]+|(?:\d+)\s+(?:career\s+)?(?:programmes?|tracks?)/gi)).map((match) => match[0])
    return {
      sourceUrl: baseUrl,
      extractedAt,
      careerPrice: extractPriceNear(careerPage, ['ai income accelerator', 'career accelerator']) || extractPriceNear(programs, ['ai income accelerator', 'career accelerator']) || extractPriceNear(home, ['ai income accelerator', 'career accelerator']),
      careerProgrammeCount: extractProgrammeCount(careerPage) || extractProgrammeCount(programs) || extractProgrammeCount(home),
      businessPrice: extractPriceNear(businessPage, ['business transformation', 'ai business transformation']) || extractPriceNear(programs, ['business transformation', 'ai business transformation']) || extractPriceNear(home, ['business transformation', 'ai business transformation']),
      businessDuration: businessPage.toLowerCase().includes('4 weeks') || programs.toLowerCase().includes('4 weeks') ? '4 weeks' : undefined,
      rawMatches,
    }
  } catch (error) {
    return {
      sourceUrl: baseUrl,
      extractedAt,
      rawMatches: [],
      error: error instanceof Error ? error.message : 'Website sync failed',
    }
  }
}

function conflict(field: string, websiteValue: string, databaseValue: string, hardCodedValue: string, recommendedResolution: string): KnowledgeConflict {
  return {
    type: 'KNOWLEDGE_CONFLICT',
    field,
    websiteValue,
    databaseValue,
    hardCodedValue,
    lastUpdatedTime: new Date().toISOString(),
    recommendedResolution,
    adminApprovalStatus: 'PENDING_ADMIN_APPROVAL',
  }
}

export function detectKnowledgeConflicts(website: WebsiteProgrammeFacts, snapshot = getApprovedKnowledgeSnapshot()): KnowledgeConflict[] {
  const career = snapshot.programmes.find((programme) => programme.programmeFamily === 'CAREER_ACCELERATOR')
  const business = snapshot.programmes.find((programme) => programme.programmeFamily === 'BUSINESS_TRANSFORMATION')
  const conflicts: KnowledgeConflict[] = []
  if (website.careerPrice && career && website.careerPrice !== career.currentPrice) {
    conflicts.push(conflict('CAREER_ACCELERATOR.current_price', ngn(website.careerPrice), ngn(career.currentPrice), ngn(careerTrackBasePrice), 'Keep the approved snapshot until admin confirms whether public website or database pricing is correct.'))
  }
  if (website.careerProgrammeCount && career && website.careerProgrammeCount !== career.tracks.length) {
    conflicts.push(conflict('CAREER_ACCELERATOR.track_count', String(website.careerProgrammeCount), String(career.tracks.length), String(career.tracks.length), 'Review website programme copy and approved track list before publishing a new knowledge version.'))
  }
  if (website.businessPrice && business && website.businessPrice !== business.currentPrice) {
    conflicts.push(conflict('BUSINESS_TRANSFORMATION.current_price', ngn(website.businessPrice), ngn(business.currentPrice), ngn(business.currentPrice), 'Keep approved business price until admin confirms the new commercial price.'))
  }
  return conflicts
}

export async function getKnowledgeReport() {
  const website = await fetchWebsiteProgrammeFacts()
  const conflicts = detectKnowledgeConflicts(website)
  return {
    website,
    snapshot: getApprovedKnowledgeSnapshot(conflicts),
    conflicts,
  }
}
