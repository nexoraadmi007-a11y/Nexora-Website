# Production Environment Checklist

Generated: 2026-08-12

Secret values must be configured only in Render/environment settings. Do not commit values.

## App Domain

- `NEXT_PUBLIC_SITE_URL`

## Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Airtable

- `AIRTABLE_BASE_ID`
- `AIRTABLE_TOKEN`

## Paystack

- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

## Telegram

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_QUEUE_SECRET`
- `TELEGRAM_ADMIN_CHAT_ID`

## Admin / Cron

- `GROWTH_ADMIN_SECRET`
- `CRON_SECRET`

## Email

- `RESEND_API_KEY`
- `NEXORA_EMAIL_FROM`

## Lead Generation

- `APIFY_API_TOKEN`
- `APIFY_LEAD_ACTOR_ID`
- `APIFY_LEAD_TASK_ID`
- `APIFY_BUSINESS_LEAD_ACTOR_ID`
- `GROWTH_AUTOMATION_SECTORS`
- `GROWTH_AUTOMATION_LOCATIONS`
- `GROWTH_AUTOMATION_IMPORT_LIMIT`
- `GROWTH_AUTOMATION_ASSIGN_COUNT`

## Feature Flags

- `ENABLE_BUSINESS_LEAD_DISCOVERY`
- `ENABLE_INDIVIDUAL_LEAD_DISCOVERY`
- `ENABLE_ASSOCIATE_LEAD_DELIVERY`
- `ENABLE_ADMIN_LEAD_TEST_DELIVERY`
- `ENABLE_INDIVIDUAL_GROWTH_ENGINE`
- `ENABLE_SME_GROWTH_ENGINE`
- `ENABLE_CORPORATE_GROWTH_ENGINE`
- `ENABLE_AUTOMATIC_LEAD_ALLOCATION`
- `ENABLE_REFERRAL_REPAIR`
- `GROWTH_ALLOCATION_MODE`

## Calendly

- `CALENDLY_EVENT_TYPE_URL`
- `CALENDLY_WEBHOOK_SECRET`

## WhatsApp Groups

- `CAREER_GROUP_AI_CONTENT_CREATION_URL`
- `CAREER_GROUP_UI_UX_DESIGNER_URL`
- `CAREER_GROUP_AI_FINANCIAL_ANALYST_URL`
- `CAREER_GROUP_GENERAL_URL`
- `BATP_GROUP_URL`
- `GROWTH_ASSOCIATE_GROUP_INVITE_URL`
- `NEXORA_GENERAL_COMMUNITY_URL`

## Optional / Future Production Infrastructure

- `DATABASE_URL`
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- `STORAGE_BUCKET`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- `SENTRY_DSN`

## Required Render Services

- Web service: `nexora-website`
- Cron service: `nexora-growth-daily-automation`

## Backup And Rollback

Before any production schema migration:

1. Export Airtable base tables used by the application.
2. Export current Render environment variable names.
3. Record current Git commit deployed to Render.
4. Confirm Paystack webhook endpoint before changing callback logic.
5. Keep rollback target as the previous deployed Git commit.
