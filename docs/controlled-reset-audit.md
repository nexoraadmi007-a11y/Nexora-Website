# Nexora controlled reset audit

Date: 2026-09-17. Scope: `NEXORA-WEBSITE-business-leads` repository and connected services visible to this workspace.

## Inventory and classification

| Area | Current implementation | Decision |
| --- | --- | --- |
| Public pages | Home, programmes, checkout, business, partners, opportunities, about, help, signup/login, payment success | DELETE legacy product pages after data backup; replace home with Institute landing page |
| Student and partner dashboards | `src/app/app/**`, `src/app/growth/**`, `src/app/growth-associate/**` | DELETE after backup and migration review |
| Admin interfaces | `src/app/admin/**`, including email associates and HR | DISABLE BUT PRESERVE until data export and operational handover |
| Legacy APIs | `src/app/api/admin/**`, growth, partner, Paystack, Telegram, HR, signup, checkout and old lead capture | DISABLE BUT PRESERVE until exports and webhook shutdown are verified |
| Old services | `src/lib/airtable.ts`, lead discovery, copilot, referral, payroll, course and admin modules | DELETE after backups and dependency audit |
| Shared infrastructure | Supabase clients, email sender, Telegram sender, middleware security, deployment config, logging | PRESERVE |
| Database | 20 migration files define profiles, programmes, payment/referral, learning, HR and admin tables | REQUIRES BACKUP BEFORE REMOVAL; do not drop tables in this reset |
| Airtable | API client and many active legacy routes | REQUIRES BACKUP BEFORE REMOVAL; new landing flow must not call Airtable |
| Assets | Nexora logo/mark and signature image | PRESERVE; signature is private HR material, not public site media |
| Infrastructure | Vercel project, domain, environment variables, Render manifest, Git repo | PRESERVE until a separate hosting decision is made |

## Production data and access

Supabase connector lists `zdtldlpejsyckrnsonsh` as `ACTIVE_HEALTHY` and an older project as inactive. A table-list request to the active project timed out. The deployed Vercel environment was previously observed pointing at `fapcwlyxvmyysmnqzzpf`, which did not resolve. Production table contents, storage buckets, auth users, and Airtable records are therefore **not verified or backed up**. The production service key for the active project has not been provided. No production data deletion is authorized by this audit.

Before deleting legacy routes or data, export the relevant Supabase tables, auth users where permitted, storage metadata/objects, and Airtable bases; verify record counts and retain encrypted copies outside the repository. Record webhook and scheduled-job destinations before disabling them. No credentials or record contents belong in this file.

## Conflicts requiring product decision

The refactor brief says Business Transformation is NGN 5,000 per track. The later approved production instruction said NGN 25,000. The current course catalog contains three independent NGN 10,000 courses and no Business Transformation item. Do not publish a Business Transformation price until the owner resolves this conflict. Current track names and descriptions are limited to the verified repository catalog; curriculum, duration, certificates, and outcome statistics are unverified.

## Safe implementation order

1. Build a single new public landing page with an isolated program catalog and lead form.
2. Add a minimal Supabase lead table migration without dropping or altering legacy tables.
3. Verify the active Supabase project and deploy the matching credentials.
4. Apply the migration and test a real lead insert and confirmation.
5. Export and verify historical data, then remove old routes and jobs in a separate reviewed change.
6. Deploy and verify mobile, public redirects, forms, and analytics.

## Reset implementation status

The legacy application source was removed on 2026-09-17 after creating the Git recovery branch `pre-institute-reset-20260917`. The current build exposes only `/` and `/api/institute-interest`. The old route groups, product services, scheduled-runner script, and old UI dependencies are absent from the active build. The historical SQL migrations, existing production records, Git repository, environment-variable names, Supabase clients, Resend email sender, generic Telegram and Airtable clients, and Paystack bank wrapper remain. The old HR signature was moved from `public/` to `archive/hr-assets/` so the reset site does not serve it.

The new lead table migration is present in source but **not applied**. The Supabase connector repeatedly timed out on project `zdtldlpejsyckrnsonsh`, and the deployed application's existing Supabase configuration previously pointed at a different non-resolving project. No production data was deleted or exported, no external cron was modified through the Render control plane, and no deployment of this reset has occurred. Before production release, restore database access, apply the migration, configure matching server credentials, submit and retrieve a test lead, verify the community destination, then deploy and smoke-test the custom domain.
