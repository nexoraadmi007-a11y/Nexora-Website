# Growth System Integration Plan

Date: 2026-07-22

## Decision

Extend the existing Next.js backend and Airtable CRM directly. Add safe operational tables, shared calculation services, and admin reporting APIs before adding heavier Telegram and associate-only experiences.

## Existing components to retain

- Next.js public website and app routes.
- Airtable helper in `src/lib/airtable.ts`.
- Growth Associate recruitment form and admin review workflow.
- Official associate creation in `src/app/api/growth-associate/admin/route.ts`.
- Referral code and referral link generation in `createOfficialAssociate`.
- Career Accelerator and Business Transformation Paystack initialization.
- Paystack webhook signature verification.
- Resend email integration.
- Telegram webhook and daily lead digest endpoint.
- Airtable `Ambassadors`, `Ambassador Registrations`, `Master Contacts`, `Programmes`, `Website Payment Events`, `Ambassador Referrals`, `Enrollments`, and `Payments`.

## Existing components to modify

- Official associate creation should initialize target and referral settings.
- Paystack initialization should include richer attribution metadata.
- Paystack webhook should write conversion attribution, referral events, monthly performance, and activity logs.
- Admin dashboard should gain growth reporting tabs while preserving recruitment.
- Telegram webhook should become role-aware for admin and associate commands.
- Daily lead digest should evolve from admin-only digest to assignment records.

## New components to create

- `scripts/sync-growth-operations-airtable.mjs`
- `src/lib/growth-operations.ts`
- `src/app/api/growth/performance/route.ts`
- Later:
  - `src/app/api/growth/leads/route.ts`
  - `src/app/api/growth/activity/route.ts`
  - `src/app/api/growth/referrals/route.ts`
  - `src/app/api/growth/bonus/route.ts`
  - Associate dashboard page
  - Role-aware Telegram command router

## Airtable schema additions

The MVP should add these tables through a repeatable script:

- `Growth Leads`
- `Lead Activities`
- `Referral Events`
- `Conversion Attribution`
- `Monthly Performance`
- `Bonus Configurations`
- `Bonus Awards`
- `Growth Audit Logs`

Existing `Ambassadors` should be extended with:

- `Telegram User ID`
- `Referral Link`
- `Active`
- `Team ID`
- `Daily Lead Quota`
- `Monthly Intake Target`
- `Onboarding Status`
- `Referral Status`
- `Created At`
- `Updated At`

No existing production field should be removed or renamed.

## APIs required

Phase 1:

- `GET /api/growth/performance`: admin summary, associate stats, leaderboard, bonus preview, settings.

Phase 2:

- `POST /api/growth/activity`: record associate/admin/system activity.
- `POST /api/growth/referral-event`: track referral click and funnel event.
- `POST /api/growth/assign-leads`: assign leads to an associate.
- `POST /api/growth/recalculate`: recalculate monthly performance.
- `POST /api/growth/bonus/preview`: preview bonus awards.
- `PATCH /api/growth/bonus/awards`: approve/pay/reject bonus awards.

## Dashboard pages required

Extend `/growth-associate/admin` first with:

- Growth Overview
- Associates
- Lead Operations
- Associate Activity
- Referrals
- Payments
- Revenue Attribution
- Monthly Targets
- Leaderboard
- Bonuses
- Settings

Later create associate-only dashboard once authentication is introduced. Until then, associate views should be Telegram-based or token-gated.

## Telegram flows required

Phase 1:

- Admin: daily summary, leaderboard, target progress.
- Test Associate: view assigned leads, quick activity buttons.

Implemented command surface:

- Admin `/today`: sends current monthly growth summary.
- Admin `/assign ASSOCIATE_RECORD_ID 5`: assigns available Growth Leads to an associate.
- Associate `/leads`: sends assigned lead cards.
- Associate `/contacted LEAD_ID`: records contacted activity.
- Associate `/interested LEAD_ID`: records interested activity.
- Associate `/pending LEAD_ID`: records payment-pending activity.
- Associate `/converted LEAD_ID`: records converted activity.
- Associate `/invalid LEAD_ID`: records invalid lead activity.
- Associate `/reply LEAD_ID pasted conversation`: produces a WhatsApp-style reply suggestion and logs sales-assistant usage.

Phase 2:

- Conversation paste -> sales assistant reply suggestion.
- Follow-up scheduling.
- Lead status transitions.

Telegram access must be based on registered Telegram user IDs and role checks, not separate bot installations.

## Paystack changes required

Keep existing Paystack routes. Add:

- `associate_id`
- `referral_code`
- `lead_id`
- `application_id`
- `programme_id`
- `campaign_id`
- `selected_programme_code`

Webhook should:

1. Verify signature.
2. Verify reference with Paystack.
3. Reuse existing payment record if present.
4. Create/update enrollment and payment.
5. Resolve attribution.
6. Write referral event.
7. Write conversion attribution.
8. Update monthly performance.
9. Update bonus preview.

Refund handling should be added before paid bonus operations are relied on.

## Referral changes required

Referral code must be preserved through:

```text
URL -> local/session storage -> hidden form field -> application -> Paystack metadata -> webhook -> enrollment/payment -> attribution
```

Current system already passes referral code from the Career Accelerator form to Paystack. Missing pieces are referral click events, attribution conflicts, attribution window, and attribution lock.

## Airtable synchronisation decision

Airtable remains the MVP source of truth. High-volume events should be stored in Airtable only while associate count and lead volume are low. The calculation service should isolate Airtable reads/writes so a later PostgreSQL/Supabase migration can move `Lead Activities`, `Referral Events`, `Conversion Attribution`, and `Monthly Performance` with minimal frontend changes.

## Calculation services

Create deterministic backend functions for:

- `calculateDailyAssociatePerformance`
- `calculateMonthlyAssociatePerformance`
- `calculateTargetProgress`
- `calculateLeaderboard`
- `calculateBonusEligibility`
- `calculateBonusAwards`
- `resolveAttributionConflict`

Default reporting timezone: `Africa/Lagos`.

Default monthly target: 30 confirmed paid intakes.

Default ranking:

1. Confirmed paid intake.
2. Net attributed revenue.
3. Conversion rate.
4. Earliest date target reached.

Default bonus setup:

- `number_of_winners`: 1
- `bonus_amount`: not configured
- `minimum_target_required`: configurable, default true

## Rollback strategy

- Airtable schema additions are additive.
- Do not delete records.
- New tables can be ignored by old production workflows.
- Existing recruitment and payment routes remain functional if new reporting writes fail; failures should be logged and not block checkout confirmation unless core payment/enrollment fails.
- Keep all new calculations server-side and deterministic.
- Use TypeScript/build checks before deployment.

## Risks

- Airtable may become slow for high-volume lead activities.
- Shared-secret admin access is not enough for associate dashboards.
- Telegram buttons require careful state handling to avoid accidental updates.
- Attribution conflict resolution needs admin review workflow.
- Refund handling must be completed before bonus payouts are operationally trusted.

## Implementation order

1. Add audit and integration plan.
2. Add Airtable schema sync for growth operations.
3. Add shared performance/target/bonus calculation service.
4. Extend official associate activation with default target fields.
5. Add admin performance API.
6. Add admin dashboard reporting sections.
7. Add Paystack attribution writes and performance recalculation.
8. Add Telegram command/actions for one admin and one test associate.
9. Add sales assistant endpoint.
10. Add tests and hardening.
