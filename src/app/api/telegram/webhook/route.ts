import { NextRequest, NextResponse } from 'next/server'
import { createAssociateSubmittedLead, formatGrowthCopilotResult, runGrowthCopilot, type CopilotMode, type ProspectType } from '@/lib/growth-copilot'
import { actionFromTelegramCommand, assignLeadsToAssociate, formatLeadCard, generateSalesAssistant, parseLeadCommand, recordLeadActivity, resolveGrowthTelegramRole, sendAssociateLeadDigest } from '@/lib/growth-actions'
import { handleInboundConversation } from '@/lib/conversation-engine'
import { adminTestHelp, adminTestStatus, beginRespondSession, clearRespondSession, handleAdminTestCallback, hasActiveRespondSession, isAllowedAdminTestUser, logTelegramTestEvent, runAdminSalesAssistant, sendAdminLeadPreview, startMessageForUnverified } from '@/lib/telegram-admin-test'
import { answerTelegramCallback, sendTelegramMessage, telegramName, type TelegramUpdate } from '@/lib/telegram'

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

function copilotHelp() {
  return [
    'NEXORA AI Growth Copilot',
    '',
    '/respond pasted conversation',
    'Get the best next reply and action.',
    '',
    '/analyze profile, page or observation',
    'Analyse a person or business before outreach.',
    '',
    '/outreach prospect details',
    'Generate a first message.',
    '',
    '/followup stalled conversation',
    'Recover a conversation that has gone quiet.',
    '',
    '/newindividual details',
    'Submit an individual opportunity you know.',
    '',
    '/newbusiness details',
    'Submit a vendor or small business opportunity.',
    '',
    '/cancel',
    'Cancel the current test action.',
  ].join('\n')
}

function commandBody(message: string, command: string) {
  return message.replace(new RegExp(`^${command}(@\\w+)?`, 'i'), '').trim()
}

async function handleCopilotCommand(input: {
  command: string
  body: string
  role: Awaited<ReturnType<typeof resolveGrowthTelegramRole>>
  fromId: string
}) {
  const modeByCommand: Record<string, CopilotMode> = {
    '/respond': 'conversation',
    '/analyze': 'analyze',
    '/outreach': 'outreach',
    '/followup': 'followup',
  }
  const mode = modeByCommand[input.command]
  if (!mode) return null
  if (!input.body) {
    return `Paste the ${mode === 'conversation' ? 'prospect conversation' : mode === 'followup' ? 'stalled conversation' : 'prospect details'} after ${input.command}.`
  }
  const result = runGrowthCopilot({ mode, text: input.body })
  await logTelegramTestEvent({
    telegramUserId: input.fromId,
    eventType: `GROWTH_COPILOT_${mode.toUpperCase()}`,
    payload: { role: input.role.role, prospectType: result.prospectType, intent: result.intent, is_test: input.role.role === 'ADMIN' },
  })
  return formatGrowthCopilotResult(result)
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized Telegram webhook.' }, { status: 401 })
  }

  try {
    const update = (await request.json()) as TelegramUpdate
    const callback = update.callback_query
    if (callback) {
      const chatId = callback.message?.chat?.id ? String(callback.message.chat.id) : ''
      const fromId = callback.from?.id ? String(callback.from.id) : chatId
      const allowed = await isAllowedAdminTestUser(fromId, chatId)
      const data = callback.data || ''
      if (!allowed || !data.startsWith('tgtest:')) {
        await answerTelegramCallback(callback.id || '', 'This feature is currently available only to authorised Nexora administrators.')
        await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'UNAUTHORIZED_CALLBACK_ATTEMPT', payload: { data } })
        return NextResponse.json({ ok: true, blocked: true })
      }
      const [, action = '', leadId = ''] = data.split(':')
      const status = await handleAdminTestCallback({ action, leadId, telegramUserId: fromId, chatId })
      await answerTelegramCallback(callback.id || '', status)
      return NextResponse.json({ ok: true, callback: true })
    }

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
    const adminTestAllowed = await isAllowedAdminTestUser(fromId, chatId)

    if (text.startsWith('/')) {
      const command = text.split(/\s+/)[0].toLowerCase()

      if (command === '/copilothelp') {
        if (role.role === 'UNKNOWN' && !adminTestAllowed) return reply(chatId, startMessageForUnverified(message, chatId))
        return reply(chatId, copilotHelp())
      }

      if (['/analyze', '/outreach', '/followup'].includes(command)) {
        if (role.role === 'UNKNOWN' && !adminTestAllowed) return reply(chatId, startMessageForUnverified(message, chatId))
        const response = await handleCopilotCommand({ command, body: commandBody(text, command), role, fromId })
        return reply(chatId, response || 'Growth Copilot could not process that request.')
      }

      if (['/newlead', '/newindividual', '/newbusiness'].includes(command)) {
        if (role.role !== 'ASSOCIATE' && !adminTestAllowed) return reply(chatId, startMessageForUnverified(message, chatId))
        if (command === '/newlead') return reply(chatId, 'Use /newindividual followed by the details, or /newbusiness followed by the vendor/business details.')
        const body = commandBody(text, command)
        if (!body) return reply(chatId, `Paste the ${command === '/newbusiness' ? 'business' : 'individual'} details after ${command}.`)
        const prospectType: ProspectType = command === '/newbusiness' ? 'BUSINESS' : 'INDIVIDUAL'
        const created = await createAssociateSubmittedLead({
          prospectType,
          description: body,
          associateId: role.associate?.id,
          submittedBy: fromId,
        })
        const analysis = formatGrowthCopilotResult(created.analysis)
        const prefix = 'skipped' in created
          ? 'Duplicate found. I did not create another lead.'
          : 'Lead submitted and analysed. Ownership stays with the submitting associate where available.'
        await logTelegramTestEvent({ telegramUserId: fromId, eventType: `ASSOCIATE_SUBMITTED_${prospectType}_LEAD`, leadId: 'id' in created ? created.id : '', payload: { created } })
        return reply(chatId, [prefix, '', analysis].join('\n'))
      }

      if (['/testhelp', '/teststatus', '/testleads', '/respond', '/cancel', '/demoobjection'].includes(command)) {
        if (!adminTestAllowed) {
          await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'UNAUTHORIZED_COMMAND_ATTEMPT', payload: { command } })
          return reply(chatId, 'This feature is currently available only to authorised Nexora administrators.')
        }

        if (command === '/testhelp') return reply(chatId, adminTestHelp())
        if (command === '/teststatus') return reply(chatId, await adminTestStatus(fromId, chatId))
        if (command === '/cancel') {
          clearRespondSession(fromId)
          await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'SESSION_CANCELLED' })
          return reply(chatId, 'Current test action cancelled.')
        }
        if (command === '/testleads') {
          const count = Number(text.split(/\s+/)[1] || 5)
          const result = await sendAdminLeadPreview({ chatId, telegramUserId: fromId, count })
          return NextResponse.json({ ok: true, role: 'ADMIN', sent: result.sent })
        }
        if (command === '/respond') {
          const conversation = text.replace(/^\/respond(@\w+)?/i, '').trim()
          if (conversation) {
            try {
              const response = formatGrowthCopilotResult(runGrowthCopilot({ mode: 'conversation', text: conversation }))
              await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'AI_RESPONSE_SUCCEEDED', payload: { inputLength: conversation.length } })
              return reply(chatId, response)
            } catch (error) {
              await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'AI_RESPONSE_FAILED', payload: { error: error instanceof Error ? error.message : 'unknown' } })
              return reply(chatId, error instanceof Error ? error.message : 'The Sales Assistant could not generate a response at the moment. Please try again shortly.')
            }
          }
          beginRespondSession(fromId)
          await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'AI_RESPONSE_SESSION_STARTED' })
          return reply(chatId, 'Paste the prospect conversation you want Nexora AI to analyse.')
        }
        if (command === '/demoobjection') {
          const topic = text.split(/\s+/)[1] || 'price'
          const demo = `Prospect: I am interested in the programme, but I am worried about ${topic}.\nAssociate: What would help you decide?\nProspect: I need to understand it better first.`
          const response = await runAdminSalesAssistant(demo)
          await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'DEMO_OBJECTION_USED', payload: { topic } })
          return reply(chatId, response)
        }
      }

      if (command === '/start' || command === '/help') {
        const help = role.role === 'ADMIN'
          ? 'NEXORA Growth Admin commands:\n/today - view performance summary\n/assign ASSOCIATE_RECORD_ID 5 - assign leads\n/testhelp - view admin-only Telegram test commands\n\nAssociate commands:\n/leads, /contacted LEAD_ID, /interested LEAD_ID, /pending LEAD_ID, /converted LEAD_ID, /invalid LEAD_ID, /reply LEAD_ID paste conversation'
          : role.role === 'ASSOCIATE'
            ? 'NEXORA Associate commands:\n/leads - view assigned leads\n/contacted LEAD_ID\n/interested LEAD_ID\n/pending LEAD_ID\n/converted LEAD_ID\n/invalid LEAD_ID\n/reply LEAD_ID paste conversation'
            : startMessageForUnverified(message, chatId)
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

    if (adminTestAllowed && hasActiveRespondSession(fromId)) {
      try {
        const response = formatGrowthCopilotResult(runGrowthCopilot({ mode: 'conversation', text }))
        clearRespondSession(fromId)
        await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'AI_RESPONSE_SUCCEEDED', payload: { inputLength: text.length } })
        return reply(chatId, response)
      } catch (error) {
        await logTelegramTestEvent({ telegramUserId: fromId, eventType: 'AI_RESPONSE_FAILED', payload: { error: error instanceof Error ? error.message : 'unknown' } })
        return reply(chatId, error instanceof Error ? error.message : 'The Sales Assistant could not generate a response at the moment. Please try again shortly.')
      }
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
