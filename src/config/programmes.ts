export type ProgrammeCode = 'AI_INCOME_ACCELERATOR' | 'BUSINESS_TRANSFORMATION'

export type TrackCode =
  | 'AI_FINANCE'
  | 'AI_CONTENT_CREATION'
  | 'AI_NO_CODE'
  | 'AI_BUSINESS'

export type ProgrammeTrack = {
  code: TrackCode
  slug: string
  name: string
  summary: string
  learn: string[]
  projects: string[]
  services: string[]
  tools: string[]
}

export type Programme = {
  code: ProgrammeCode
  legacyCode: 'NGTP' | 'BATP'
  slug: string
  name: string
  priceNgn: number
  listPriceNgn: number
  duration: string
  audience: string[]
  proposition: string
  outcomes: string[]
  tracks: ProgrammeTrack[]
}

export const skillToIncomeModule = {
  title: 'From Skill to Income',
  topics: [
    'Choosing your market and positioning your skill',
    'Packaging a clear service offer',
    'Portfolio, CV and LinkedIn optimisation',
    'Finding clients through LinkedIn, Facebook, Instagram, WhatsApp and relevant marketplaces',
    'Opening conversations, discovery, proposals, pricing and objection handling',
    'Client onboarding, delivery, feedback, retainers and referrals',
  ],
}

export const aiIncomeTracks: ProgrammeTrack[] = [
  {
    code: 'AI_FINANCE',
    slug: 'ai-finance',
    name: 'AI Finance',
    summary: 'Build practical finance analysis, spreadsheet reporting and AI-supported business insight skills.',
    learn: ['Financial thinking', 'Spreadsheet analysis', 'Business reporting', 'AI-assisted insights'],
    projects: ['Sales analysis', 'Expense tracker', 'SME finance dashboard', 'Insight report'],
    services: ['SME financial reporting', 'Expense systems', 'Business dashboards', 'Reporting support'],
    tools: ['Google Sheets', 'Excel', 'ChatGPT', 'Looker Studio'],
  },
  {
    code: 'AI_CONTENT_CREATION',
    slug: 'ai-content-creation',
    name: 'AI Content Creation',
    summary: 'Build practical AI-assisted content, campaign and social-media execution skills.',
    learn: ['AI-assisted research', 'Content strategy', 'Copywriting', 'Social-media content', 'Visual creation', 'Short-form video', 'Campaign planning', 'Analytics'],
    projects: ['Content calendar', 'Campaign concept', 'Short-form video plan', 'Content portfolio'],
    services: ['Social media management', 'Content creation', 'Copywriting', 'Content calendars', 'Campaign support'],
    tools: ['ChatGPT', 'Canva', 'CapCut', 'Google Workspace', 'Meta platforms'],
  },
  {
    code: 'AI_NO_CODE',
    slug: 'ai-no-code',
    name: 'AI No-Code',
    summary: 'Build forms, Airtable systems, automations, CRM basics and simple internal tools.',
    learn: ['Workflow thinking', 'Forms', 'Airtable', 'Automation', 'AI workflows', 'APIs', 'CRM basics', 'Landing pages', 'Simple internal tools'],
    projects: ['Lead capture system', 'Customer follow-up workflow', 'Simple CRM', 'Automation map'],
    services: ['CRM setup', 'Business automation', 'Lead systems', 'Customer follow-up systems', 'Simple websites', 'Data-collection systems'],
    tools: ['Airtable', 'Tally/Forms', 'Zapier or Make', 'ChatGPT', 'Notion'],
  },
  {
    code: 'AI_BUSINESS',
    slug: 'ai-business',
    name: 'AI Business',
    summary: 'Learn practical AI-supported business operations, customer systems, growth thinking and execution workflows.',
    learn: ['Business model thinking', 'Customer management', 'Sales follow-up', 'AI operations', 'Simple dashboards', 'Execution workflows'],
    projects: ['Business audit', 'Customer follow-up workflow', 'Simple growth dashboard', '90-day action plan'],
    services: ['Business operations support', 'Customer systems', 'Growth workflow setup', 'AI business assistant services'],
    tools: ['ChatGPT', 'Google Workspace', 'Notion', 'Airtable'],
  },
]

export const programmes: Programme[] = [
  {
    code: 'AI_INCOME_ACCELERATOR',
    legacyCode: 'NGTP',
    slug: 'ai-income-accelerator',
    name: 'AI Income Accelerator',
    priceNgn: 10000,
    listPriceNgn: 10000,
    duration: '4 weeks per track',
    audience: ['Undergraduates', 'Final-year students', 'NYSC members', 'Recent graduates', 'Young professionals', 'Career switchers'],
    proposition: 'Choose one practical AI-powered track, build proof that you can do the work, and learn how to take that skill to market.',
    outcomes: ['Practical AI skill', 'Portfolio projects', 'Income readiness', 'Opportunity readiness', 'Certificate after completion review'],
    tracks: aiIncomeTracks,
  },
  {
    code: 'BUSINESS_TRANSFORMATION',
    legacyCode: 'BATP',
    slug: 'business-transformation',
    name: 'Business Accelerator',
    priceNgn: 25000,
    listPriceNgn: 25000,
    duration: '4 weeks',
    audience: ['Instagram vendors', 'Facebook businesses', 'WhatsApp sellers', 'SMEs', 'Founder-led businesses', 'Social-commerce brands'],
    proposition: 'Build the systems behind a business that can grow.',
    outcomes: ['Brand clarity', 'Online presence', 'Customer database', 'Marketing system', 'Sales follow-up', 'Automation and reporting'],
    tracks: [],
  },
]

export function formatNaira(value: number) {
  return `NGN ${value.toLocaleString('en-NG')}`
}

export function findProgramme(slugOrCode: string) {
  const value = slugOrCode.toLowerCase().replace(/_/g, '-')
  if (['ai-income-accelerator-program', 'ai-career-accelerator'].includes(value)) return programmes[0]
  if (['business-accelerator', 'business-transformation-programme', 'business-transformation-program'].includes(value)) return programmes[1]
  return programmes.find((programme) => programme.slug === value || programme.code.toLowerCase().replace(/_/g, '-') === value || programme.legacyCode.toLowerCase() === value)
}

export function findTrack(slug: string) {
  return aiIncomeTracks.find((track) => track.slug === slug)
}
