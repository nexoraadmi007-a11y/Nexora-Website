export type ProgrammeCode = 'AI_INCOME_ACCELERATOR' | 'BUSINESS_TRANSFORMATION'

export type TrackCode =
  | 'AI_CONTENT_DIGITAL_MARKETING'
  | 'AI_UI_UX_DIGITAL_DESIGN'
  | 'AI_FINANCIAL_BUSINESS_ANALYSIS'
  | 'AI_AUTOMATION_NO_CODE'

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
    code: 'AI_CONTENT_DIGITAL_MARKETING',
    slug: 'ai-content-digital-marketing',
    name: 'AI Content & Digital Marketing',
    summary: 'Build practical AI-assisted content, campaign and social-media execution skills.',
    learn: ['AI-assisted research', 'Content strategy', 'Copywriting', 'Social-media content', 'Visual creation', 'Short-form video', 'Campaign planning', 'Analytics'],
    projects: ['Content calendar', 'Campaign concept', 'Short-form video plan', 'Content portfolio'],
    services: ['Social media management', 'Content creation', 'Copywriting', 'Content calendars', 'Campaign support'],
    tools: ['ChatGPT', 'Canva', 'CapCut', 'Google Workspace', 'Meta platforms'],
  },
  {
    code: 'AI_UI_UX_DIGITAL_DESIGN',
    slug: 'ai-ui-ux-digital-design',
    name: 'AI UI/UX & Digital Design',
    summary: 'Learn interface thinking, Figma workflows, landing pages and product case studies.',
    learn: ['Design fundamentals', 'User research', 'User journeys', 'Wireframes', 'Figma', 'UI design', 'AI-assisted design', 'Landing pages'],
    projects: ['UX audit', 'Landing-page design', 'App screen redesign', 'Product case study'],
    services: ['Landing-page design', 'Website UI', 'App interface', 'UX audits', 'Product design support'],
    tools: ['Figma', 'ChatGPT', 'Canva', 'Notion'],
  },
  {
    code: 'AI_FINANCIAL_BUSINESS_ANALYSIS',
    slug: 'ai-financial-business-analysis',
    name: 'AI Financial & Business Analysis',
    summary: 'Use spreadsheets and AI to clean data, analyse performance and build useful reports.',
    learn: ['Spreadsheet foundations', 'Financial data', 'Basic financial statements', 'AI-assisted analysis', 'Data cleaning', 'Dashboards', 'Business reporting', 'Insights'],
    projects: ['Sales analysis', 'Expense tracker', 'SME dashboard', 'Insight report'],
    services: ['Sales analysis', 'SME financial reporting', 'Expense systems', 'Dashboards', 'Reporting support'],
    tools: ['Google Sheets', 'Excel', 'ChatGPT', 'Looker Studio'],
  },
  {
    code: 'AI_AUTOMATION_NO_CODE',
    slug: 'ai-automation-no-code-solutions',
    name: 'AI Automation & No-Code Solutions',
    summary: 'Build forms, Airtable systems, automations, CRM basics and simple internal tools.',
    learn: ['Workflow thinking', 'Forms', 'Airtable', 'Automation', 'AI workflows', 'APIs', 'CRM basics', 'Landing pages', 'Simple internal tools'],
    projects: ['Lead capture system', 'Customer follow-up workflow', 'Simple CRM', 'Automation map'],
    services: ['CRM setup', 'Business automation', 'Lead systems', 'Customer follow-up systems', 'Simple websites', 'Data-collection systems'],
    tools: ['Airtable', 'Tally/Forms', 'Zapier or Make', 'ChatGPT', 'Notion'],
  },
]

export const programmes: Programme[] = [
  {
    code: 'AI_INCOME_ACCELERATOR',
    legacyCode: 'NGTP',
    slug: 'ai-income-accelerator',
    name: 'AI Income Accelerator',
    priceNgn: 10000,
    duration: '4 weeks per track',
    audience: ['Undergraduates', 'Final-year students', 'NYSC members', 'Recent graduates', 'Young professionals', 'Career switchers'],
    proposition: 'Learn a practical AI-powered skill, build proof that you can do the work, and learn how to take that skill to market.',
    outcomes: ['Practical AI skill', 'Portfolio projects', 'Income readiness', 'Opportunity readiness', 'Certificate after completion review'],
    tracks: aiIncomeTracks,
  },
  {
    code: 'BUSINESS_TRANSFORMATION',
    legacyCode: 'BATP',
    slug: 'business-transformation',
    name: 'AI Business Transformation Programme',
    priceNgn: 25000,
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
  const value = slugOrCode.toLowerCase()
  return programmes.find((programme) => programme.slug === value || programme.code.toLowerCase() === value || programme.legacyCode.toLowerCase() === value)
}

export function findTrack(slug: string) {
  return aiIncomeTracks.find((track) => track.slug === slug)
}
