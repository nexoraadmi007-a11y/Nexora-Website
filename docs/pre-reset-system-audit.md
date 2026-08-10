# Nexura Institute Pre-Reset System Audit

Date: 2026-08-10
Restore point: `6016d2a24efbf8f33ec836d74526a39d999bf2a8`
Archive branch: `archive/pre-nexura-v2-reset`
Archive tag: `restore/pre-nexura-v2-reset-6016d2a`

## Summary

The repository is a Next.js 15 application with public website pages, old programme pages, Growth Associate dashboards, Paystack payment routes, Airtable CRM integration, Telegram automation, HR onboarding flows, lead-generation endpoints, and assorted product-specific libraries.

The reset scope is the application/product layer, not infrastructure or production data.

## Component Classification

| Area | Classification | Notes |
| --- | --- | --- |
| `render.yaml` | PRESERVE | Render web and cron configuration, env var names and deployment commands. |
| `.env.example` | PRESERVE | Environment variable name reference. No secrets committed. |
| `package.json`, lockfile, Next/Tailwind/TS config | PRESERVE | Needed for build/deploy foundation. Dependency pruning deferred until V2 architecture is approved. |
| `public/nexora-logo.png`, `public/nexora-mark.png` | PRESERVE | Brand assets. |
| `public/hr-assets/*` | PRESERVE | Existing HR document/signature assets. |
| `src/lib/airtable.ts` | PRESERVE | Reusable Airtable adapter. |
| `src/lib/telegram.ts` | PRESERVE | Reusable Telegram transport. |
| `src/lib/email.ts` | PRESERVE | Reusable Resend email transport. |
| Paystack route/client logic | REVIEW | Existing route is product-coupled; preserve references historically, rebuild V2 payment service later. |
| Airtable/CRM production records | PRESERVE | External data must not be deleted. |
| Telegram IDs and bot configuration | PRESERVE | Existing verified identities remain external configuration/data. |
| Public website pages | DELETE | Old and interim V2 pages removed from active app. |
| Programme pages and pricing cards | DELETE | Product content will be redesigned from architecture. |
| Growth Associate dashboards/portal UI | DELETE | Old UI removed from active app; data preserved externally. |
| Old partner/referral/wallet UI | DELETE | Reset for V2 partner experience. |
| HR onboarding UI | DELETE | Old UI removed from active app; document data/assets preserved. |
| Old navigation/footer/WhatsApp widgets | DELETE | Current design system removed. |
| Old UI components | DELETE | Removed from active app. |
| Product-specific libraries | ARCHIVE/REVIEW | Hard-coded programme, copilot, lead and commission logic should not drive V2 without redesign. |
| Scripts | REVIEW | Operational scripts preserved during reset; run only after V2 review. |
| Existing docs | PRESERVE | Historical implementation notes retained for reference. |

## Environment Variable Names

`AIRTABLE_BASE_ID`, `AIRTABLE_TOKEN`, `APIFY_API_TOKEN`, `APIFY_BUSINESS_LEAD_ACTOR_ID`, `APIFY_LEAD_ACTOR_ID`, `APIFY_LEAD_TASK_ID`, `BATP_GROUP_URL`, `CALENDLY_EVENT_TYPE_URL`, `CALENDLY_WEBHOOK_SECRET`, `CAREER_GROUP_AI_CONTENT_CREATION_URL`, `CAREER_GROUP_AI_FINANCIAL_ANALYST_URL`, `CAREER_GROUP_GENERAL_URL`, `CAREER_GROUP_UI_UX_DESIGNER_URL`, `CRON_SECRET`, `DEFAULT_DAILY_INDIVIDUAL_LEAD_QUOTA`, `ENABLE_ADMIN_LEAD_TEST_DELIVERY`, `ENABLE_ASSOCIATE_LEAD_DELIVERY`, `ENABLE_AUTOMATIC_LEAD_ALLOCATION`, `ENABLE_BUSINESS_LEAD_DISCOVERY`, `ENABLE_CORPORATE_GROWTH_ENGINE`, `ENABLE_INDIVIDUAL_GROWTH_ENGINE`, `ENABLE_INDIVIDUAL_LEAD_DISCOVERY`, `ENABLE_REFERRAL_REPAIR`, `ENABLE_SME_GROWTH_ENGINE`, `GROWTH_ADMIN_SECRET`, `GROWTH_ALLOCATION_MODE`, `GROWTH_ASSOCIATE_GROUP_INVITE_URL`, `GROWTH_AUTOMATION_ASSIGN_COUNT`, `GROWTH_AUTOMATION_IMPORT_LIMIT`, `GROWTH_AUTOMATION_LOCATIONS`, `GROWTH_AUTOMATION_SECTORS`, `GROWTH_AUTOMATION_URL`, `INDIVIDUAL_BATCH_PROCESSED_THRESHOLD`, `NEXORA_EMAIL_FROM`, `NEXORA_GENERAL_COMMUNITY_URL`, `NEXT_PUBLIC_OSEC_REVIEW_WEBHOOK_URL`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_SITE_URL`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_QUEUE_SECRET`, `TELEGRAM_WEBHOOK_SECRET`.

## Reset Decision

Proceed with active app reset:

- Keep deployment and configuration.
- Keep public assets.
- Keep external production data untouched.
- Remove old active frontend routes.
- Remove old active components/design system.
- Replace with minimal temporary foundation.
