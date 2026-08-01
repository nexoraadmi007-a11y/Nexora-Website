const baseId = process.env.AIRTABLE_BASE_ID || 'appNkFVWpoI8ihHmA'
const token = process.env.AIRTABLE_TOKEN
const paystackSecret = process.env.PAYSTACK_SECRET_KEY
const mode = process.argv.includes('--apply') ? 'apply' : 'dry-run'
const referenceArg = process.argv.find((arg) => arg.startsWith('--reference='))?.split('=').slice(1).join('=')

if (!token) throw new Error('AIRTABLE_TOKEN is required')
if (!paystackSecret) throw new Error('PAYSTACK_SECRET_KEY is required')

const api = `https://api.airtable.com/v0/${baseId}`

function headers(json = true) {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  }
}

function escapeFormula(value) {
  return String(value || '').replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

async function airtableList(table, params = {}) {
  const url = new URL(`${api}/${encodeURIComponent(table)}`)
  url.searchParams.set('pageSize', '100')
  if (params.formula) url.searchParams.set('filterByFormula', params.formula)
  if (params.maxRecords) url.searchParams.set('maxRecords', String(params.maxRecords))
  const response = await fetch(url, { headers: headers(false) })
  const body = await response.json()
  if (!response.ok) throw new Error(`Airtable list ${table} failed: ${response.status} ${JSON.stringify(body).slice(0, 240)}`)
  return body.records || []
}

async function airtableCreate(table, fields) {
  if (mode !== 'apply') return { id: `dry-${table}` }
  const response = await fetch(`${api}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ fields, typecast: true }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`Airtable create ${table} failed: ${response.status} ${JSON.stringify(body).slice(0, 240)}`)
  return body
}

async function airtableUpdate(table, id, fields) {
  if (mode !== 'apply') return { id, fields }
  const response = await fetch(`${api}/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields, typecast: true }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`Airtable update ${table} failed: ${response.status} ${JSON.stringify(body).slice(0, 240)}`)
  return body
}

async function verifyPaystack(reference) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackSecret}` },
  })
  const body = await response.json()
  if (!response.ok || !body.status) throw new Error(`Paystack verify failed for ${reference}: ${body.message || response.status}`)
  return body.data
}

async function one(table, field, value) {
  const records = await airtableList(table, {
    formula: `{${field}}='${escapeFormula(value)}'`,
    maxRecords: 1,
  }).catch(() => [])
  return records[0] || null
}

async function run() {
  const formula = referenceArg
    ? `{Payment Reference}='${escapeFormula(referenceArg)}'`
    : "AND({Payment Reference}!='',{Referral Code}!='')"
  const events = await airtableList('Website Payment Events', { formula })
  const summary = { mode, scanned: events.length, repaired: 0, skipped: 0, failed: 0, details: [] }

  for (const event of events) {
    const reference = event.fields['Payment Reference']
    const referralCode = event.fields['Referral Code']
    const ambassadorId = event.fields.Ambassador?.[0]
    try {
      if (!reference || !referralCode || !ambassadorId) {
        summary.skipped += 1
        summary.details.push({ reference, status: 'skipped', reason: 'missing reference/referral/ambassador' })
        continue
      }

      const transaction = await verifyPaystack(reference)
      if (transaction.status !== 'success') {
        summary.skipped += 1
        summary.details.push({ reference, status: 'skipped', reason: `paystack ${transaction.status}` })
        continue
      }

      const existingAttribution = await one('Conversion Attribution', 'Payment Reference', reference)
      if (!existingAttribution) {
        await airtableCreate('Conversion Attribution', {
          'Attribution ID': `ATTR-${reference}`,
          Associate: [ambassadorId],
          'Payment Reference': reference,
          'Attribution Source': 'DIRECT_REFERRAL',
          'Attribution Status': 'APPROVED',
          'Attributed Amount': Math.round(Number(transaction.amount || 0) / 100),
          'Net Amount': Math.round(Number(transaction.amount || 0) / 100),
          'Created At': new Date().toISOString(),
          'Updated At': new Date().toISOString(),
        })
      }

      const referral = await one('Ambassador Referrals', 'Payment Reference', reference)
      if (referral) {
        await airtableUpdate('Ambassador Referrals', referral.id, {
          'Referral Status': 'Payment Confirmed',
          'Commission Status': 'Earned',
          'Qualifying Referral': true,
          'Qualification Date': String(transaction.paid_at || new Date().toISOString()).slice(0, 10),
        })
      }

      summary.repaired += 1
      summary.details.push({ reference, status: mode === 'apply' ? 'repaired' : 'would-repair' })
    } catch (error) {
      summary.failed += 1
      summary.details.push({ reference, status: 'failed', error: error instanceof Error ? error.message : String(error) })
    }
  }

  console.log(JSON.stringify(summary, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
