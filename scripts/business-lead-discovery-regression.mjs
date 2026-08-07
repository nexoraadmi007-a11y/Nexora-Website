import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/lib/business-lead-discovery.ts', import.meta.url), 'utf8')
const webhook = readFileSync(new URL('../src/app/api/telegram/webhook/route.ts', import.meta.url), 'utf8')
const render = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8')

function assertCase(condition, message) {
  if (!condition) throw new Error(message)
}

const requiredTerms = [
  'Instagram fashion vendor Lagos',
  'Instagram skincare vendor Abuja',
  'Facebook shoe seller Ibadan',
  'WhatsApp business fashion Lagos',
  'NO_CONTACT_PATHS',
  'NO_QUALIFIED_LEADS',
  'API_AUTHENTICATION_FAILED',
  'SOURCE_RATE_LIMITED',
  'No website found during public review',
  'No visible customer follow-up system',
  'dedupe_key',
  'contactability_score',
  'owner_accessibility_score',
  'operational_gap_score',
]

for (const term of requiredTerms) {
  assertCase(source.includes(term), `Missing business discovery rule or field: ${term}`)
}

assertCase(source.includes('if (!contact.primary) return null'), 'No-contact-path rejection is missing.')
assertCase(source.includes('excludedTerms'), 'Exclusion list is missing.')
assertCase(source.includes('bank') && source.includes('university') && source.includes('hospital'), 'Large bureaucratic exclusions are incomplete.')
assertCase(source.includes('blog') && source.includes('directory'), 'Generic article/directory rejection is missing.')
assertCase(source.includes('QUALIFIED_SCORE'), 'Configurable qualification threshold is missing.')
assertCase(source.includes('APIFY_BUSINESS_LEAD_ACTOR_ID'), 'Dedicated business Apify actor variable is missing.')

assertCase(webhook.includes('/testbusinessleads'), 'Telegram /testbusinessleads command is missing.')
assertCase(webhook.includes('/runbusinessdiscovery'), 'Telegram /runbusinessdiscovery command is missing.')
assertCase(webhook.includes('sendAdminBusinessLeadPreview'), 'Telegram command is not wired to admin business lead delivery.')

assertCase(render.includes('ENABLE_BUSINESS_LEAD_DISCOVERY') && render.includes('value: "true"'), 'Business discovery feature flag is not enabled.')
assertCase(render.includes('ENABLE_INDIVIDUAL_LEAD_DISCOVERY') && render.includes('value: "false"'), 'Individual discovery feature flag is not disabled.')
assertCase(render.includes('ENABLE_ASSOCIATE_LEAD_DELIVERY') && render.includes('value: "false"'), 'Associate lead delivery feature flag is not disabled.')
assertCase(render.includes('ENABLE_ADMIN_LEAD_TEST_DELIVERY') && render.includes('value: "true"'), 'Admin lead test delivery feature flag is not enabled.')
assertCase(render.includes('ENABLE_AUTOMATIC_LEAD_ALLOCATION') && render.includes('value: "false"'), 'Automatic lead allocation is not disabled.')
assertCase(render.includes('GROWTH_ALLOCATION_MODE') && render.includes('MANUAL_ADMIN'), 'Growth allocation mode is not manual admin.')

console.log('Business lead discovery regression checks passed.')
