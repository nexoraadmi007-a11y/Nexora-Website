export const AI_INCOME_ACCELERATOR_PROGRAM = 'ai_income_accelerator' as const
export const BUSINESS_ACCELERATOR_PROGRAM = 'business_accelerator' as const

export type AcceleratorProgram = typeof AI_INCOME_ACCELERATOR_PROGRAM | typeof BUSINESS_ACCELERATOR_PROGRAM
export type AiIncomeTrackValue = 'ai_finance' | 'ai_content_creation' | 'ai_no_code' | 'ai_business'

export type AcceleratorProduct = {
  program: AcceleratorProgram
  track: AiIncomeTrackValue | null
  amount: number
}

export const aiIncomeAcceleratorPriceNgn = 10000
export const businessAcceleratorPriceNgn = 25000

export const AI_INCOME_ACCELERATOR_TRACKS: Array<{
  value: AiIncomeTrackValue
  slug: string
  programmeCode: string
  label: string
  summary: string
  aliases: string[]
}> = [
  {
    value: 'ai_finance',
    slug: 'ai-finance',
    programmeCode: 'AI_FINANCE',
    label: 'AI Finance',
    summary: 'Build practical finance analysis, spreadsheet reporting and AI-supported business insight skills.',
    aliases: ['ai-financial-analyst', 'ai-financial-business-analysis', 'ai_financial_business_analysis', 'AI Financial Analyst', 'AI Financial & Business Analysis', 'NGTP-FIN'],
  },
  {
    value: 'ai_content_creation',
    slug: 'ai-content-creation',
    programmeCode: 'AI_CONTENT_CREATION',
    label: 'AI Content Creation',
    summary: 'Learn AI-assisted content planning, writing, publishing, campaign execution and content operations.',
    aliases: ['ai-content-digital-marketing', 'ai_content_digital_marketing', 'AI Content & Digital Marketing', 'NGTP-CONTENT'],
  },
  {
    value: 'ai_no_code',
    slug: 'ai-no-code',
    programmeCode: 'AI_NO_CODE',
    label: 'AI No-Code',
    summary: 'Design simple workflows, forms, automations, dashboards and no-code systems powered by AI.',
    aliases: ['ai-automation-no-code', 'ai-automation-no-code-solutions', 'ai_automation_no_code', 'AI Automation & No-Code Solutions', 'NGTP-AUTO'],
  },
  {
    value: 'ai_business',
    slug: 'ai-business',
    programmeCode: 'AI_BUSINESS',
    label: 'AI Business',
    summary: 'Learn practical AI-supported business operations, customer systems, growth thinking and execution workflows.',
    aliases: ['ai-ui-ux-digital-design', 'ui-ux-designer', 'ai_business', 'AI UI/UX & Digital Design', 'Certified UI/UX Designer (AI-Powered)', 'NGTP-UX'],
  },
]

export function normalizeProductToken(value: unknown) {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[_\s]+/g, '-')
    : ''
}

export function normalizeProgram(value: unknown): AcceleratorProgram | '' {
  const raw = normalizeProductToken(value)
  if (['ai-income-accelerator', 'ai-income-accelerator-program', 'ngtp', 'ai-career-accelerator'].includes(raw)) return AI_INCOME_ACCELERATOR_PROGRAM
  if (['business-accelerator', 'business-transformation', 'business-transformation-programme', 'business-transformation-program', 'batp'].includes(raw)) return BUSINESS_ACCELERATOR_PROGRAM
  return ''
}

export function findAiIncomeTrack(value: unknown) {
  const raw = normalizeProductToken(value)
  if (!raw) return null
  return AI_INCOME_ACCELERATOR_TRACKS.find((track) => {
    const candidates = [track.value, track.slug, track.programmeCode, track.label, ...track.aliases].map(normalizeProductToken)
    return candidates.includes(raw)
  }) || null
}

export function validateAcceleratorSelection(input: {
  program: unknown
  track?: unknown
}): { ok: true; product: AcceleratorProduct } | { ok: false; error: string } {
  const program = normalizeProgram(input.program)
  if (!program) return { ok: false, error: 'Select a valid accelerator programme.' }

  if (program === BUSINESS_ACCELERATOR_PROGRAM) {
    return { ok: true, product: { program, track: null, amount: businessAcceleratorPriceNgn } }
  }

  const track = findAiIncomeTrack(input.track)
  if (!track) {
    return { ok: false, error: 'Select one AI Income Accelerator track: AI Finance, AI Content Creation, AI No-Code, or AI Business.' }
  }

  return { ok: true, product: { program, track: track.value, amount: aiIncomeAcceleratorPriceNgn } }
}
