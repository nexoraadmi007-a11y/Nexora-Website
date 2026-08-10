# Nexora Institute V2 Foundation Audit

Date: 2026-08-10

## Tech Stack

| Area | Status | Notes |
| --- | --- | --- |
| Framework | READY | Next.js 15 app router with TypeScript. |
| Styling | REQUIRES_EXTENSION | Tailwind is installed. Legacy CSS was reset; V2 design tokens and primitives are being rebuilt. |
| Deployment | READY | Render web service and cron service are configured in `render.yaml`. |
| Package management | READY | npm lockfile exists; no major dependency upgrade planned during Release 1. |

## Existing Data and Infrastructure

| Area | Status | Notes |
| --- | --- | --- |
| Database | REQUIRES_MIGRATION | No local app DB schema exists. Airtable is the current operational store. V2 should define a canonical app database before complex learning/commission logic becomes production-critical. |
| Airtable | READY | `src/lib/airtable.ts` provides reusable list/create/update helpers. Base ID is configured as `appNkFVWpoI8ihHmA`; token is stored outside source. |
| Existing users/contacts | READY | Airtable `Master Contacts` count validated at 12 before and after reset. |
| Partner/Growth Associate records | READY | Airtable `Ambassadors` count validated at 8. Existing referral IDs must remain stable. |
| Referral history | READY | Airtable `Referral Events` count 34 and `Ambassador Referrals` count 3. |
| Payments | READY | Paystack routes and `Website Payment Events` count 4 preserved. Payment verification remains server-side. |
| Programmes | REQUIRES_EXTENSION | Airtable `Programmes` count 11. V2 introduces a code-level canonical snapshot for Release 1, then should migrate to a durable admin-managed programme table. |
| Authentication | REQUIRES_MIGRATION | No durable local auth implementation found after reset. V2 needs proper signup/login/session/password reset/email verification before production user accounts are enabled. |
| Telegram | READY | Transport module and Telegram API routes preserved. Existing IDs remain in environment/Airtable. |
| Email | READY | Resend email module preserved. Official sender config remains environment-driven. |
| OpenAI / AI | REQUIRES_EXTENSION | Old product prompt logic exists and should not be reused directly until V2 service boundaries and canonical programme data are enforced. |
| Storage | READY | Public logo assets and HR signature asset are preserved. No storage delete operation was performed. |

## Reusable Services

| Service | Status | Notes |
| --- | --- | --- |
| Airtable adapter | READY | Reusable transport; schema-specific code requires V2 mapping. |
| Paystack initialization/verification | REQUIRES_EXTENSION | Preserved, but currently coupled to old `NGTP`/`BATP` naming and Airtable write flow. |
| Telegram transport | READY | Reusable send transport. |
| Resend email transport | READY | Reusable email delivery. |
| Growth/lead/HR services | REQUIRES_MIGRATION | Preserve for historical reference; do not expose old dashboards as V2 UX. |

## Immediate V2 Foundation Decision

Release 1 should create:

- A new design system.
- Canonical programme configuration.
- Public pages for discovery.
- Authentication UI shells.
- Payment selection flow that uses canonical prices.
- Member app shell with purposeful empty states.
- Admin operating-system shell.
- Integration health endpoint.

Release 1 should not pretend that durable auth, progress tracking, commissions or payout approvals are complete until the database architecture is approved.
