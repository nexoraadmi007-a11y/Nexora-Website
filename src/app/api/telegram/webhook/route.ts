import { NextRequest, NextResponse } from 'next/server'
import { actionFromTelegramCommand, assignLeadsToAssociate, formatLeadCard, generateSalesAssistant, parseLeadCommand, recordLeadActivity, resolveGrowthTelegramRole, sendAssociateLeadDigest } from '@/lib/growth-actions'
import { handleInboundConversation } from '@/lib/conversation-engine'
import { sendTelegramMessage, telegramName, type TelegramUpdate } from '@/lib/telegram'

export const runtime = 'nodejs'

function isAuthorized(request: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expected) return true
  return request.headers.get('x-telegram-bot-api-secret-token') === expected
}

async function reply(chatId: string, body: string, extra?: Record<string, unknown>) {
  await sendTelegramMessage(chatId, body)
  return NextResponse.json({ ok: true, reply: body, ...(extra || {}) })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized Telegram webhook.' }, { status: 401 })
  }

  try {
    const update = (await request.json()) as TelegramUpdate
    const message = update.message || update.edited_message
    const chatId = message?.chat?.id ? String(message.chat.id) : ''
    const text = message?.text || ''

    if (!message || !chatId) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fullName = telegramName(message)
    const username = message.from?.username ? `@${message.from.username}` : ''
    const fromId = message.from?.id ? String(message.from.id) : chatId
    const role = await resolveGrowthTelegramRole(fromId)

    if (text.startsWith('/')) {
      const command = text.split(/\s+/)[0].toLowerCase()

      if (command === '/start' || command === '/help') {
        const help = role.role === 'ADMIN'
          ? 'NEXORA Growth Admin commands:\n/today - view performance summary\n/assign ASSOCIATE_RECORD_ID 5 - assign leads\n\nAssociate commands:\n/leads, /contacted LEAD_ID, /interested LEAD_ID, /pending LEAD_ID, /converted LEAD_ID, /invalid LEAD_ID, /reply LEAD_ID paste conversation'
          : role.role === 'ASSOCIATE'
            ? 'NEXORA Associate commands:\n/leads - view assigned leads\n/contacted LEAD_ID\n/interested LEAD_ID\n/pending LEAD_ID\n/converted LEAD_ID\n/invalid LEAD_ID\n/reply LEAD_ID paste conversation'
            : 'Your Telegram ID is not linked to a NEXORA Growth Associate profile yet. Send this ID to admin for linking: ' + fromId
        return reply(chatId, help)
      }

      if (command === '/leads' && role.associate) {
        const leads = await sendAssociateLeadDigest(role.associate)
        return reply(chatId, `Sent ${leads.length} assigned lead${leads.length === 1 ? '' : 's'}.`, { role: role.role, leadCount: leads.length })
      }

      if (command === '/today' && role.role === 'ADMIN') {
        const { getGrowthOverview } = await import('@/lib/growth-operations')
        const overview = await getGrowthOverview()
        const summary = [
          `NEXORA Growth Summary - ${overview.month}`,
          `Active associates: ${overview.totals.activeAssociates}`,
          `Confirmed intake: ${overview.totals.confirmedIntake}/${overview.totals.target}`,
          `Net revenue: NGN ${overview.totals.netRevenue.toLocaleString()}`,
          overview.topAssociate ? `Top associate: ${overview.topAssociate.associateName} (${overview.topAssociate.confirmedIntake} intake)` : 'Top associate: none yet',
        ].join('\n')
        return reply(chatId, summary)
      }

      if (command === '/assign' && role.role === 'ADMIN') {
        const [, associateId = '', rawCount = '5'] = text.split(/\s+/)
        const assigned = await assignLeadsToAssociate({ associateId, count: Number(rawCount) || 5, adminUserId: fromId })
        return reply(chatId, assigned.length ? assigned.map((lead, index) => formatLeadCard(lead, index + 1)).join('\n\n') : 'No available leads to assign.')
      }

      if (command === '/reply' && role.associate) {
        const [, leadId = '', ...conversationParts] = text.split(/\s+/)
        const result = await generateSalesAssistant({
          leadId,
          associateId: role.associate.id,
          conversation: conversationParts.join(' '),
        })
        return reply(chatId, [
            `Stage: ${result.salesStage}`,
            `Objection: ${result.objection}`,
            '',
            `Suggested reply:\n${result.recommendedReply}`,
            '',
            `Next action: ${result.nextAction}`,
            `Follow-up: ${result.suggestedFollowUpAt}`,
          ].join('\n'))
      }

      const parsed = parseLeadCommand(text)
      const action = actionFromTelegramCommand(parsed.command)
      if (action && role.associate) {
        const result = await recordLeadActivity({
          leadId: parsed.leadId,
          associateId: role.associate.id,
          action,
          channel: 'Telegram',
          verificationType: 'ASSOCIATE_REPORTED',
          note: parsed.note,
        })
        return reply(chatId, `Lead updated: ${result.status}.`)
      }

      if (role.role !== 'UNKNOWN') return reply(chatId, 'Command not recognized. Send /help.')
    }

    const result = await handleInboundConversation({
      platform: 'Telegram',
      platformUserId: chatId,
      telegramChatId: chatId,
      telegramUsername: username,
      conversationId: `TG-${chatId}`,
      eventId: update.update_id ? String(update.update_id) : '',
      message: text,
      lastUserMessage: text,
      fullName,
      campaignSource: 'Telegram Bot',
      interestAreas: text.toLowerCase().includes('ambassador') ? ['Ambassador Programme'] : text.toLowerCase().includes('corporate') ? ['Corporate Training'] : [],
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('Telegram webhook failed', detail)
    const localDebug = (process.env.NEXT_PUBLIC_SITE_URL || '').includes('127.0.0.1')
    return NextResponse.json({ error: 'Telegram webhook failed.', ...(localDebug ? { detail } : {}) }, { status: 500 })
  }
}
