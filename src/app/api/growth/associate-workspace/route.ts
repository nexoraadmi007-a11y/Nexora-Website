import { NextRequest, NextResponse } from 'next/server'
import { escapeFormula, listRecords } from '@/lib/airtable'
import { formatConversationCopilotResult, runConversationCopilotWithSession } from '@/lib/growth-copilot'
import { getAssociateLeads, recordLeadActivity } from '@/lib/growth-actions'

export const runtime = 'nodejs'

type Fields = Record<string, any>

function text(value: unknown, max = 8000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function value(fields: Fields, name: string) {
  const raw = fields[name]
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ')
  if (typeof raw === 'number') return String(raw)
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  return typeof raw === 'string' ? raw.trim() : ''
}

async function findAssociate(referralCode: string) {
  const code = text(referralCode, 120)
  if (!code) return null
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `LOWER({Referral Code})='${escapeFormula(code.toLowerCase())}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

function leadSummary(record: { id: string; fields: Fields }, index: number) {
  const fields = record.fields
  return {
    id: record.id,
    index,
    title: value(fields, 'Business Name') || value(fields, 'Organization Name') || value(fields, 'Name') || 'Unnamed lead',
    leadType: value(fields, 'Lead Type') || value(fields, 'Pipeline') || 'Growth Lead',
    status: value(fields, 'Status') || 'Assigned',
    location: value(fields, 'City') || value(fields, 'State') || value(fields, 'Location') || 'Location unknown',
    programme: value(fields, 'Programme Match') || value(fields, 'Pipeline') || 'Programme match not set',
    signal: value(fields, 'Observable Signal') || value(fields, 'Next Action') || 'Review and qualify before outreach.',
    phone: value(fields, 'Phone'),
    email: value(fields, 'Email'),
    score: value(fields, 'Score') || value(fields, 'Strategic Score'),
    lastContactedAt: value(fields, 'Last Contacted At'),
    nextFollowUpAt: value(fields, 'Next Follow Up At'),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const associate = await findAssociate(text(searchParams.get('code'), 120))
    if (!associate) return NextResponse.json({ error: 'Referral code was not found.' }, { status: 404 })
    const leads = await getAssociateLeads(associate.id, 50)
    return NextResponse.json({
      ok: true,
      associateId: associate.id,
      leads: leads.map((lead, index) => leadSummary(lead, index + 1)),
    })
  } catch (error) {
    console.error('Associate workspace load failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Associate workspace could not be loaded.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const associate = await findAssociate(text(body.code, 120))
    if (!associate) return NextResponse.json({ error: 'Referral code was not found.' }, { status: 404 })

    const mode = text(body.mode, 80)
    const leadId = text(body.leadId, 120)
    if (mode === 'sales_assistant' || mode === 'growth_copilot') {
      const copilot = await runConversationCopilotWithSession({
        mode: 'conversation',
        text: text(body.conversation),
        associateId: associate.id,
        leadId,
        prospectReference: leadId,
      })
      if (leadId) {
        await recordLeadActivity({
          leadId,
          associateId: associate.id,
          action: 'sales_assistant_used',
          channel: 'Website',
          verificationType: 'SYSTEM_VERIFIED',
          note: `Conversation Copilot used.\nIntent: ${copilot.detectedIntent}\nSuggested reply: ${copilot.replyToSend}`,
        }).catch(() => undefined)
      }
      return NextResponse.json({
        ok: true,
        salesStage: copilot.conversationObjective,
        objection: copilot.detectedObjection || copilot.detectedIntent,
        recommendedReply: copilot.replyToSend,
        nextAction: copilot.nextBestAction,
        copilot,
        formatted: formatConversationCopilotResult(copilot),
      })
    }

    const result = await recordLeadActivity({
      leadId,
      associateId: associate.id,
      action: text(body.action, 80),
      channel: 'Website',
      verificationType: 'ASSOCIATE_REPORTED',
      note: text(body.note, 2000),
      nextFollowUpAt: text(body.nextFollowUpAt, 80),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Associate workspace action failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Associate workspace action failed.' }, { status: 500 })
  }
}
