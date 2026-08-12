# Final Production Audit

Generated: 2026-08-12

## Current Database

The current Nexora V2 application now includes a Supabase/Postgres migration and auth client wiring. Until the Supabase project credentials are configured and the migration is applied, Airtable remains the active operational store through `src/lib/airtable.ts`.

Current Airtable base default in code and configuration:

```text
AIRTABLE_BASE_ID=appNkFVWpoI8ihHmA
```

Canonical production entities currently persisted through Airtable include leads, applications, payments, enrollments, ambassadors/partners, referral events, attribution, and programme records used by older operational flows.

Risk: profile/support/partner bank settings still have preview/local browser flows in parts of the V2 UI. Supabase credentials and migrations must be applied before these become fully durable production data.

## Current Deployment Provider

`render.yaml` configures Render services:

- Web service: `nexora-website`
- Cron service: `nexora-growth-daily-automation`

## Current Production Domain

Canonical public URL from `.env.example` and `render.yaml`:

```text
https://www.nexoragroup.ink
```

## Environment Variables

Environment variable names are documented separately in `docs/production-environment-checklist.md`. Secret values are not committed.

## Existing Integrations

- Airtable: operational CRM and reporting store.
- Paystack: checkout initialization and signed webhook fulfillment.
- Telegram: admin notifications, Growth Copilot, lead test delivery and operational alerts.
- Resend: email delivery where configured.
- Apify: business lead discovery where configured.
- Calendly: Growth Associate interview scheduling.
- WhatsApp group links: post-payment and programme group routes.

## Existing Referral Implementation

Existing referral infrastructure before this pass:

- `src/lib/referral-repair.ts` repaired missing Airtable referral code/link for approved/active Ambassadors.
- `/api/growth/referral-event` recorded referral events.
- `/api/paystack/initialize` accepted referral codes and sent referral metadata to Paystack.
- `src/lib/paystack-fulfillment.ts` finalized successful payments, wrote referral events, attribution and commission balances.

Defect found:

- V2 partner pages were local/demo pages.
- `/app/partner` displayed `YOUR-CODE` instead of a real Partner ID, Referral Code and Referral URL.
- `/app/partner/activate` used `localStorage` as if it were canonical activation state.
- Referral click capture existed as an API but was not wired into the V2 public website shell.

Fix applied:

- Added `src/lib/partner-system.ts`.
- Added `/api/partner/activate` and `/api/partner/dashboard`.
- Reworked `/app/partner`, `/app/partner/activate`, and `/app/partner/referrals` to use the server-backed partner identity.
- Added referral cookie capture and click tracking through `src/components/referral-tracker.tsx` and `src/middleware.ts`.

## Current Programme Pricing Source

Canonical V2 prices now live in `src/config/programmes.ts`:

- AI Income Accelerator: `10000`
- AI Business Transformation Programme: `25000`

Checkout and Paystack initialization retrieve prices through `calculateCheckoutPrice()` and `programmeListPrice()` in `src/lib/product-rules.ts`, which read from the canonical programme record.

## Current Authentication Source

Current V2 authentication is Supabase-ready:

- `/signup` stores lead/account intent and creates a Supabase Auth account when Supabase env vars are configured.
- `/login` signs in through Supabase Auth when configured.
- Password reset uses Supabase Auth when configured.
- Preview fallback remains only when Supabase env vars are missing.

Production requirement still open:

- Configure Supabase project URL, anon key and service role key in Render.
- Apply `supabase/migrations/202608120001_nexora_core.sql`.
- Move remaining profile/support/settings writes from localStorage to Supabase tables.

## Missing Production Configuration

The repository requires these production confirmations before full deployment acceptance:

- Durable auth/database provider.
- Database backup and migration process.
- Production object storage provider for private uploads.
- Paystack webhook URL configured in Paystack dashboard.
- DNS canonicalization between apex and `www`.
- Production smoke test against `https://www.nexoragroup.ink`.

## Canonical Data Decision

For the current MVP, Airtable remains the operational source of truth because the existing production workflows already depend on it.

Recommended final architecture:

```text
Production DB = canonical transactional source
Airtable = operations/reporting sync
```

This migration should be done as a separate infrastructure phase so existing Airtable records are preserved and not duplicated.
