# Conversation Copilot Correction Audit

## Root Cause

The Telegram `/respond` command used `runGrowthCopilot({ mode: 'conversation' })`, but `runGrowthCopilot()` calculated lead-analysis fields for every mode. This meant contactability checks, generic-source checks, assignability concerns and outreach readiness were applied to an active conversation.

The formatter then printed those internal fields for every mode through `formatGrowthCopilotResult()`. As a result, a simple objection like "I don't have enough money now" could show "Missing valid contact path" and "Ask for or locate a valid public contact route before outreach."

## Files Affected

- `src/lib/growth-copilot.ts`
- `src/app/api/telegram/webhook/route.ts`
- `src/app/api/growth/copilot/route.ts`
- `src/app/api/growth/associate-workspace/route.ts`
- `src/lib/telegram-admin-test.ts`

## Prompt-Routing Problem

The `/respond` command was treated as a general copilot command instead of a strict conversation-response command. The mode flag existed, but it did not prevent lead-analysis logic from running.

The corrected route now sends `/respond`, temporary respond sessions, associate `/reply`, Growth Copilot API `conversation` mode and associate workspace conversation requests to `runConversationCopilot()` only.

## Schema Contamination

The previous response schema mixed:

- `issueDetected`
- contactability
- lead source quality
- escalation
- programme match
- confidence
- follow-up timestamp

Those fields are valid for lead analysis and outreach preparation, but not for an ongoing WhatsApp-style prospect conversation.

The new conversation schema is:

- `mode = CONVERSATION_RESPONSE`
- `detectedIntent`
- `detectedObjection`
- `conversationObjective`
- `replyToSend`
- `nextBestAction`
- optional response branches
- trusted programme snapshot

It explicitly sets lead-contactability, lead-source and outreach-status context to `null`.

## Fallback Behaviour

The old fallback used generic language such as "Based on what you shared" and defaulted to a 24-hour follow-up. It also asked associates to confirm known prices from the official page even though the current Career Accelerator price exists in configuration.

The corrected behaviour uses deterministic, intent-specific replies and context-specific next actions. It does not recommend generic 24-hour follow-up unless the prospect's message supports that timing.

## Knowledge-Base Limitations

The current trusted programme snapshot is grounded in `src/lib/career-accelerator-v2.ts`.

Current approved facts used by Conversation Copilot:

- Programme family: Career Accelerator
- Current price: NGN 10,000
- Programmes: AI Content Creation, Certified UI/UX Designer (AI-Powered), AI Financial Analyst
- Value points: structure, roadmap, practical projects, guidance, feedback, portfolio development, accountability and capstone review
- Job guarantee: false
- Income guarantee: false

If programme pricing changes, `career-accelerator-v2.ts` must be updated first so the conversation copilot remains grounded.

## Proposed Fix Implemented

1. Added a dedicated `runConversationCopilot()` path.
2. Added a clean `ConversationCopilotContext`.
3. Added intent detection for affordability, YouTube comparison, price, device, certificate, job outcome, trust, timing, application and opt-out cases.
4. Added `formatConversationCopilotResult()` for concise Telegram output.
5. Added deterministic quality validation that rejects forbidden lead-analysis phrases in conversation output.
6. Routed `/respond`, respond sessions, associate `/reply`, Growth Copilot API conversation mode and associate workspace conversation mode through the new path.
7. Left `runGrowthCopilot()` contactability checks active for lead analysis, outreach, follow-up and opportunity modes.

## Rollback Notes

Rollback is code-only:

1. Revert the conversation-copilot commit.
2. Redeploy the previous Render version.
3. No Airtable schema rollback is required.

Lead analysis, business discovery, referrals, HR onboarding and payment flows were not intentionally modified.
