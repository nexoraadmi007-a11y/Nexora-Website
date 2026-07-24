const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appNkFVWpoI8ihHmA'
const AIRTABLE_API = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`

export type AirtableRecord<T> = {
  id: string
  fields: T
}

function token() {
  if (!process.env.AIRTABLE_TOKEN) {
    throw new Error('AIRTABLE_TOKEN is not configured')
  }
  return process.env.AIRTABLE_TOKEN
}

export function escapeFormula(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

export async function listRecords<T>(table: string, params?: { formula?: string; maxRecords?: number; sortField?: string; direction?: 'asc' | 'desc' }) {
  const url = new URL(`${AIRTABLE_API}/${encodeURIComponent(table)}`)
  url.searchParams.set('pageSize', String(Math.min(params?.maxRecords || 20, 100)))
  if (params?.maxRecords) url.searchParams.set('maxRecords', String(params.maxRecords))
  if (params?.formula) url.searchParams.set('filterByFormula', params.formula)
  if (params?.sortField) {
    url.searchParams.set('sort[0][field]', params.sortField)
    url.searchParams.set('sort[0][direction]', params.direction || 'asc')
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Airtable list ${table} failed: ${response.status}`)
  const data = (await response.json()) as { records?: Array<AirtableRecord<T>> }
  return data.records || []
}

export async function createRecord<T = { id: string; fields: Record<string, unknown> }>(table: string, fields: Record<string, unknown>) {
  const response = await fetch(`${AIRTABLE_API}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields, typecast: true }),
    cache: 'no-store',
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Airtable create ${table} failed: ${response.status} ${detail.slice(0, 240)}`)
  }
  return response.json() as Promise<T>
}

export async function updateRecord<T = { id: string; fields: Record<string, unknown> }>(table: string, recordId: string, fields: Record<string, unknown>) {
  const response = await fetch(`${AIRTABLE_API}/${encodeURIComponent(table)}/${recordId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields, typecast: true }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Airtable update ${table} failed: ${response.status}`)
  return response.json() as Promise<T>
}
