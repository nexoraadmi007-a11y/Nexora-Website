import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  try {
    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index === -1) continue
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local is optional when variables are already set in the shell.
  }
}

loadLocalEnv()

const token = process.env.AIRTABLE_TOKEN
const baseId = process.env.AIRTABLE_BASE_ID || 'appNkFVWpoI8ihHmA'
const metaApi = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`
const dataApi = `https://api.airtable.com/v0/${baseId}`

if (!token) {
  throw new Error('AIRTABLE_TOKEN is not configured.')
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

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

const statusChoices = [
  { name: 'Not Started', color: 'grayLight2' },
  { name: 'In Progress', color: 'blueLight2' },
  { name: 'Submitted', color: 'yellowLight2' },
  { name: 'Approved', color: 'greenLight2' },
]

const participantFields = [
  { name: 'Owner Name', type: 'singleLineText' },
  { name: 'Industry', type: 'singleLineText' },
  { name: 'Business Stage', type: 'singleLineText' },
  { name: 'Staff Size', type: 'singleLineText' },
  { name: 'State', type: 'singleLineText' },
  { name: 'Phone', type: 'phoneNumber' },
  { name: 'Email', type: 'email' },
  { name: 'Website', type: 'url' },
  { name: 'Enrollment Status', type: 'singleSelect', options: { choices: [{ name: 'Payment Confirmed', color: 'greenLight2' }, { name: 'Pending', color: 'yellowLight2' }] } },
  { name: 'Programme Status', type: 'singleSelect', options: { choices: [{ name: 'Enrolled', color: 'greenLight2' }, { name: 'Active', color: 'blueLight2' }, { name: 'Completed', color: 'purpleLight2' }] } },
  { name: 'Payment Reference', type: 'singleLineText' },
]

const deliverableFields = [
  { name: 'Owner Name', type: 'singleLineText' },
  { name: 'Email', type: 'email' },
  ...['Branding', 'Website', 'Marketing Engine', 'Sales Engine', 'Operating System', 'Dashboard', 'Automation', 'Growth Plan'].map((name) => ({
    name,
    type: 'singleSelect',
    options: { choices: statusChoices },
  })),
  { name: 'Payment Reference', type: 'singleLineText' },
]

async function createTable(name, primaryFieldName, fields) {
  return airtable(metaApi, {
    method: 'POST',
    body: JSON.stringify({
      name,
      fields: [
        { name: primaryFieldName, type: 'singleLineText' },
        ...fields,
      ],
    }),
  })
}

async function ensureField(table, field) {
  if (fieldNames(table).has(field.name)) return false
  await airtable(`${metaApi}/${table.id}/fields`, {
    method: 'POST',
    body: JSON.stringify(field),
  })
  return true
}

async function ensureTable(schema, name, primaryFieldName, fields) {
  let table = findTable(schema, name)
  if (!table) {
    await createTable(name, primaryFieldName, fields)
    return { created: true, fieldsAdded: fields.length }
  }

  let fieldsAdded = 0
  for (const field of fields) {
    if (await ensureField(table, field)) fieldsAdded += 1
  }
  return { created: false, fieldsAdded }
}

function escapeFormula(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

async function listRecords(table, formula) {
  const url = new URL(`${dataApi}/${encodeURIComponent(table)}`)
  url.searchParams.set('maxRecords', '1')
  if (formula) url.searchParams.set('filterByFormula', formula)
  const data = await airtable(url)
  return data.records || []
}

async function upsertBatpProgram() {
  const existing = await listRecords('Programmes', `{Programme Code}='BATP'`)
  const fields = {
    'Programme Name': 'AI Business Transformation Program',
    'Programme Code': 'BATP',
    'Program Family': 'Business Transformation',
    Category: 'Business Transformation',
    'Target Audience': 'Small business owners, entrepreneurs, SMEs, startups, freelancers, agencies, service providers, retail businesses, and professional firms.',
    'Audience Type': 'Business',
    'Landing Page Slug': 'business-transformation',
    'Website Duration': '4 Weeks',
    'Website Price': 25000,
    Price: 25000,
    'Website Status': 'Active',
    'Display on Website': true,
    'Website Program Name': 'AI Business Transformation Program',
    'Website Description': 'Transform your business into an AI-powered business in just 30 days by building branding, a website, lead capture, customer database, marketing engine, sales process, automation, dashboards, and a 90-day growth plan.',
    'Website Curriculum': 'Build Your Brand\nBuild Your Online Presence\nBuild Your Marketing Engine\nBuild Your Sales Engine\nBuild Your Business Operating System',
    'CTA Text': 'Apply Now',
    'Display Order': 2,
  }

  if (existing[0]) {
    return airtable(`${dataApi}/Programmes/${existing[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields, typecast: true }),
    })
  }

  return airtable(`${dataApi}/Programmes`, {
    method: 'POST',
    body: JSON.stringify({ fields, typecast: true }),
  })
}

async function main() {
  let schema = await getSchema()
  const programmes = findTable(schema, 'Programmes')
  if (programmes) {
    for (const field of [
      { name: 'Category', type: 'singleLineText' },
      { name: 'Price', type: 'number', options: { precision: 0 } },
    ]) {
      await ensureField(programmes, field)
    }
  }

  schema = await getSchema()
  const participants = await ensureTable(schema, 'Business Participants', 'Business Name', participantFields)
  schema = await getSchema()
  const deliverables = await ensureTable(schema, 'Business Deliverables', 'Business Name', deliverableFields)
  await upsertBatpProgram()

  console.log(JSON.stringify({
    ok: true,
    participants,
    deliverables,
    program: 'AI Business Transformation Program synced',
  }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
