import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  try {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index === -1) continue
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) process.env[key] = value
    }
  } catch {
    // Environment variables may already be configured in the shell or Render.
  }
}

loadLocalEnv()

const token = process.env.AIRTABLE_TOKEN
const baseId = process.env.AIRTABLE_BASE_ID || 'appNkFVWpoI8ihHmA'
const metaApi = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`
const dataApi = `https://api.airtable.com/v0/${baseId}`

if (!token) throw new Error('AIRTABLE_TOKEN is not configured.')

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const programmes = [
  {
    code: 'NGTP-CONTENT',
    name: 'AI Content Creation',
    slug: 'ai-content-creation',
    order: 1,
    audience: 'Aspiring creators, social media managers, brand builders, freelancers, marketing assistants, and young professionals.',
    description: 'Learn content strategy, audience thinking, copywriting, storytelling, AI-assisted production, and content analytics.',
    outcomes: 'Create a content strategy\nWrite hooks, captions, scripts, and campaign assets\nUse AI to research, draft, design, repurpose, and improve content\nMeasure performance and improve future ideas',
    curriculum: 'Foundations of Content and Communication\nStorytelling and Copywriting\nPlatform and Format Strategy\nAI-Powered Writing Workflow\nAI Visual and Multimedia Production\nDistribution, Analytics, and Monetisation',
    assignments: '14-day content calendar\n10 AI-assisted content pieces\nContent performance report',
    portfolio: 'Audience persona\nContent strategy document\nContent assets\nPerformance report\nContent workflow template',
    capstone: 'Build a 30-day content system for a real or simulated brand, including strategy, 10 content assets across two formats, and a performance improvement report.',
    tools: 'ChatGPT\nCanva\nCapCut\nGoogle Trends\nMeta Business Suite\nNotion AI',
  },
  {
    code: 'NGTP-UX',
    name: 'Certified UI/UX Designer (AI-Powered)',
    slug: 'ui-ux-designer',
    order: 2,
    audience: 'Aspiring UI/UX designers, product-minded creatives, frontend learners, no-code builders, and digital product founders.',
    description: 'Learn user research, design principles, wireframing, interface design, prototyping, AI design workflows, and portfolio case-study development.',
    outcomes: 'Conduct practical user research\nCreate user flows, wireframes, and product screens\nUse AI for research synthesis, ideation, critique, and prototyping\nPresent a complete portfolio case study',
    curriculum: 'What UI/UX Actually Is\nUser Experience Foundations\nDesign Principles\nInterface Patterns and Systems\nAI as a Design Tool\nPrototyping, Handoff, and Case Study',
    assignments: 'User persona and user flow\nWireframes and high-fidelity screens\nClickable prototype and case study outline',
    portfolio: 'Research summary\nUser flow\nWireframes\nHigh-fidelity screens\nClickable prototype\nCase study',
    capstone: 'Complete an end-to-end product design project: research summary, user flow, wireframes, high-fidelity UI, clickable prototype, and case study write-up.',
    tools: 'Figma\nFigJam\nChatGPT\nCanva\nUizard or similar AI UI tools\nNotion',
  },
  {
    code: 'NGTP-FIN',
    name: 'AI Financial Analyst',
    slug: 'ai-financial-analyst',
    order: 3,
    audience: 'Finance students, accounting graduates, analysts, SME finance operators, business owners, consultants, and young professionals interested in finance.',
    description: 'Learn financial statements, ratio analysis, forecasting, valuation logic, AI-assisted modelling, validation, and executive reporting.',
    outcomes: 'Read and interpret financial statements\nAnalyse business performance using ratios, trends, and benchmarks\nBuild AI-assisted forecasts and simple financial models\nWrite executive-ready financial reports with documented validation',
    curriculum: 'Foundations of Finance and Business Economics\nThe Three Financial Statements\nFinancial Analysis Techniques\nFinancial Modelling and Forecasting\nAI-Powered Analysis Workflow\nReporting and Decision Support',
    assignments: 'Simple income statement analysis\nForecast from clear assumptions\nOne-page executive finance memo',
    portfolio: 'Financial analysis workbook\nForecast model\nDashboard screenshots\nExecutive finance memo\nValidation notes',
    capstone: 'Complete a financial analysis of a real or sample company, including statement review, driver-based forecast, valuation estimate, and executive report.',
    tools: 'ChatGPT\nMicrosoft Excel\nGoogle Sheets\nPower BI\nCompany reports\nNotion AI',
  },
]

const retiredCodes = ['NGTP-DATA', 'NGTP-MKT', 'NGTP-SOFT', 'NGTP-OPS']
const retiredNames = [
  'AI-Powered Data Analyst',
  'AI-Powered Digital Marketing Specialist',
  'AI-Powered Software Builder',
  'AI-Powered Business Operations Specialist',
  'AI-Powered UI/UX Designer',
]

async function airtable(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url} failed: ${response.status} ${JSON.stringify(data).slice(0, 500)}`)
  }
  return data
}

async function getSchema() {
  return airtable(metaApi)
}

function findTable(schema, name) {
  return schema.tables.find((table) => table.name === name)
}

function fieldNames(table) {
  return new Set((table?.fields || []).map((field) => field.name))
}

async function ensureField(table, field) {
  if (fieldNames(table).has(field.name)) return false
  await airtable(`${metaApi}/${table.id}/fields`, {
    method: 'POST',
    body: JSON.stringify(field),
  })
  return true
}

function escapeFormula(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

async function listRecords(table, formula, maxRecords = 20) {
  const url = new URL(`${dataApi}/${encodeURIComponent(table)}`)
  url.searchParams.set('maxRecords', String(maxRecords))
  if (formula) url.searchParams.set('filterByFormula', formula)
  const data = await airtable(url)
  return data.records || []
}

async function upsertProgramme(programme) {
  const existing = await listRecords('Programmes', `{Programme Code}='${escapeFormula(programme.code)}'`, 1)
  const fields = {
    'Programme Name': programme.name,
    'Programme Code': programme.code,
    'Program Family': 'Career Accelerator',
    Category: 'Career Accelerator',
    'Target Audience': programme.audience,
    'Audience Type': 'Career',
    'Landing Page Slug': `career-accelerator/${programme.slug}`,
    'Website Duration': '4 weeks',
    'Website Price': 10000,
    Price: 10000,
    'Website Status': 'Active',
    'Display on Website': true,
    'Website Program Name': programme.name,
    'Website Description': programme.description,
    'Website Curriculum': programme.curriculum,
    'Learning Outcomes': programme.outcomes,
    Assignments: programme.assignments,
    'Portfolio Deliverables': programme.portfolio,
    'Capstone Project': programme.capstone,
    Tools: programme.tools,
    'Certification Requirements': 'Complete assignments, portfolio deliverables, and final capstone review.',
    'CTA Text': 'Enrol Now',
    'Display Order': programme.order,
  }

  if (existing[0]) {
    await airtable(`${dataApi}/Programmes/${existing[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields, typecast: true }),
    })
    return { code: programme.code, action: 'updated' }
  }

  await airtable(`${dataApi}/Programmes`, {
    method: 'POST',
    body: JSON.stringify({ fields, typecast: true }),
  })
  return { code: programme.code, action: 'created' }
}

async function retireOldProgrammes() {
  const formulas = [
    ...retiredCodes.map((code) => `{Programme Code}='${escapeFormula(code)}'`),
    ...retiredNames.map((name) => `{Programme Name}='${escapeFormula(name)}'`),
  ]
  const formula = `OR(${formulas.join(',')})`
  const records = await listRecords('Programmes', formula, 50)
  for (const record of records) {
    await airtable(`${dataApi}/Programmes/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          'Website Status': 'Inactive',
          'Display on Website': false,
        },
        typecast: true,
      }),
    })
  }
  return records.map((record) => record.fields['Programme Code'] || record.fields['Programme Name'])
}

async function main() {
  const schema = await getSchema()
  const programmesTable = findTable(schema, 'Programmes')
  if (!programmesTable) throw new Error('Programmes table was not found.')

  for (const field of [
    { name: 'Category', type: 'singleLineText' },
    { name: 'Price', type: 'number', options: { precision: 0 } },
    { name: 'Learning Outcomes', type: 'multilineText' },
    { name: 'Assignments', type: 'multilineText' },
    { name: 'Portfolio Deliverables', type: 'multilineText' },
    { name: 'Capstone Project', type: 'multilineText' },
    { name: 'Tools', type: 'multilineText' },
    { name: 'Certification Requirements', type: 'multilineText' },
  ]) {
    await ensureField(programmesTable, field)
  }

  const updates = []
  for (const programme of programmes) {
    updates.push(await upsertProgramme(programme))
  }
  const retired = await retireOldProgrammes()

  console.log(JSON.stringify({ ok: true, updates, retired }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
