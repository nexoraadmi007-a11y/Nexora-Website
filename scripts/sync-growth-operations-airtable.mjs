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
    // Optional for deployed environments.
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

const singleSelect = (choices) => ({
  type: 'singleSelect',
  options: { choices: choices.map((name, index) => ({ name, color: ['blueLight2', 'greenLight2', 'yellowLight2', 'redLight2', 'purpleLight2', 'cyanLight2', 'grayLight2'][index % 7] })) },
})

const commonDateFields = [
  { name: 'Created At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
  { name: 'Updated At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
]

const dateField = (name) => ({ name, type: 'date', options: { dateFormat: { name: 'iso' } } })

const tables = [
  {
    name: 'Associate HR Profiles',
    primaryFieldName: 'HR Profile ID',
    fields: [
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Legal Name', type: 'singleLineText' },
      dateField('Date Of Birth'),
      { name: 'Residential Address', type: 'multilineText' },
      { name: 'State Of Residence', type: 'singleLineText' },
      { name: 'Emergency Contact Name', type: 'singleLineText' },
      { name: 'Emergency Contact Phone', type: 'phoneNumber' },
      { name: 'Education Details', type: 'multilineText' },
      { name: 'HR Form Status', ...singleSelect(['Draft', 'Submitted', 'Approved', 'Rejected', 'Needs Correction']) },
      { name: 'Submitted At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      { name: 'Reviewed At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      { name: 'Reviewer', type: 'singleLineText' },
      ...commonDateFields,
    ],
  },
  {
    name: 'Payroll Details',
    primaryFieldName: 'Payroll ID',
    fields: [
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Bank Name', type: 'singleLineText' },
      { name: 'Account Name', type: 'singleLineText' },
      { name: 'Account Number', type: 'singleLineText' },
      { name: 'Account Number Last Four', type: 'singleLineText' },
      { name: 'Verification Status', ...singleSelect(['Pending Review', 'Verified', 'Rejected', 'Needs Correction']) },
      { name: 'Verification Date', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      ...commonDateFields,
    ],
  },
  {
    name: 'Employment Agreements',
    primaryFieldName: 'Agreement ID',
    fields: [
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Template Version', type: 'singleLineText' },
      { name: 'Document Version', type: 'number', options: { precision: 0 } },
      { name: 'Employment Title', type: 'singleLineText' },
      { name: 'Role Title', type: 'singleLineText' },
      { name: 'Salary', type: 'currency', options: { precision: 0, symbol: 'NGN' } },
      { name: 'Monthly Target', type: 'number', options: { precision: 0 } },
      dateField('Issue Date'),
      dateField('Start Date'),
      { name: 'Work Mode', ...singleSelect(['Remote', 'Hybrid', 'Field']) },
      { name: 'Employer Signatory', type: 'singleLineText' },
      { name: 'Signatory Title', type: 'singleLineText' },
      { name: 'Generated File Reference', type: 'url' },
      { name: 'Signed File Reference', type: 'url' },
      { name: 'Downloaded At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      { name: 'Signed Uploaded At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      { name: 'Verification Status', ...singleSelect(['Generated', 'Awaiting Signature', 'Signed Uploaded', 'Approved', 'Rejected']) },
      { name: 'Completion Status', ...singleSelect(['Draft', 'Awaiting Signature', 'Under Review', 'Completed', 'Rejected']) },
      ...commonDateFields,
    ],
  },
  {
    name: 'Associate Documents',
    primaryFieldName: 'Document ID',
    fields: [
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Employment Agreement', type: 'multipleRecordLinks', options: { linkedTableName: 'Employment Agreements' } },
      { name: 'Document Type', ...singleSelect(['Passport Photograph', 'Government ID', 'Signed Employment Letter', 'Other']) },
      { name: 'File Reference', type: 'url' },
      { name: 'Upload Status', ...singleSelect(['Uploaded', 'Pending', 'Failed']) },
      { name: 'Uploaded At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      { name: 'Verification Status', ...singleSelect(['Pending Review', 'Approved', 'Rejected', 'Needs Correction']) },
      { name: 'Reviewed By', type: 'singleLineText' },
      { name: 'Reviewed At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      { name: 'Notes', type: 'multilineText' },
      ...commonDateFields,
    ],
  },
  {
    name: 'Lead Activities',
    primaryFieldName: 'Activity ID',
    fields: [
      { name: 'Lead', type: 'multipleRecordLinks', options: { linkedTableName: 'Growth Leads' } },
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Activity Type', ...singleSelect(['ASSIGNED', 'VIEWED', 'CONTACTED', 'REPLIED', 'INTERESTED', 'APPLICATION_STARTED', 'PAYMENT_PENDING', 'CONVERTED', 'NOT_INTERESTED', 'INVALID', 'SKIPPED', 'CALL_REPORTED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_COMPLETED']) },
      { name: 'Funnel Stage Before', ...singleSelect(['ASSIGNED', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'INTERESTED', 'APPLICATION_STARTED', 'APPLICATION_COMPLETED', 'PAYMENT_PENDING', 'PAID', 'ENROLLED', 'CLOSED_LOST', 'INVALID', 'OPTED_OUT']) },
      { name: 'Funnel Stage After', ...singleSelect(['ASSIGNED', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'INTERESTED', 'APPLICATION_STARTED', 'APPLICATION_COMPLETED', 'PAYMENT_PENDING', 'PAID', 'ENROLLED', 'CLOSED_LOST', 'INVALID', 'OPTED_OUT']) },
      { name: 'Channel', ...singleSelect(['Telegram', 'WhatsApp', 'Phone', 'Email', 'Website', 'Instagram', 'LinkedIn', 'Facebook', 'Admin', 'System']) },
      { name: 'Verification Type', ...singleSelect(['SYSTEM_VERIFIED', 'ASSOCIATE_REPORTED', 'ADMIN_CONFIRMED']) },
      { name: 'Note', type: 'multilineText' },
      { name: 'Occurred At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      ...commonDateFields,
    ],
  },
  {
    name: 'Referral Events',
    primaryFieldName: 'Referral Event ID',
    fields: [
      { name: 'Referral Code', type: 'singleLineText' },
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Visitor ID', type: 'singleLineText' },
      { name: 'Session ID', type: 'singleLineText' },
      { name: 'Lead', type: 'multipleRecordLinks', options: { linkedTableName: 'Master Contacts' } },
      { name: 'Event Type', ...singleSelect(['LINK_CLICKED', 'LANDING_PAGE_VIEWED', 'APPLICATION_STARTED', 'APPLICATION_COMPLETED', 'CHECKOUT_STARTED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'ENROLLED', 'REFUNDED']) },
      { name: 'Page URL', type: 'url' },
      { name: 'Programme', type: 'multipleRecordLinks', options: { linkedTableName: 'Programmes' } },
      { name: 'Occurred At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
    ],
  },
  {
    name: 'Conversion Attribution',
    primaryFieldName: 'Attribution ID',
    fields: [
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Lead', type: 'multipleRecordLinks', options: { linkedTableName: 'Master Contacts' } },
      { name: 'Application', type: 'multipleRecordLinks', options: { linkedTableName: 'NGTP Applications' } },
      { name: 'Payment', type: 'multipleRecordLinks', options: { linkedTableName: 'Payments' } },
      { name: 'Enrollment', type: 'multipleRecordLinks', options: { linkedTableName: 'Enrollments' } },
      { name: 'Payment Reference', type: 'singleLineText' },
      { name: 'Attribution Source', ...singleSelect(['DIRECT_REFERRAL', 'ASSIGNED_LEAD', 'ADMIN_CONFIRMED', 'CONFLICT_REVIEW']) },
      { name: 'Attribution Status', ...singleSelect(['PENDING', 'APPROVED', 'CONFLICT', 'REJECTED', 'LOCKED']) },
      { name: 'Attributed Amount', type: 'currency', options: { precision: 0, symbol: 'NGN' } },
      { name: 'Net Amount', type: 'currency', options: { precision: 0, symbol: 'NGN' } },
      { name: 'Conflict Reason', type: 'multilineText' },
      { name: 'Approved By', type: 'singleLineText' },
      ...commonDateFields,
    ],
  },
  {
    name: 'Monthly Performance',
    primaryFieldName: 'Performance ID',
    fields: [
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Month', type: 'singleLineText' },
      { name: 'Target', type: 'number', options: { precision: 0 } },
      { name: 'Confirmed Intake', type: 'number', options: { precision: 0 } },
      { name: 'Gross Revenue', type: 'currency', options: { precision: 0, symbol: 'NGN' } },
      { name: 'Refund Amount', type: 'currency', options: { precision: 0, symbol: 'NGN' } },
      { name: 'Net Revenue', type: 'currency', options: { precision: 0, symbol: 'NGN' } },
      { name: 'Conversion Rate', type: 'percent', options: { precision: 2 } },
      { name: 'Target Achievement Percentage', type: 'percent', options: { precision: 2 } },
      { name: 'Rank', type: 'number', options: { precision: 0 } },
      { name: 'Status', ...singleSelect(['AHEAD', 'ON_TRACK', 'AT_RISK', 'BEHIND', 'TARGET_ACHIEVED']) },
      { name: 'Calculated At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
    ],
  },
  {
    name: 'Bonus Configurations',
    primaryFieldName: 'Name',
    fields: [
      { name: 'Period Type', ...singleSelect(['MONTHLY', 'QUARTERLY', 'MANUAL']) },
      { name: 'Number Of Winners', type: 'number', options: { precision: 0 } },
      { name: 'Ranking Metric', ...singleSelect(['CONFIRMED_PAID_INTAKES', 'NET_REVENUE', 'CONVERSION_RATE', 'MANUAL']) },
      { name: 'Minimum Target Required', type: 'checkbox', options: { icon: 'check', color: 'greenBright' } },
      { name: 'Bonus Type', ...singleSelect(['FIXED_AMOUNT', 'PERCENTAGE_OF_REVENUE', 'TIERED_RANK_BONUS', 'MANUAL_AWARD']) },
      { name: 'Rank Amounts JSON', type: 'multilineText' },
      { name: 'Percentage Rules JSON', type: 'multilineText' },
      { name: 'Tie Breaker Rules JSON', type: 'multilineText' },
      { name: 'Active', type: 'checkbox', options: { icon: 'check', color: 'greenBright' } },
      dateField('Effective From'),
      dateField('Effective To'),
    ],
  },
  {
    name: 'Bonus Awards',
    primaryFieldName: 'Bonus Award ID',
    fields: [
      { name: 'Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
      { name: 'Month', type: 'singleLineText' },
      { name: 'Rank', type: 'number', options: { precision: 0 } },
      { name: 'Bonus Configuration', type: 'multipleRecordLinks', options: { linkedTableName: 'Bonus Configurations' } },
      { name: 'Calculated Amount', type: 'currency', options: { precision: 0, symbol: 'NGN' } },
      { name: 'Approved Amount', type: 'currency', options: { precision: 0, symbol: 'NGN' } },
      { name: 'Eligibility Status', ...singleSelect(['ELIGIBLE', 'INELIGIBLE', 'NEEDS_REVIEW']) },
      { name: 'Status', ...singleSelect(['DRAFT', 'CALCULATED', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED']) },
      { name: 'Approved By', type: 'singleLineText' },
      { name: 'Approved At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      { name: 'Paid At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
      { name: 'Payment Reference', type: 'singleLineText' },
      { name: 'Adjustment Reason', type: 'multilineText' },
      ...commonDateFields,
    ],
  },
  {
    name: 'Growth Audit Logs',
    primaryFieldName: 'Audit ID',
    fields: [
      { name: 'User ID', type: 'singleLineText' },
      { name: 'Action', type: 'singleLineText' },
      { name: 'Entity Type', type: 'singleLineText' },
      { name: 'Entity ID', type: 'singleLineText' },
      { name: 'Previous Value', type: 'multilineText' },
      { name: 'New Value', type: 'multilineText' },
      { name: 'Reason', type: 'multilineText' },
      { name: 'Created At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
    ],
  },
]

const ambassadorFields = [
  { name: 'Telegram User ID', type: 'singleLineText' },
  { name: 'Referral Link', type: 'url' },
  { name: 'Active', type: 'checkbox', options: { icon: 'check', color: 'greenBright' } },
  { name: 'Team ID', type: 'singleLineText' },
  { name: 'Daily Lead Quota', type: 'number', options: { precision: 0 } },
  { name: 'Lead Access Status', ...singleSelect(['Enabled', 'Paused', 'Suspended']) },
  { name: 'Operational Restriction', type: 'multilineText' },
  { name: 'Monthly Intake Target', type: 'number', options: { precision: 0 } },
  { name: 'Onboarding Status', ...singleSelect(['Pending', 'Invited', 'Active', 'Paused', 'Completed']) },
  { name: 'Referral Status', ...singleSelect(['Active', 'Paused', 'Suspended']) },
  { name: 'HR Onboarding Status', ...singleSelect(['Not Started', 'Link Sent', 'In Progress', 'Submitted', 'Approved', 'Needs Correction', 'Completed', 'Revoked']) },
  { name: 'Employment Letter Status', ...singleSelect(['Not Generated', 'Generated', 'Sent', 'Downloaded', 'Signed Uploaded', 'Approved', 'Rejected']) },
  { name: 'HR Onboarding Token Hash', type: 'singleLineText' },
  { name: 'HR Onboarding Token Expires At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
  { name: 'HR Onboarding Link Revoked', type: 'checkbox', options: { icon: 'check', color: 'redBright' } },
  dateField('Employment Start Date'),
  { name: 'Work Mode', ...singleSelect(['Remote', 'Hybrid', 'Field']) },
  { name: 'Employment Onboarding Completed At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
  { name: 'Created At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
  { name: 'Updated At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
]

const growthLeadFields = [
  { name: 'Lead Type', ...singleSelect(['INDIVIDUAL', 'NYSC_MEMBER', 'PROSPECTIVE_NYSC_MEMBER', 'FINAL_YEAR_STUDENT', 'FIVE_HUNDRED_LEVEL_STUDENT', 'RECENT_GRADUATE', 'EARLY_CAREER_PROFESSIONAL', 'BUSINESS', 'INSTAGRAM_VENDOR', 'FACEBOOK_VENDOR', 'WHATSAPP_BUSINESS', 'SOCIAL_COMMERCE_BRAND', 'ONLINE_SERVICE_PROVIDER', 'SMALL_ECOMMERCE_BRAND', 'FOUNDER_LED_BUSINESS', 'CAREER_ACCELERATOR', 'BUSINESS_TRANSFORMATION', 'CORPORATE_AI_TRAINING']) },
  { name: 'Name', type: 'singleLineText' },
  { name: 'Business Name', type: 'singleLineText' },
  { name: 'School', type: 'singleLineText' },
  { name: 'Department', type: 'singleLineText' },
  { name: 'Academic Level', type: 'singleLineText' },
  { name: 'NYSC Status', type: 'singleLineText' },
  { name: 'NYSC State', type: 'singleLineText' },
  { name: 'City', type: 'singleLineText' },
  { name: 'State', type: 'singleLineText' },
  { name: 'Email', type: 'email' },
  { name: 'Phone', type: 'phoneNumber' },
  { name: 'Public Profile URL', type: 'url' },
  { name: 'Source URL', type: 'url' },
  { name: 'Discovery Source', type: 'singleLineText' },
  { name: 'Final Contact Source', type: 'singleLineText' },
  { name: 'Contactability Status', ...singleSelect(['CONTACTABLE', 'NEEDS_CONTACT_PATH', 'UNVERIFIED', 'OPTED_OUT']) },
  { name: 'Prospect Category', ...singleSelect(['INDIVIDUAL', 'BUSINESS']) },
  { name: 'Submitted By Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
  { name: 'Copilot Analysis JSON', type: 'multilineText' },
  { name: 'Recommended Opening Message', type: 'multilineText' },
  { name: 'Recommended Follow Up', type: 'multilineText' },
  { name: 'Recommended Entry Solution', type: 'singleLineText' },
  { name: 'Source Quality Status', ...singleSelect(['VERIFIED_PROFILE', 'PUBLIC_PROFILE', 'GENERIC_ARTICLE', 'MISSING_CONTACT_PATH', 'NEEDS_REVIEW']) },
  { name: 'Observable Signal', type: 'multilineText' },
  { name: 'Qualification Reason', type: 'multilineText' },
  { name: 'Score Components JSON', type: 'multilineText' },
  { name: 'Source Platform', type: 'singleLineText' },
  { name: 'Source Group', type: 'singleLineText' },
  { name: 'Education Stage', type: 'singleLineText' },
  { name: 'Career Interest', type: 'singleLineText' },
  { name: 'Discovery Timestamp', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
  { name: 'Persona', type: 'singleLineText' },
  { name: 'Programme Match', type: 'singleLineText' },
  { name: 'Score', type: 'number', options: { precision: 0 } },
  { name: 'Confidence', type: 'number', options: { precision: 2 } },
  { name: 'Status', ...singleSelect(['New', 'Discovered', 'Unverified', 'Needs Contact Path', 'Qualified', 'Ready For Assignment', 'Assigned', 'Viewed', 'Contacted', 'Replied', 'Interest Confirmed', 'Need Identified', 'Programme Matched', 'Solution Matched', 'Follow Up Scheduled', 'Meeting Booked', 'Application Started', 'Payment Pending', 'Converted', 'Not Interested', 'Closed Lost', 'Invalid', 'Opted Out']) },
  { name: 'Assigned Associate', type: 'multipleRecordLinks', options: { linkedTableName: 'Ambassadors' } },
  { name: 'Assigned At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
  { name: 'Last Contacted At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
  { name: 'Next Follow Up At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'Africa/Lagos' } },
  { name: 'Opted Out', type: 'checkbox', options: { icon: 'check', color: 'redBright' } },
  ...commonDateFields,
]

async function airtable(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url} failed: ${response.status} ${JSON.stringify(data).slice(0, 600)}`)
  }
  return data
}

function fieldNames(table) {
  return new Set((table?.fields || []).map((field) => field.name))
}

async function getSchema() {
  return airtable(metaApi)
}

function findTable(schema, name) {
  return schema.tables.find((table) => table.name === name)
}

async function createTable(name, primaryFieldName, fields) {
  const schema = await getSchema()
  await airtable(metaApi, {
    method: 'POST',
    body: JSON.stringify({
      name,
      fields: [{ name: primaryFieldName, type: 'singleLineText' }, ...fields.map((field) => normalizeField(field, schema))],
    }),
  })
}

async function ensureField(table, field) {
  if (fieldNames(table).has(field.name)) return false
  const schema = await getSchema()
  await airtable(`${metaApi}/${table.id}/fields`, {
    method: 'POST',
    body: JSON.stringify(normalizeField(field, schema)),
  })
  return true
}

function normalizeField(field, schema) {
  if (field.type !== 'multipleRecordLinks' || !field.options?.linkedTableName) return field
  const linked = findTable(schema, field.options.linkedTableName)
  if (!linked) throw new Error(`Linked table ${field.options.linkedTableName} was not found for field ${field.name}.`)
  return {
    ...field,
    options: {
      linkedTableId: linked.id,
    },
  }
}

async function ensureTable(schema, tableSpec) {
  const table = findTable(schema, tableSpec.name)
  if (!table) {
    await createTable(tableSpec.name, tableSpec.primaryFieldName, tableSpec.fields)
    return { table: tableSpec.name, created: true, fieldsAdded: tableSpec.fields.length }
  }

  let fieldsAdded = 0
  for (const field of tableSpec.fields) {
    if (await ensureField(table, field)) fieldsAdded += 1
  }
  return { table: tableSpec.name, created: false, fieldsAdded }
}

async function ensureDefaultBonusConfig() {
  const url = new URL(`${dataApi}/${encodeURIComponent('Bonus Configurations')}`)
  url.searchParams.set('maxRecords', '1')
  url.searchParams.set('filterByFormula', "{Name}='Default Monthly Growth Bonus'")
  const existing = await airtable(url)
  if (existing.records?.length) return 'existing'

  await airtable(`${dataApi}/${encodeURIComponent('Bonus Configurations')}`, {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        Name: 'Default Monthly Growth Bonus',
        'Period Type': 'MONTHLY',
        'Number Of Winners': 1,
        'Ranking Metric': 'CONFIRMED_PAID_INTAKES',
        'Minimum Target Required': true,
        'Bonus Type': 'TIERED_RANK_BONUS',
        'Rank Amounts JSON': '{"1":null}',
        'Tie Breaker Rules JSON': '["NET_REVENUE","CONVERSION_RATE","EARLIEST_TARGET_REACHED"]',
        Active: true,
        'Effective From': new Date().toISOString().slice(0, 10),
      },
      typecast: true,
    }),
  })
  return 'created'
}

async function main() {
  let schema = await getSchema()
  const results = []

  const ambassadors = findTable(schema, 'Ambassadors')
  if (!ambassadors) throw new Error('Ambassadors table was not found.')
  for (const field of ambassadorFields) {
    if (await ensureField(ambassadors, field)) results.push({ table: 'Ambassadors', field: field.name, action: 'added' })
  }

  const growthLeads = findTable(schema, 'Growth Leads')
  if (growthLeads) {
    for (const field of growthLeadFields) {
      if (await ensureField(growthLeads, field)) results.push({ table: 'Growth Leads', field: field.name, action: 'added' })
    }
  } else {
    await createTable('Growth Leads', 'Lead ID', growthLeadFields)
    results.push({ table: 'Growth Leads', action: 'created' })
  }

  schema = await getSchema()
  for (const table of tables) {
    results.push(await ensureTable(schema, table))
    schema = await getSchema()
  }

  const bonusConfig = await ensureDefaultBonusConfig()
  console.log(JSON.stringify({ ok: true, results, bonusConfig }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
