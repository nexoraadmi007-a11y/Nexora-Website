# NEXORA Individual Growth Engine Integration Plan

Date: 2026-07-28

## Files To Retain

- `src/lib/airtable.ts`
- `src/lib/growth-associate.ts`
- `src/lib/growth-actions.ts`
- `src/lib/growth-operations.ts`
- `src/app/api/growth-associate/admin/route.ts`
- `src/app/api/paystack/initialize/route.ts`
- `src/app/api/paystack/webhook/route.ts`
- `src/app/growth-associate/admin/AdminRecruitmentDashboard.tsx`
- `src/app/growth-associate/portal/AssociatePortalClient.tsx`
- `scripts/sync-growth-operations-airtable.mjs`

## Modules To Add

- `src/lib/growth-config.ts`: feature flags and configurable quota/threshold values.
- `src/lib/referral-repair.ts`: idempotent referral assurance, repair report, system health.
- `src/lib/individual-growth-engine.ts`: individual-only lead filtering and allocation rules.
- `src/app/api/growth/referral-repair/route.ts`: admin dry-run/apply repair endpoint.
- `src/app/api/growth/system-health/route.ts`: admin data-quality endpoint and manual referral action.

## Modules To Extend

- `src/lib/growth-actions.ts`: delegate assignment to individual-only allocation.
- `src/app/api/growth/lead-queue/route.ts`: show individual Career Accelerator queue and eligibility.
- `src/app/api/growth/leads/route.ts`: respect individual quota and batch rules.
- `src/app/api/growth/daily-automation/route.ts`: prevent business discovery in Version 1 unless explicitly enabled.
- `src/app/api/growth/apify-leads/route.ts`: block business/SME/corporate discovery when flags are disabled.
- `src/app/growth-associate/admin/AdminRecruitmentDashboard.tsx`: add System Health and referral-repair controls.
- `render.yaml`: add feature flags and quota configuration.

## Airtable Migration Strategy

Use additive Airtable fields only. Do not delete or rename production fields.

Recommended additions through `scripts/sync-growth-operations-airtable.mjs`:

- `Growth Leads`: support lead type `INDIVIDUAL`, `NYSC_MEMBER`, `FINAL_YEAR_STUDENT`, `RECENT_GRADUATE`.
- `Growth Leads`: optional fields for qualification evidence and individual scoring components.
- `Ambassadors`: optional lead access/eligibility controls.
- `Growth Audit Logs`: reuse for repair, assignment, and override logs.

## New Endpoints

- `GET /api/growth/system-health`
- `PATCH /api/growth/system-health`
- `POST /api/growth/referral-repair`

Existing endpoints preserved:

- `/api/growth-associate/admin`
- `/api/growth/leads`
- `/api/growth/lead-queue`
- `/api/growth/associate-portal`
- `/api/growth/associate-workspace`
- `/api/paystack/initialize`
- `/api/paystack/webhook`

## Feature Flags

Default Version 1 configuration:

```text
ENABLE_INDIVIDUAL_GROWTH_ENGINE=true
ENABLE_SME_GROWTH_ENGINE=false
ENABLE_CORPORATE_GROWTH_ENGINE=false
ENABLE_AUTOMATIC_LEAD_ALLOCATION=true
ENABLE_REFERRAL_REPAIR=true
DEFAULT_DAILY_INDIVIDUAL_LEAD_QUOTA=10
INDIVIDUAL_BATCH_PROCESSED_THRESHOLD=8
GROWTH_ALLOCATION_MODE=HYBRID
```

## Referral Repair Process

1. Scan approved/active associates in `Ambassadors`.
2. Preserve existing referral codes.
3. Generate a unique code only where missing.
4. Generate a referral link only where missing.
5. Log the action to `Growth Audit Logs`.
6. Support dry-run and associate-specific repair.
7. Continue if one record fails.

## Lead Allocation Rules

Version 1 allocation:

- Only assign `INDIVIDUAL`, `CAREER_ACCELERATOR`, `NYSC_MEMBER`, `FINAL_YEAR_STUDENT`, or `RECENT_GRADUATE` leads.
- Exclude business, restaurant, SME, corporate, company, and BATP leads.
- Default quota: 10 per active associate.
- Default release threshold: 8 processed out of 10.
- `VIEWED` does not count as processed.
- Opted-out and invalid leads are excluded.
- Admin can force allocation with an explicit override.

## Rollback Strategy

- Feature flags can disable individual allocation and referral repair without deleting code.
- Existing referral codes are not regenerated, so rollback does not require code reversal.
- Airtable changes are additive; unused fields can remain harmless.
- If allocation misbehaves, set `ENABLE_AUTOMATIC_LEAD_ALLOCATION=false` and use manual assignment only.

## Test Strategy

- Run `npm run typecheck`.
- Run `npm run build`.
- Run referral repair in dry-run first.
- Verify existing enrolment payment still initializes.
- Verify existing referral link still pre-fills enrolment form.
- Verify system health endpoint shows missing referral issues.
- Verify individual queue excludes business/corporate leads.
- Verify dry-run allocation does not mutate Airtable.

## Deployment Sequence

1. Deploy code with flags set to Version 1 defaults.
2. Run system health check.
3. Run referral repair dry-run.
4. Review report.
5. Apply repair to one associate if needed.
6. Apply repair to all missing approved/active associates.
7. Preview individual lead queue.
8. Run allocation dry-run.
9. Enable automatic allocation for active associates.
