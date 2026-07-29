# Growth Copilot Integration Plan

## Preserve

- Existing Telegram bot and webhook.
- Existing admin and associate commands.
- Existing Airtable tables and records.
- Existing referral links and attribution logic.
- Existing payment and enrolment flows.
- Existing individual lead allocation controls.

## Extend

- `src/lib/growth-config.ts`: feature flags.
- `src/lib/growth-actions.ts`: legacy response compatibility remains.
- `src/lib/individual-growth-engine.ts`: stricter assignment eligibility.
- `src/lib/apify-leads.ts`: reject generic/non-actionable individual sources.
- `src/app/api/telegram/webhook/route.ts`: Growth Copilot commands.
- `src/app/api/growth/associate-workspace/route.ts`: Growth Copilot compatibility output.

## New Modules

- `src/lib/growth-copilot.ts`: shared Copilot analysis, outreach, follow-up, opportunity and submitted-lead service.
- `src/app/api/growth/copilot/route.ts`: HTTP API for dashboard and associate portal use.
- Documentation files in `docs/`.

## Airtable Additive Schema

`Growth Leads` receives additive fields:

- `Discovery Source`
- `Final Contact Source`
- `Contactability Status`
- `Prospect Category`
- `Submitted By Associate`
- `Copilot Analysis JSON`
- `Recommended Opening Message`
- `Recommended Follow Up`
- `Recommended Entry Solution`
- `Source Quality Status`

Single-select choices are expanded for individual and social-commerce business subtypes.

## API Changes

- New `POST /api/growth/copilot`.
- Existing `POST /api/growth/associate-workspace` still accepts `sales_assistant` and also returns Copilot output.
- Existing Telegram webhook now supports `/copilothelp`, `/analyze`, `/outreach`, `/followup`, `/newindividual`, and `/newbusiness`.

## Telegram Changes

- Admin-only test commands remain active.
- Associates can use Copilot commands only when their Telegram User ID is linked.
- Associate-submitted leads remain owned by the submitting associate when available.
- Unknown users are not granted access.

## Testing Strategy

- TypeScript compile.
- Next.js production build.
- Additive Airtable schema sync.
- Production smoke tests through Telegram webhook for admin.
- Non-mutating API smoke tests where possible.

## Deployment Sequence

1. Commit additive code.
2. Push to GitHub.
3. Set feature flags on Render.
4. Deploy to Render.
5. Run Airtable sync.
6. Test `/copilothelp`, `/analyze`, `/outreach`, `/followup`, `/newbusiness`, and `/newindividual`.

## Rollback

- Disable `ENABLE_GROWTH_COPILOT`.
- Disable `ENABLE_ASSOCIATE_SUBMITTED_LEADS`.
- Revert the deployed Git commit if needed.
- Airtable fields are additive and can remain safely unused.
