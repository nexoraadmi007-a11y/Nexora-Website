import { NextRequest, NextResponse } from 'next/server'
import { createIndividualLead, type IndividualLeadInput } from '@/lib/individual-growth-engine'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function authorized(request: NextRequest) {
  const expected = adminSecret()
  if (!expected) return (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
  return request.headers.get('x-nexora-admin-secret') === expected || request.headers.get('x-nexora-secret') === expected
}

function text(value: unknown, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function splitCsvLine(line: string) {
  const cells = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === ',' && !quoted) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

const headers: Array<keyof IndividualLeadInput> = [
  'fullName',
  'subtype',
  'publicProfileUrl',
  'sourceUrl',
  'observableSignal',
  'institution',
  'courseOfStudy',
  'academicLevel',
  'nyscStatus',
  'state',
  'careerInterest',
  'programmeMatch',
  'email',
  'phone',
]

function parseBulk(raw: string) {
  return raw.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = splitCsvLine(line)
      return Object.fromEntries(headers.map((key, index) => [key, cells[index] || ''])) as IndividualLeadInput
    })
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const rawLeads = Array.isArray(body.leads) ? body.leads : parseBulk(text(body.bulk, 20000))
    const leads = rawLeads.map((lead: Record<string, unknown>) => ({
      fullName: text(lead.fullName || lead.name, 180),
      subtype: text(lead.subtype || lead.leadType, 120),
      email: text(lead.email, 254).toLowerCase(),
      phone: text(lead.phone, 80),
      publicProfileUrl: text(lead.publicProfileUrl || lead.profileUrl, 500),
      sourceUrl: text(lead.sourceUrl, 500),
      sourcePlatform: text(lead.sourcePlatform, 120),
      sourceGroup: text(lead.sourceGroup, 180),
      observableSignal: text(lead.observableSignal || lead.evidence || lead.signal, 2000),
      institution: text(lead.institution || lead.school, 180),
      courseOfStudy: text(lead.courseOfStudy || lead.department, 180),
      academicLevel: text(lead.academicLevel, 80),
      nyscStatus: text(lead.nyscStatus, 120),
      nyscState: text(lead.nyscState, 120),
      state: text(lead.state, 120),
      city: text(lead.city, 120),
      careerInterest: text(lead.careerInterest, 180),
      programmeMatch: text(lead.programmeMatch, 180),
    }))

    if (!leads.length) {
      return NextResponse.json({ error: 'Add at least one individual lead.' }, { status: 400 })
    }

    const results = []
    for (const lead of leads) {
      try {
        results.push(await createIndividualLead(lead))
      } catch (error) {
        results.push({ failed: true, name: lead.fullName, error: error instanceof Error ? error.message : 'Lead import failed.' })
      }
    }

    return NextResponse.json({
      ok: true,
      received: leads.length,
      imported: results.filter((item: any) => item.imported).length,
      skipped: results.filter((item: any) => item.skipped).length,
      failed: results.filter((item: any) => item.failed).length,
      results,
    })
  } catch (error) {
    console.error('Individual lead import failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Individual lead import failed.' }, { status: 500 })
  }
}

