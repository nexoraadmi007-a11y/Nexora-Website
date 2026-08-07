import { createRecord, escapeFormula, listRecords, type AirtableRecord } from './airtable'
import { sendTelegramMessage } from './telegram'

type Fields = Record<string, any>

export type BusinessLeadErrorCode =
  | 'API_CONFIGURATION_MISSING'
  | 'API_AUTHENTICATION_FAILED'
  | 'SOURCE_RATE_LIMITED'
  | 'SOURCE_RETURNED_ZERO_RESULTS'
  | 'PARSER_FAILED'
  | 'DATABASE_WRITE_FAILED'
  | 'QUALIFICATION_FAILED'
  | 'NO_CONTACT_PATHS'
  | 'NO_QUALIFIED_LEADS'
  | 'TELEGRAM_DELIVERY_FAILED'

export type BusinessLead = {
  id?: string
  business_name: string
  business_category: string
  business_subcategory: string
  description: string
  city: string
  state: string
  country: string
  instagram_url: string
  facebook_url: string
  whatsapp_url: string
  website_url: string
  phone: string
  email: string
  primary_contact_method: string
  discovery_source: string
  contact_source: string
  source_url: string
  last_activity_date: string
  observed_strengths: string[]
  observed_gaps: string[]
  qualification_reason: string
  digital_activity_score: number
  owner_accessibility_score: number
  commercial_activity_score: number
  operational_gap_score: number
  contactability_score: number
  total_score: number
  verification_status: string
  status: string
  suggested_opening: string
  dedupe_key: string
}

export type BusinessDiscoveryDiagnostics = {
  source: string
  request: string
  httpStatus?: number
  recordsDiscovered: number
  validBusinesses: number
  contactableBusinesses: number
  qualifiedBusinesses: number
  duplicatesSkipped: number
  errorRate: number
  errorCode?: BusinessLeadErrorCode
  error?: string
}

export type BusinessDiscoveryRunResult = {
  ok: boolean
  mode: 'ADMIN_TEST_ONLY'
  businessOnly: boolean
  associateDeliveryEnabled: boolean
  rawBusinessesDiscovered: number
  passedInitialFilters: number
  contactable: number
  qualifiedAboveThreshold: number
  duplicatesRemoved: number
  imported: number
  failed: number
  selected: BusinessLead[]
  diagnostics: BusinessDiscoveryDiagnostics[]
  lastError?: string
  lastErrorCode?: BusinessLeadErrorCode
}

type SearchResult = {
  title: string
  url: string
  description: string
  source: string
}

type RunOptions = {
  requestedCount?: number
  rawLimit?: number
  store?: boolean
}

const QUALIFIED_SCORE = Number(process.env.BUSINESS_LEAD_QUALIFIED_SCORE || 65)

const SEARCHES = [
  'Instagram fashion vendor Lagos',
  'Instagram skincare vendor Abuja',
  'Facebook shoe seller Ibadan',
  'Instagram wig seller Nigeria',
  'WhatsApp business fashion Lagos',
  'Instagram gift vendor Nigeria',
  'Facebook gadget seller Lagos',
  'Instagram cake vendor Abeokuta',
  'Instagram hair vendor Lagos WhatsApp',
  'Instagram phone accessories vendor Nigeria',
]

const positiveCommercialTerms = [
  'vendor', 'shop', 'store', 'collections', 'ready to wear', 'skincare', 'hair',
  'wig', 'cakes', 'pastries', 'gadgets', 'plug', 'delivery', 'order', 'dm',
  'whatsapp', 'promo', 'new stock', 'available', 'price', 'bookings',
]

const excludedTerms = [
  'bank', 'university', 'polytechnic', 'hospital', 'government', 'ministry',
  'manufacturer', 'law firm', 'restaurant near me', 'restaurant reviews',
  'school portal', 'admission', 'wikipedia', 'news', 'blog', 'directory',
  'linkedin jobs', 'vacancy', 'careers',
]

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

function validUrl(value: string) {
  try {
    const parsed = new URL(value)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : ''
  } catch {
    return ''
  }
}

function sourceFromUrl(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes('instagram.com')) return 'Instagram'
  if (lower.includes('facebook.com')) return 'Facebook'
  if (lower.includes('wa.me') || lower.includes('whatsapp.com')) return 'WhatsApp'
  if (lower.includes('tiktok.com')) return 'TikTok'
  return 'Google Search'
}

function flattenResults(items: Fields[]) {
  const results: SearchResult[] = []
  for (const item of items) {
    const organic = Array.isArray(item.organicResults) ? item.organicResults : Array.isArray(item.organic) ? item.organic : []
    const candidates = organic.length ? organic : [item]
    for (const result of candidates) {
      const row = result as Fields
      const url = validUrl(first(row, ['url', 'link', 'sourceUrl', 'profileUrl'], 800))
      const title = first(row, ['title', 'name', 'businessName', 'companyName'], 240)
      const description = first(row, ['description', 'snippet', 'text', 'summary'], 1000)
      if (title && url) results.push({ title, url, description, source: sourceFromUrl(url) })
    }
  }
  return results
}

function evidenceFor(result: SearchResult) {
  return `${result.title} ${result.description} ${result.url}`.toLowerCase()
}

function isRejectedSource(result: SearchResult) {
  const evidence = evidenceFor(result)
  if (excludedTerms.some((term) => evidence.includes(term))) return true
  if (result.url.includes('/search?') || result.url.includes('google.com/search')) return true
  return false
}

function hasSocialCommerceSignal(result: SearchResult) {
  const evidence = evidenceFor(result)
  if (['instagram.com', 'facebook.com', 'wa.me', 'whatsapp.com'].some((term) => evidence.includes(term))) return true
  return positiveCommercialTerms.some((term) => evidence.includes(term))
}

function inferCategory(result: SearchResult) {
  const evidence = evidenceFor(result)
  if (['fashion', 'clothing', 'wear', 'shoe', 'bag', 'jewellery', 'jewelry'].some((term) => evidence.includes(term))) return ['Fashion', 'Fashion Vendor']
  if (['skincare', 'beauty', 'hair', 'wig', 'cosmetics', 'makeup'].some((term) => evidence.includes(term))) return ['Beauty', 'Beauty Vendor']
  if (['gadget', 'phone accessory', 'accessories', 'gift', 'baby', 'decor', 'lifestyle'].some((term) => evidence.includes(term))) return ['Retail', 'Retail Vendor']
  if (['cake', 'pastry', 'pastries', 'food delivery', 'online food'].some((term) => evidence.includes(term))) return ['Food', 'Online Food Vendor']
  if (['photographer', 'event', 'fitness', 'trainer', 'agency', 'tutor', 'training'].some((term) => evidence.includes(term))) return ['Services', 'Owner-led Service Business']
  return ['Retail', 'Social-Commerce Business']
}

function inferLocation(result: SearchResult) {
  const evidence = evidenceFor(result)
  const cities = ['Lagos', 'Abuja', 'Ibadan', 'Abeokuta', 'Port Harcourt', 'Enugu', 'Kano', 'Ogun']
  const city = cities.find((item) => evidence.includes(item.toLowerCase())) || ''
  const state = city === 'Abeokuta' ? 'Ogun' : city
  return { city, state }
}

function extractPhone(value: string) {
  const match = value.match(/(?:\+?234|0)[\d\s-]{9,15}/)
  return match ? match[0].replace(/\s+/g, ' ').trim() : ''
}

function extractEmail(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match ? match[0].toLowerCase() : ''
}

function contactFields(result: SearchResult) {
  const evidence = `${result.description} ${result.url}`
  const instagram = result.url.includes('instagram.com') ? result.url : ''
  const facebook = result.url.includes('facebook.com') ? result.url : ''
  const whatsapp = result.url.includes('wa.me') || result.url.includes('whatsapp.com') ? result.url : ''
  const website = !instagram && !facebook && !whatsapp ? result.url : ''
  const phone = extractPhone(evidence)
  const email = extractEmail(evidence)
  const primary = instagram ? 'Instagram DM' : facebook ? 'Facebook Messenger' : whatsapp ? 'WhatsApp' : phone ? 'Phone' : email ? 'Email' : website ? 'Website contact form' : ''
  const contactSource = instagram ? 'Instagram' : facebook ? 'Facebook' : whatsapp ? 'WhatsApp' : phone ? 'Phone' : email ? 'Email' : website ? 'Website' : ''
  return { instagram, facebook, whatsapp, website, phone, email, primary, contactSource }
}

function observedStrengths(result: SearchResult, contact: ReturnType<typeof contactFields>) {
  const strengths = []
  if (result.source === 'Instagram' || result.source === 'Facebook') strengths.push(`Active ${result.source} discovery surface`)
  if (contact.whatsapp || contact.phone) strengths.push('Direct order/contact route is visible')
  if (positiveCommercialTerms.some((term) => evidenceFor(result).includes(term))) strengths.push('Commercial selling language appears in public result')
  return strengths.length ? strengths : ['Public business presence is visible']
}

function observedGaps(result: SearchResult, contact: ReturnType<typeof contactFields>) {
  const evidence = evidenceFor(result)
  const gaps = []
  if (!contact.website) gaps.push('No website found during public review')
  if (contact.whatsapp || evidence.includes('dm') || evidence.includes('order')) gaps.push('Orders appear DM/WhatsApp-based')
  if (!['booking', 'crm', 'customer database', 'follow-up', 'automation'].some((term) => evidence.includes(term))) gaps.push('No visible customer follow-up system')
  if (!['catalog', 'catalogue', 'website'].some((term) => evidence.includes(term))) gaps.push('No visible digital storefront/catalogue structure')
  return gaps.slice(0, 3)
}

function scoreLead(result: SearchResult, contact: ReturnType<typeof contactFields>, gaps: string[]) {
  const evidence = evidenceFor(result)
  const digital = result.source === 'Instagram' || result.source === 'Facebook' ? 18 : contact.website ? 12 : 8
  const accessibility = contact.whatsapp || contact.phone ? 20 : contact.instagram || contact.facebook ? 15 : contact.email ? 12 : contact.website ? 8 : 0
  const commercial = positiveCommercialTerms.reduce((score, term) => score + (evidence.includes(term) ? 3 : 0), 8)
  const gap = Math.min(25, gaps.length * 8 + (!contact.website ? 4 : 0))
  const contactability = contact.primary ? 15 : 0
  return {
    digital_activity_score: Math.min(digital, 20),
    owner_accessibility_score: Math.min(accessibility, 20),
    commercial_activity_score: Math.min(commercial, 20),
    operational_gap_score: Math.min(gap, 25),
    contactability_score: contactability,
  }
}

function dedupeKeyFor(lead: Omit<BusinessLead, 'id' | 'dedupe_key'>) {
  const domain = lead.website_url ? new URL(lead.website_url).hostname.replace(/^www\./, '') : ''
  return [
    lead.instagram_url,
    lead.facebook_url,
    lead.whatsapp_url,
    lead.phone.replace(/\D/g, ''),
    lead.email,
    domain,
    `${lead.business_name.toLowerCase()}-${lead.city.toLowerCase()}`,
  ].find(Boolean) || lead.business_name.toLowerCase()
}

export function qualifyBusinessSearchResult(result: SearchResult): BusinessLead | null {
  if (isRejectedSource(result)) return null
  if (!hasSocialCommerceSignal(result)) return null
  const contact = contactFields(result)
  if (!contact.primary) return null
  const [category, subcategory] = inferCategory(result)
  const location = inferLocation(result)
  const gaps = observedGaps(result, contact)
  const scores = scoreLead(result, contact, gaps)
  const total = scores.digital_activity_score + scores.owner_accessibility_score + scores.commercial_activity_score + scores.operational_gap_score + scores.contactability_score
  if (total < QUALIFIED_SCORE) return null

  const leadWithoutKey = {
    business_name: result.title.replace(/\s+\|.*$/g, '').replace(/\s+-\s+(Instagram|Facebook).*$/i, '').trim(),
    business_category: category,
    business_subcategory: subcategory,
    description: result.description,
    city: location.city,
    state: location.state,
    country: 'Nigeria',
    instagram_url: contact.instagram,
    facebook_url: contact.facebook,
    whatsapp_url: contact.whatsapp,
    website_url: contact.website,
    phone: contact.phone,
    email: contact.email,
    primary_contact_method: contact.primary,
    discovery_source: 'APIFY_GOOGLE_SEARCH',
    contact_source: contact.contactSource,
    source_url: result.url,
    last_activity_date: '',
    observed_strengths: observedStrengths(result, contact),
    observed_gaps: gaps,
    qualification_reason: `${subcategory} with visible public contact route and observable social-commerce signals.`,
    ...scores,
    total_score: total,
    verification_status: 'PUBLIC_REVIEW_QUALIFIED',
    status: 'Admin Test Only',
    suggested_opening: suggestedOpening(result.title, gaps),
  }
  return { ...leadWithoutKey, dedupe_key: dedupeKeyFor(leadWithoutKey) }
}

function suggestedOpening(name: string, gaps: string[]) {
  const gap = gaps[0] || 'your current customer follow-up process'
  return `Hi, I came across ${name} and noticed you already have visible selling activity online. I also noticed ${gap.toLowerCase()}. We help growing businesses organise customer follow-up and sales systems. Can I ask, how do you currently keep track of customers who enquire but do not buy immediately?`
}

function apifyActorInput(limit: number) {
  return {
    queries: SEARCHES.join('\n'),
    resultsPerPage: Math.min(Math.max(limit, 5), 10),
    maxPagesPerQuery: 1,
    countryCode: 'ng',
    languageCode: 'en',
    mobileResults: false,
  }
}

function classifyApifyError(status: number, body: string): BusinessLeadErrorCode {
  if (status === 401 || status === 403) return 'API_AUTHENTICATION_FAILED'
  if (status === 429) return 'SOURCE_RATE_LIMITED'
  if (body.toLowerCase().includes('not found') || body.toLowerCase().includes('actor')) return 'API_CONFIGURATION_MISSING'
  return 'PARSER_FAILED'
}

async function runApifySearch(limit: number) {
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    return {
      items: [] as Fields[],
      diagnostic: {
        source: 'Apify Google Search',
        request: 'apify/google-search-scraper',
        recordsDiscovered: 0,
        validBusinesses: 0,
        contactableBusinesses: 0,
        qualifiedBusinesses: 0,
        duplicatesSkipped: 0,
        errorRate: 1,
        errorCode: 'API_CONFIGURATION_MISSING' as BusinessLeadErrorCode,
        error: 'APIFY_API_TOKEN is not configured.',
      },
    }
  }

  const actor = text(process.env.APIFY_BUSINESS_LEAD_ACTOR_ID || 'apify/google-search-scraper', 200)
  const encoded = actor.replace('/', '~')
  const url = `https://api.apify.com/v2/acts/${encoded}/run-sync-get-dataset-items?clean=true&format=json`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apifyActorInput(limit)),
    cache: 'no-store',
  })
  const raw = await response.text()
  if (!response.ok) {
    return {
      items: [] as Fields[],
      diagnostic: {
        source: 'Apify Google Search',
        request: actor,
        httpStatus: response.status,
        recordsDiscovered: 0,
        validBusinesses: 0,
        contactableBusinesses: 0,
        qualifiedBusinesses: 0,
        duplicatesSkipped: 0,
        errorRate: 1,
        errorCode: classifyApifyError(response.status, raw),
        error: raw.slice(0, 260),
      },
    }
  }
  const data = raw ? JSON.parse(raw) : []
  const items = Array.isArray(data) ? data : []
  return {
    items,
    diagnostic: {
      source: 'Apify Google Search',
      request: actor,
      httpStatus: response.status,
      recordsDiscovered: items.length,
      validBusinesses: 0,
      contactableBusinesses: 0,
      qualifiedBusinesses: 0,
      duplicatesSkipped: 0,
      errorRate: 0,
    },
  }
}

async function findExistingBusinessLead(lead: BusinessLead) {
  const formulas = [
    lead.instagram_url ? `{Source URL}='${escapeFormula(lead.instagram_url)}'` : '',
    lead.facebook_url ? `{Source URL}='${escapeFormula(lead.facebook_url)}'` : '',
    lead.source_url ? `{Source URL}='${escapeFormula(lead.source_url)}'` : '',
    lead.email ? `LOWER({Email})='${escapeFormula(lead.email)}'` : '',
    lead.phone ? `{Phone}='${escapeFormula(lead.phone)}'` : '',
    lead.business_name ? `AND(LOWER({Business Name})='${escapeFormula(lead.business_name.toLowerCase())}',LOWER({City})='${escapeFormula(lead.city.toLowerCase())}')` : '',
  ].filter(Boolean)
  for (const formula of formulas) {
    const existing = await listRecords<Fields>('Growth Leads', { formula, maxRecords: 1 }).catch(() => [])
    if (existing[0]) return existing[0]
  }
  return null
}

async function storeBusinessLead(lead: BusinessLead) {
  const existing = await findExistingBusinessLead(lead)
  if (existing) return { duplicate: true, id: existing.id }
  const record = await createRecord<AirtableRecord<Fields>>('Growth Leads', compact({
    'Growth Lead ID': `BIZ-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    'Lead Type': lead.contact_source === 'Instagram' ? 'INSTAGRAM_VENDOR' : lead.contact_source === 'Facebook' ? 'FACEBOOK_VENDOR' : lead.contact_source === 'WhatsApp' ? 'WHATSAPP_BUSINESS' : 'SOCIAL_COMMERCE_BRAND',
    Name: lead.business_name,
    'Business Name': lead.business_name,
    Industry: lead.business_category,
    City: lead.city,
    State: lead.state,
    Phone: lead.phone,
    Email: lead.email,
    'Public Profile URL': lead.instagram_url || lead.facebook_url || lead.whatsapp_url || lead.website_url,
    'Source URL': lead.source_url,
    'Source Platform': lead.contact_source || lead.discovery_source,
    'Observable Signal': [
      lead.description,
      `Strengths: ${lead.observed_strengths.join('; ')}`,
      `Gaps: ${lead.observed_gaps.join('; ')}`,
      `Suggested opening: ${lead.suggested_opening}`,
    ].filter(Boolean).join('\n'),
    Persona: 'Owner-led social-commerce business',
    'Programme Match': 'AI Business Transformation Programme',
    'Qualification Reason': lead.qualification_reason,
    Score: lead.total_score,
    Confidence: 0.82,
    Status: 'New',
    'Created At': new Date().toISOString(),
    'Updated At': new Date().toISOString(),
  }))
  return { duplicate: false, id: record.id }
}

export async function runBusinessDiscoveryForAdminTest(options: RunOptions = {}): Promise<BusinessDiscoveryRunResult> {
  const requested = Math.min(Math.max(Number(options.requestedCount || 5), 1), 10)
  const rawLimit = Math.min(Math.max(Number(options.rawLimit || 10), 1), 10)
  const apify = await runApifySearch(rawLimit)
  const flattened = flattenResults(apify.items)
  const initial = flattened.filter((item) => !isRejectedSource(item) && hasSocialCommerceSignal(item))
  const qualified = initial.map(qualifyBusinessSearchResult).filter(Boolean) as BusinessLead[]
  const seen = new Set<string>()
  const deduped: BusinessLead[] = []
  let duplicatesRemoved = 0
  for (const lead of qualified.sort((a, b) => b.total_score - a.total_score)) {
    if (seen.has(lead.dedupe_key)) {
      duplicatesRemoved += 1
      continue
    }
    seen.add(lead.dedupe_key)
    deduped.push(lead)
  }

  let imported = 0
  let failed = 0
  if (options.store !== false) {
    for (const lead of deduped.slice(0, requested)) {
      try {
        const stored = await storeBusinessLead(lead)
        if (stored.duplicate) duplicatesRemoved += 1
        else imported += 1
        lead.id = stored.id
      } catch {
        failed += 1
      }
    }
  }

  const diagnostic = {
    ...apify.diagnostic,
    recordsDiscovered: flattened.length || apify.diagnostic.recordsDiscovered,
    validBusinesses: initial.length,
    contactableBusinesses: initial.filter((item) => Boolean(contactFields(item).primary)).length,
    qualifiedBusinesses: qualified.length,
    duplicatesSkipped: duplicatesRemoved,
  }

  const selected = deduped.slice(0, requested)
  return {
    ok: selected.length > 0,
    mode: 'ADMIN_TEST_ONLY',
    businessOnly: true,
    associateDeliveryEnabled: false,
    rawBusinessesDiscovered: flattened.length,
    passedInitialFilters: initial.length,
    contactable: diagnostic.contactableBusinesses,
    qualifiedAboveThreshold: qualified.length,
    duplicatesRemoved,
    imported,
    failed,
    selected,
    diagnostics: [diagnostic],
    lastError: selected.length ? undefined : apify.diagnostic.error || 'No qualified social-commerce business leads were found.',
    lastErrorCode: selected.length ? undefined : apify.diagnostic.errorCode || 'NO_QUALIFIED_LEADS',
  }
}

function businessLeadCard(lead: BusinessLead, index: number, total: number) {
  return [
    'BUSINESS OPPORTUNITY',
    '',
    lead.business_name,
    `${lead.business_subcategory} - ${[lead.city, lead.state].filter(Boolean).join(', ') || 'Nigeria'}`,
    '',
    'Priority:',
    `${lead.total_score}/100`,
    '',
    'Why This Lead:',
    lead.qualification_reason,
    '',
    'Observed Strengths:',
    ...lead.observed_strengths.map((item) => `- ${item}`),
    '',
    'Observed Gaps:',
    ...lead.observed_gaps.map((item) => `- ${item}`),
    '',
    'Best Nexora Angle:',
    'Customer follow-up and sales organisation',
    '',
    'Contact:',
    [lead.instagram_url ? 'Instagram' : '', lead.facebook_url ? 'Facebook' : '', lead.whatsapp_url ? 'WhatsApp' : '', lead.website_url ? 'Website' : '', lead.phone ? 'Phone' : '', lead.email ? 'Email' : ''].filter(Boolean).join(' | '),
    '',
    'Suggested Opening:',
    `"${lead.suggested_opening}"`,
    '',
    `Lead ${index} of ${total}`,
  ].filter(Boolean).join('\n')
}

function keyboardForBusinessLead(lead: BusinessLead) {
  const buttons: Array<Array<Record<string, string>>> = []
  if (lead.instagram_url) buttons.push([{ text: 'Open Instagram', url: lead.instagram_url }])
  if (lead.facebook_url) buttons.push([{ text: 'Open Facebook', url: lead.facebook_url }])
  if (lead.whatsapp_url) buttons.push([{ text: 'Open WhatsApp', url: lead.whatsapp_url }])
  if (lead.website_url) buttons.push([{ text: 'Open Website', url: lead.website_url }])
  if (lead.source_url) buttons.push([{ text: 'View Source', url: lead.source_url }])
  return buttons.length ? { inline_keyboard: buttons } : undefined
}

export async function sendAdminBusinessLeadTest(input: { chatId: string; telegramUserId: string; count?: number }) {
  const result = await runBusinessDiscoveryForAdminTest({ requestedCount: input.count || 5, rawLimit: 10, store: true })
  await sendTelegramMessage(input.chatId, [
    'NEXORA BUSINESS LEAD TEST',
    '',
    'Discovery run completed.',
    '',
    `Raw businesses discovered: ${result.rawBusinessesDiscovered}`,
    `Passed initial filters: ${result.passedInitialFilters}`,
    `Contactable: ${result.contactable}`,
    `Qualified above threshold: ${result.qualifiedAboveThreshold}`,
    `Duplicates removed: ${result.duplicatesRemoved}`,
    '',
    result.selected.length ? `Sending best ${result.selected.length} leads.` : `No qualified leads ready. Error: ${result.lastErrorCode || 'NO_QUALIFIED_LEADS'}`,
    '',
    'Mode: Admin Test Only',
  ].join('\n'))

  if (!result.selected.length) return { sent: 0, result }

  for (let index = 0; index < result.selected.length; index += 1) {
    const lead = result.selected[index]
    await sendTelegramMessage(input.chatId, businessLeadCard(lead, index + 1, result.selected.length), {
      reply_markup: keyboardForBusinessLead(lead),
    })
  }
  return { sent: result.selected.length, result }
}

export function businessLeadHealthSummary(result: BusinessDiscoveryRunResult) {
  const source = result.diagnostics[0]
  return {
    engineStatus: result.ok ? 'HEALTHY' : 'FAILED',
    lastRun: new Date().toISOString(),
    recordsDiscovered: result.rawBusinessesDiscovered,
    recordsQualified: result.qualifiedAboveThreshold,
    recordsStored: result.imported,
    recordsDelivered: result.selected.length,
    lastError: result.lastError || '',
    sourceDiagnostics: source,
  }
}
