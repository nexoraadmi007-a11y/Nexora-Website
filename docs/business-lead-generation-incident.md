# Nexora Business Lead Generation Incident

## Scope

This diagnostic covers the existing production lead-generation path only. Referral logic, HR onboarding, Paystack, enrolment, associate dashboards, payroll, and Growth Copilot conversation routing were not rebuilt.

## Pipeline Trace

| Stage | Previous status | Finding | Repair |
| --- | --- | --- | --- |
| Scheduled trigger | Partially configured | Render cron calls `/api/growth/daily-automation`, but the job payload was still configured around individual lead sectors. | Feature flags and scheduler inputs now place discovery in business-only test mode. |
| Lead-source collector | Misaligned | The existing Apify business importer defaults to a Google Places style actor/input and does not prioritise Instagram/Facebook/WhatsApp social commerce. | Added a dedicated business discovery engine using social-commerce search patterns. |
| External API / scraper | Unclear at runtime | `APIFY_API_TOKEN` is required. The old system could look configured while using an unsuitable actor for this target market. | Business discovery now uses `APIFY_BUSINESS_LEAD_ACTOR_ID` when configured and otherwise falls back to `apify/google-search-scraper`. |
| Raw records | Inconsistent | Existing parser accepted generic business records and Maps-style data. | Search results are flattened from Apify output and source-labelled. |
| Normalisation | Too generic | Old fields did not separate `discovery_source` and `contact_source`. | New normalisation stores both and extracts Instagram, Facebook, WhatsApp, website, phone and email where present. |
| Qualification | Weak | Old business import did not enforce owner-led social-commerce fit or visible contact route. | New qualification rejects large institutions, generic articles, generic restaurants, offline-only businesses and no-contact leads. |
| Deduplication | Partial | Existing dedupe checked source URL, email and business name only. | New dedupe key considers Instagram, Facebook, WhatsApp, phone, email, website domain and business name plus city. |
| Contactability validation | Too permissive | Old scoring could import a business with weak or no direct contact evidence. | Hard rule added: no valid public contact path means reject. |
| Lead scoring | Generic | Old score rewarded website/phone/email but not Nexora's current sales opportunity profile. | New 100-point score: digital activity 20, owner accessibility 20, commercial activity 20, operational gaps 25, contactability 15. |
| Database storage | Immediate | Old importer wrote leads directly to `Growth Leads` and could be used by assignment flows. | Admin test stores selected leads without assigning them or touching quotas. |
| Telegram formatting | Individual-only | Existing `/testleads` only previews Career Accelerator individual leads. | Added `/runbusinessdiscovery` and `/testbusinessleads` for admin-only business lead delivery. |
| Telegram delivery | Admin available | Admin-only checking already existed. | New commands reuse that gate and block test delivery if associate delivery is enabled. |

## Confirmed Root Cause

The system was not failing at one single API call. It was configured and shaped for the wrong operating mode:

1. Daily automation defaulted to `NYSC members, final-year students, recent graduates`.
2. `ENABLE_INDIVIDUAL_GROWTH_ENGINE` was enabled.
3. SME/business discovery was disabled in config.
4. Automatic lead allocation was enabled.
5. The available admin Telegram test command only previewed individual leads.
6. The generic business importer did not enforce Nexora's owner-led social-commerce target profile.

Because of this, Nexora could not reliably generate qualified business leads for Instagram/Facebook/WhatsApp vendors, and any generic business import risked producing weak or non-actionable records.

## Files Changed

- `src/lib/business-lead-discovery.ts`
- `src/lib/telegram-admin-test.ts`
- `src/app/api/telegram/webhook/route.ts`
- `src/app/api/growth/business-leads/route.ts`
- `src/app/api/growth/daily-automation/route.ts`
- `render.yaml`
- `scripts/business-lead-discovery-regression.mjs`

## Production Mode After Repair

```text
ENABLE_BUSINESS_LEAD_DISCOVERY=true
ENABLE_INDIVIDUAL_LEAD_DISCOVERY=false
ENABLE_ASSOCIATE_LEAD_DELIVERY=false
ENABLE_ADMIN_LEAD_TEST_DELIVERY=true
ENABLE_AUTOMATIC_LEAD_ALLOCATION=false
GROWTH_ALLOCATION_MODE=MANUAL_ADMIN
```

## Admin Test Commands

```text
/runbusinessdiscovery
/testbusinessleads 5
/testbusinessleads 10
```

These commands:

- Send test leads only to the verified admin Telegram account.
- Do not assign leads to associates.
- Do not update associate quotas.
- Do not mark leads contacted.
- Do not trigger automatic outreach.

## Health Result

`/api/growth/business-leads` now exposes an admin-authorised health response showing:

- Business discovery enabled/disabled.
- Individual discovery enabled/disabled.
- Associate lead delivery enabled/disabled.
- Admin test delivery enabled/disabled.
- Apify configuration presence.
- Telegram admin configuration presence.

## Open Production Verification

After deployment, run:

```text
/runbusinessdiscovery
```

Then:

```text
/testbusinessleads 5
```

Acceptance requires five real, contactable, qualified owner-led business opportunities delivered only to Admin Telegram.
