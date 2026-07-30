const baseId = process.env.AIRTABLE_BASE_ID || 'appNkFVWpoI8ihHmA'
const token = process.env.AIRTABLE_TOKEN
const args = new Set(process.argv.slice(2))
const associateIdArg = process.argv.find((arg) => arg.startsWith('--associate-id='))?.split('=').slice(1).join('=')
const apply = args.has('--apply')
const missingOnly = !args.has('--all')

if (!token) {
  console.error('AIRTABLE_TOKEN is required.')
  process.exit(1)
}

const api = `https://api.airtable.com/v0/${baseId}`
const now = new Date().toISOString()

function escapeFormula(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

async function airtable(path, init = {}) {
  const response = await fetch(`${api}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Airtable ${path} failed: ${response.status} ${detail.slice(0, 240)}`)
  }
  return response.json()
}

async function list(table, params = {}) {
  const url = new URL(`${api}/${encodeURIComponent(table)}`)
  url.searchParams.set('pageSize', '100')
  if (params.formula) url.searchParams.set('filterByFormula', params.formula)
  const records = []
  let offset = ''
  do {
    if (offset) url.searchParams.set('offset', offset)
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) throw new Error(`Airtable list ${table} failed: ${response.status}`)
    const data = await response.json()
    records.push(...(data.records || []))
    offset = data.offset || ''
  } while (offset)
  return records
}

async function latestAgreement(associateId) {
  const records = await list('Employment Agreements', {
    formula: `FIND('${escapeFormula(associateId)}',ARRAYJOIN({Associate}))`,
  })
  return records[0] || null
}

function agreementFields(associate) {
  return {
    'Agreement ID': `EMP-${Date.now()}-${associate.id.slice(-4)}`,
    Associate: [associate.id],
    'Template Version': 'NEX-HR-EMP-001',
    'Document Version': 1,
    'Employment Title': 'Growth Associate',
    'Role Title': 'Growth Associate',
    Salary: 75000,
    'Monthly Target': 30,
    'Issue Date': now.slice(0, 10),
    'Start Date': associate.fields['Employment Start Date'] || now.slice(0, 10),
    'Work Mode': associate.fields['Work Mode'] || 'Hybrid',
    'Employer Signatory': 'Zephaniah Morakinyo',
    'Signatory Title': 'CEO',
    'Verification Status': 'LETTER_READY',
    'Completion Status': 'Awaiting Signature',
    'Created At': now,
    'Updated At': now,
  }
}

const formula = associateIdArg
  ? `RECORD_ID()='${escapeFormula(associateIdArg)}'`
  : `OR({HR Onboarding Status}='Submitted',{HR Onboarding Status}='Signed Copy Under Review',{Employment Letter Status}='Generated',{Employment Letter Status}='LETTER_READY')`

const associates = await list('Ambassadors', { formula })
const results = []

for (const associate of associates) {
  const agreement = await latestAgreement(associate.id)
  const needsRepair = !agreement
  if (missingOnly && !needsRepair) {
    results.push({ associate: associate.fields['Ambassador Name'] || associate.fields['Full Name'] || associate.id, action: 'skipped', reason: 'agreement exists' })
    continue
  }
  if (!apply) {
    results.push({ associate: associate.fields['Ambassador Name'] || associate.fields['Full Name'] || associate.id, action: needsRepair ? 'would_create_agreement' : 'would_refresh_status', agreementId: agreement?.id || '' })
    continue
  }
  let agreementId = agreement?.id || ''
  if (!agreement) {
    const created = await airtable(encodeURIComponent('Employment Agreements'), {
      method: 'POST',
      body: JSON.stringify({ fields: agreementFields(associate), typecast: true }),
    })
    agreementId = created.id
  }
  await airtable(`${encodeURIComponent('Ambassadors')}/${associate.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: {
        'Employment Letter Status': 'LETTER_READY',
        'Updated At': new Date().toISOString(),
      },
      typecast: true,
    }),
  })
  results.push({ associate: associate.fields['Ambassador Name'] || associate.fields['Full Name'] || associate.id, action: needsRepair ? 'created_agreement' : 'refreshed_status', agreementId })
}

console.table(results)
console.log(apply ? 'Repair completed.' : 'Dry run completed. Re-run with --apply to write changes.')
