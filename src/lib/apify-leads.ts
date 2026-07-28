import { createRecord, escapeFormula, listRecords } from './airtable'
import { createIndividualLead, type IndividualLeadInput } from './individual-growth-engine'

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

type SearchResultLead = {
  title: string
  url: string
  description: string
  sourcePlatform: string
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

function defaultIndividualQueries(input: ApifyLeadInput) {
  const audience = text(input.query || input.sector || 'NYSC members final-year students recent graduates', 180)
  const location = text(input.location || 'Nigeria', 120)
  const careerTerms = [
    'AI career accelerator',
    'UI UX portfolio',
    'data analysis internship',
    'digital marketing internship',
    'entry level tech skills',
  ]
  return careerTerms.map((term) => `${audience} ${term} ${location}`)
}

function defaultIndividualActorInput(input: ApifyLeadInput) {
  const queries = defaultIndividualQueries(input)
  const perPage = Math.min(Math.max(Number(input.limit || 10), 1), 20)
  return {
    queries: queries.join('\n'),
    resultsPerPage: perPage,
    maxPagesPerQuery: 1,
    countryCode: 'ng',
    languageCode: 'en',
    mobileResults: false,
  }
}

function searchPlatform(url: string) {
  const value = url.toLowerCase()
  if (value.includes('linkedin.com')) return 'LinkedIn'
  if (value.includes('twitter.com') || value.includes('x.com')) return 'X'
  if (value.includes('instagram.com')) return 'Instagram'
  if (value.includes('facebook.com')) return 'Facebook'
  return 'Google Search'
}

function flattenSearchResults(items: Fields[]) {
  const flattened: SearchResultLead[] = []
  for (const item of items) {
    const organic = Array.isArray(item.organicResults) ? item.organicResults : Array.isArray(item.organic) ? item.organic : []
    if (organic.length) {
      for (const result of organic) {
        const row = result as Fields
        const url = first(row, ['url', 'link', 'displayedUrl'], 500)
        const title = first(row, ['title', 'name'], 240)
        const description = first(row, ['description', 'snippet', 'text'], 1000)
        if (title && url) flattened.push({ title, url, description, sourcePlatform: searchPlatform(url) })
      }
      continue
    }

    const url = first(item, ['url', 'link', 'sourceUrl', 'profileUrl'], 500)
    const title = first(item, ['title', 'name', 'fullName'], 240)
    const description = first(item, ['description', 'snippet', 'text', 'summary'], 1000)
    if (title && url) flattened.push({ title, url, description, sourcePlatform: searchPlatform(url) })
  }
  return flattened
}

function looksLikeIndividualLead(result: SearchResultLead) {
  const evidence = `${result.title} ${result.description} ${result.url}`.toLowerCase()
  const targetAudience = ['nysc', 'corp member', 'corper', 'final year', 'final-year', 'student', 'graduate', 'internship', 'entry level', 'entry-level']
  const excluded = ['restaurant', 'hotel', 'school fees', 'admission portal', 'company profile', 'job vacancy', 'hiring now']
  if (excluded.some((term) => evidence.includes(term))) return false
  return targetAudience.some((term) => evidence.includes(term))
}

function subtypeFromSearch(result: SearchResultLead, fallback: string) {
  const evidence = `${fallback} ${result.title} ${result.description}`.toLowerCase()
  if (evidence.includes('nysc') || evidence.includes('corper') || evidence.includes('corp member')) return 'NYSC_MEMBER'
  if (evidence.includes('final year') || evidence.includes('final-year') || evidence.includes('400 level') || evidence.includes('500 level')) return 'FINAL_YEAR_STUDENT'
  if (evidence.includes('graduate') || evidence.includes('entry level') || evidence.includes('entry-level')) return 'RECENT_GRADUATE'
  return 'INDIVIDUAL'
}

function careerInterestFromSearch(result: SearchResultLead) {
  const evidence = `${result.title} ${result.description}`.toLowerCase()
  if (evidence.includes('ui') || evidence.includes('ux') || evidence.includes('design')) return 'UI/UX'
  if (evidence.includes('finance') || evidence.includes('financial') || evidence.includes('accounting') || evidence.includes('data')) return 'Financial analysis'
  if (evidence.includes('content') || evidence.includes('marketing') || evidence.includes('social media')) return 'Content creation'
  if (evidence.includes('software') || evidence.includes('developer') || evidence.includes('frontend')) return 'Software building'
  return 'AI career skills'
}

function cleanPersonName(title: string) {
  return title
    .replace(/\s+\|.*$/g, '')
    .replace(/\s+-\s+LinkedIn.*$/gi, '')
    .replace(/\s+-\s+X.*$/gi, '')
    .trim()
}

function normalizeIndividualSearchResult(result: SearchResultLead, fallback: { sector: string; location: string }): IndividualLeadInput {
  const signal = [result.description, result.title].filter(Boolean).join(' | ')
  return {
    fullName: cleanPersonName(result.title),
    subtype: subtypeFromSearch(result, fallback.sector),
    publicProfileUrl: result.url,
    sourceUrl: result.url,
    sourcePlatform: result.sourcePlatform,
    sourceGroup: fallback.sector,
    observableSignal: signal || `Public search result matched ${fallback.sector}.`,
    state: fallback.location,
    careerInterest: careerInterestFromSearch(result),
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
  const actorOrTask = text(input.taskId || input.actorId || process.env.APIFY_LEAD_TASK_ID || process.env.APIFY_LEAD_ACTOR_ID || 'compass/crawler-google-places', 200)
  const isTask = Boolean(input.taskId || (!input.actorId && process.env.APIFY_LEAD_TASK_ID))
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

export async function runApifyIndividualLeadImport(input: ApifyLeadInput) {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN is not configured.')
  const actorOrTask = text(input.taskId || input.actorId || process.env.APIFY_INDIVIDUAL_LEAD_TASK_ID || process.env.APIFY_INDIVIDUAL_LEAD_ACTOR_ID || 'apify/google-search-scraper', 200)
  const isTask = Boolean(input.taskId || (!input.actorId && process.env.APIFY_INDIVIDUAL_LEAD_TASK_ID))
  const limit = Math.min(Math.max(Number(input.limit || 10), 1), 50)
  const actorInput = input.actorInput && Object.keys(input.actorInput).length ? input.actorInput : defaultIndividualActorInput({ ...input, limit })
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
  if (!response.ok) throw new Error(`Apify individual lead run failed: ${response.status} ${raw.slice(0, 500)}`)

  const items = Array.isArray(data) ? data : []
  const flattened = flattenSearchResults(items as Fields[])
  const normalized = flattened
    .filter(looksLikeIndividualLead)
    .slice(0, limit)
    .map((item) => normalizeIndividualSearchResult(item, {
      sector: text(input.sector || input.query, 160),
      location: text(input.location, 160),
    }))
    .filter((lead) => lead.fullName && lead.observableSignal && (lead.publicProfileUrl || lead.sourceUrl))

  const imported = []
  const skipped = []
  const failed = []
  for (const lead of normalized) {
    try {
      const result = await createIndividualLead(lead)
      if ('skipped' in result) skipped.push({ name: result.name, reason: result.reason })
      else imported.push(result)
    } catch (error) {
      failed.push({ name: lead.fullName, error: error instanceof Error ? error.message : 'Import failed.' })
    }
  }

  return {
    actorOrTask,
    requestedLimit: limit,
    received: items.length,
    flattened: flattened.length,
    normalized: normalized.length,
    imported,
    skipped,
    failed,
  }
}
