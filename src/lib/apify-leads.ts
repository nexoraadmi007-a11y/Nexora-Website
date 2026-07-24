import { createRecord, escapeFormula, listRecords } from './airtable'

type Fields = Record<string, any>

export type ApifyLeadInput = {
  actorId?: string
  taskId?: string
  query?: string
  location?: string
  sector?: string
  limit?: number
  actorInput?: Record<string, unknown>
}

export type ImportedLead = {
  name: string
  sector: string
  location: string
  phone: string
  email: string
  website: string
  sourceUrl: string
  score: number
  signal: string
}

function text(value: unknown, max = 2000) {
  if (typeof value === 'number') return String(value).slice(0, max)
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function compact(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== undefined && value !== null
  }))
}

function first(item: Fields, names: string[], max = 2000) {
  for (const name of names) {
    const value = text(item[name], max)
    if (value) return value
  }
  return ''
}

function scoreLead(lead: ImportedLead) {
  let score = 45
  if (lead.phone) score += 15
  if (lead.email) score += 15
  if (lead.website) score += 10
  if (lead.location) score += 5
  if (lead.sector) score += 5
  if (lead.sourceUrl) score += 5
  return Math.min(score, 100)
}

function normalizeItem(item: Fields, fallback: { sector: string; location: string }): ImportedLead {
  const name = first(item, ['title', 'name', 'businessName', 'companyName', 'organizationName', 'placeName'])
  const sector = first(item, ['categoryName', 'category', 'industry', 'sector', 'type'], 160) || fallback.sector
  const city = first(item, ['city', 'municipality', 'addressLocality'], 160)
  const state = first(item, ['state', 'region', 'addressRegion'], 160)
  const address = first(item, ['address', 'street', 'formattedAddress'], 240)
  const location = [city, state].filter(Boolean).join(', ') || address || fallback.location
  const website = first(item, ['website', 'url', 'domain', 'companyUrl'], 500)
  const sourceUrl = first(item, ['sourceUrl', 'placeUrl', 'googleMapsUrl', 'linkedinUrl', 'profileUrl', 'url'], 500)
  const phone = first(item, ['phone', 'phoneNumber', 'telephone', 'contactPhone'], 80)
  const email = first(item, ['email', 'emailAddress', 'contactEmail'], 254).toLowerCase()
  const rating = first(item, ['rating', 'stars'], 30)
  const reviews = first(item, ['reviewsCount', 'reviewCount', 'reviews'], 30)
  const signal = [
    rating ? `Rating ${rating}` : '',
    reviews ? `${reviews} reviews` : '',
    website ? 'Has website' : 'Website not found',
    phone || email ? 'Contact available' : 'Contact needs research',
  ].filter(Boolean).join(' | ')
  const lead = { name, sector, location, phone, email, website, sourceUrl, score: 0, signal }
  return { ...lead, score: scoreLead(lead) }
}

function defaultActorInput(input: ApifyLeadInput) {
  const query = [input.query || input.sector || 'businesses', input.location || 'Nigeria'].filter(Boolean).join(' in ')
  return {
    searchStringsArray: [query],
    maxCrawledPlacesPerSearch: input.limit || 20,
    language: 'en',
    countryCode: 'ng',
  }
}

async function findDuplicate(lead: ImportedLead) {
  if (lead.sourceUrl) {
    const byUrl = await listRecords<Fields>('Growth Leads', {
      formula: `{Source URL}='${escapeFormula(lead.sourceUrl)}'`,
      maxRecords: 1,
    }).catch(() => [])
    if (byUrl[0]) return byUrl[0]
  }

  if (lead.email) {
    const byEmail = await listRecords<Fields>('Growth Leads', {
      formula: `LOWER({Email})='${escapeFormula(lead.email)}'`,
      maxRecords: 1,
    }).catch(() => [])
    if (byEmail[0]) return byEmail[0]
  }

  if (lead.name) {
    const byName = await listRecords<Fields>('Growth Leads', {
      formula: `LOWER({Business Name})='${escapeFormula(lead.name.toLowerCase())}'`,
      maxRecords: 1,
    }).catch(() => [])
    if (byName[0]) return byName[0]
  }

  return null
}

export async function runApifyLeadImport(input: ApifyLeadInput) {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN is not configured.')
  const actorOrTask = text(input.taskId || input.actorId || process.env.APIFY_LEAD_ACTOR_ID || 'compass/crawler-google-places', 200)
  const isTask = Boolean(input.taskId || process.env.APIFY_LEAD_TASK_ID)
  const limit = Math.min(Math.max(Number(input.limit || 20), 1), 100)
  const actorInput = input.actorInput && Object.keys(input.actorInput).length ? input.actorInput : defaultActorInput({ ...input, limit })
  const encoded = actorOrTask.replace('/', '~')
  const path = isTask ? `actor-tasks/${encoded}` : `acts/${encoded}`
  const url = `https://api.apify.com/v2/${path}/run-sync-get-dataset-items?clean=true&format=json`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(actorInput),
    cache: 'no-store',
  })
  const raw = await response.text()
  const data = raw ? JSON.parse(raw) : []
  if (!response.ok) throw new Error(`Apify lead run failed: ${response.status} ${raw.slice(0, 500)}`)
  const items = Array.isArray(data) ? data.slice(0, limit) : []
  const normalized = items.map((item) => normalizeItem(item as Fields, {
    sector: text(input.sector, 160),
    location: text(input.location, 160),
  })).filter((lead) => lead.name)

  const imported = []
  const skipped = []
  for (const lead of normalized) {
    const duplicate = await findDuplicate(lead)
    if (duplicate) {
      skipped.push({ name: lead.name, reason: 'duplicate' })
      continue
    }
    const created = await createRecord<{ id: string; fields: Fields }>('Growth Leads', compact({
      'Growth Lead ID': `GL-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      'Lead Type': 'BUSINESS_TRANSFORMATION',
      Name: lead.name,
      'Business Name': lead.name,
      City: lead.location,
      State: text(input.location, 160),
      Phone: lead.phone,
      Email: lead.email,
      'Public Profile URL': lead.sourceUrl,
      'Source URL': lead.sourceUrl || lead.website,
      'Observable Signal': lead.signal,
      Persona: 'Business owner / decision maker',
      'Programme Match': 'AI Business Transformation Program',
      Score: lead.score,
      Confidence: lead.sourceUrl || lead.phone || lead.email ? 0.78 : 0.55,
      Status: 'New',
      'Created At': new Date().toISOString(),
      'Updated At': new Date().toISOString(),
    }))
    imported.push({ id: created.id, name: lead.name, sector: lead.sector, score: lead.score })
  }

  return {
    actorOrTask,
    requestedLimit: limit,
    received: items.length,
    normalized: normalized.length,
    imported,
    skipped,
  }
}
