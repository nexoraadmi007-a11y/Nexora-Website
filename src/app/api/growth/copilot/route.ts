import { NextRequest, NextResponse } from 'next/server'
import { createAssociateSubmittedLead, formatConversationCopilotResult, formatGrowthCopilotResult, runConversationCopilot, runGrowthCopilot, type CopilotMode, type ProspectType } from '@/lib/growth-copilot'
import { findAssociateByTelegramUserId } from '@/lib/growth-actions'

export const runtime = 'nodejs'

function adminSecret() {
  return process.env.GROWTH_ADMIN_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.CRON_SECRET || ''
}

function text(value: unknown, max = 8000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function validMode(value: string): CopilotMode {
  return ['conversation', 'analyze', 'outreach', 'followup', 'opportunity'].includes(value) ? value as CopilotMode : 'conversation'
}

function validProspectType(value: string): ProspectType | undefined {
  const raw = value.toUpperCase()
  return raw === 'INDIVIDUAL' || raw === 'BUSINESS' ? raw : undefined
}

export async function POST(request: NextRequest) {
  try {
    const expected = adminSecret()
    const adminOk = Boolean(expected && request.headers.get('x-nexora-admin-secret') === expected)
    const telegramUserId = request.headers.get('x-nexora-telegram-user-id') || ''
    const body = await request.json().catch(() => ({}))
    let associateId = text(body.associateId, 120)
    if (!associateId && telegramUserId) {
      const associate = await findAssociateByTelegramUserId(telegramUserId)
      associateId = associate?.id || ''
    }
    if (!adminOk && !associateId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    if (text(body.action, 80) === 'submit_lead') {
      const prospectType = validProspectType(text(body.prospectType, 40)) || 'INDIVIDUAL'
      const created = await createAssociateSubmittedLead({
        prospectType,
        description: text(body.text || body.description),
        associateId,
        submittedBy: adminOk ? 'admin' : telegramUserId,
      })
      return NextResponse.json({ ok: true, ...created, formatted: formatGrowthCopilotResult(created.analysis) })
    }

    const mode = validMode(text(body.mode, 40))
    if (mode === 'conversation') {
      const result = runConversationCopilot({
        mode: 'conversation',
        text: text(body.text || body.conversation || body.description),
        prospectType: validProspectType(text(body.prospectType, 40)),
        associateId,
        leadId: text(body.leadId, 120),
      })
      return NextResponse.json({ ok: true, ...result, formatted: formatConversationCopilotResult(result) })
    }

    const result = runGrowthCopilot({
      mode,
      text: text(body.text || body.conversation || body.description),
      prospectType: validProspectType(text(body.prospectType, 40)),
      associateId,
      leadId: text(body.leadId, 120),
      sourceUrl: text(body.sourceUrl, 500),
    })

    return NextResponse.json({ ok: true, ...result, formatted: formatGrowthCopilotResult(result) })
  } catch (error) {
    console.error('Growth Copilot failed', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Growth Copilot failed.' }, { status: 500 })
  }
}
