# Growth Copilot Existing System Audit

## Current Stack

- Frontend/backend: Next.js 15 App Router, TypeScript, Tailwind CSS.
- Database: Airtable.
- Deployment: GitHub to Render.
- Authentication: shared admin secrets for admin APIs; referral code for associate portal; Telegram user IDs for bot roles.
- Telegram: one existing bot using `/api/telegram/webhook`; no polling service found.
- Admin Telegram identity: environment based, primarily `TELEGRAM_ADMIN_CHAT_ID`, now extended by `TELEGRAM_TEST_ALLOWED_USER_IDS`.
- AI service: no OpenAI SDK or OpenAI API wrapper exists in the repo. The current response helper is a deterministic rule-based service in `growth-actions`.

## Reusable Components

- `Growth Leads`: existing lead source table for individual and business opportunities.
- `Ambassadors`: Growth Associate records, referral codes, Telegram User ID, lead access fields.
- `Lead Activities`: production activity log for associate actions.
- `Growth Audit Logs`: safe place for test and system audit events.
- `individual-growth-engine`: individual lead creation, scoring, assignment and batch controls.
- `apify-leads`: Apify discovery connector.
- `telegram-admin-test`: admin-only test-mode wrapper added before this phase.
- Existing Telegram commands: `/help`, `/today`, `/assign`, `/leads`, `/reply`, and lead action commands.

## Components Requiring Modification

- Telegram webhook needed Growth Copilot commands while preserving existing commands.
- `Growth Leads` schema needed additive fields for prospect category, contactability, source quality, Copilot analysis and recommended outreach.
- Individual assignment needed stricter contactability and generic article rejection.
- Associate workspace needed compatibility output for Growth Copilot without breaking the existing `sales_assistant` mode.

## Current Lead Source Behaviour

- Individual leads can be imported manually or through Apify search results.
- Existing Apify search can discover profile-like records, but Google must not be treated as the final contact source unless it points to an actionable public profile.
- Existing assignment is individual-first and feature-flagged. Business vendor leads are introduced additively and are not automatically mixed into allocation until admin enables a mix.

## Current Conversation Response Behaviour

- The existing response service detects basic objection categories and returns suggested replies.
- It does not call OpenAI and does not currently use a model.
- This phase wraps and extends the presentation as `NEXORA AI Growth Copilot`, with modes for conversation, analysis, outreach, follow-up and opportunity selection.

## Existing Database Relationships

- `Growth Leads` may link to `Ambassadors` through `Assigned Associate`.
- `Lead Activities` links lead activity to `Growth Leads` and `Ambassadors`.
- `Referral Events`, `Conversion Attribution`, `Payments`, and `Enrollments` support referral and conversion tracking.
- `Programmes` stores programme records used by website and payment flows.

## Risks

- Airtable single-select choices must be synced additively before new business/vendor types are heavily used.
- Existing assigned leads may not have newer contactability fields; assignment guardrails therefore inspect current source/contact fields directly.
- No OpenAI wrapper exists; adding a real model later should be done behind the same Growth Copilot API shape.
- Associate Telegram access depends on correct `Telegram User ID` values.

## Compatibility Approach

- Add new feature flags instead of replacing current flows.
- Keep `sales_assistant` API mode working while returning Growth Copilot output.
- Do not delete, rename, or overwrite existing referral IDs, associate records, or lead ownership.
- Default business vendor creation is additive; automatic business allocation remains admin-controlled.
