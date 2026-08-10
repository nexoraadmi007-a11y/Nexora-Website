# Pre-Reset Backup and Rollback

Date: 2026-08-10

## Restore Markers

- Current commit before reset: `6016d2a24efbf8f33ec836d74526a39d999bf2a8`
- Archive branch: `archive/pre-nexura-v2-reset`
- Archive tag: `restore/pre-nexura-v2-reset-6016d2a`

## Repository Restore

To restore the old product implementation locally:

```bash
git checkout archive/pre-nexura-v2-reset
npm ci
npm run build
```

To create a rollback branch:

```bash
git checkout -b rollback/pre-nexura-v2-reset archive/pre-nexura-v2-reset
```

To restore production via GitHub/Render, push the rollback branch or reset `main` to the archive commit through the approved release process.

## Environment Backup

Environment variable names were exported into `docs/pre-reset-system-audit.md`.

No secret values were written to disk or committed.

## Data Backup Status

No destructive database, Airtable, payment, storage or HR data operations are part of this reset.

Read-only Airtable validation was performed where the current token allowed access. The reset does not delete external records.

Before deploying this reset to production, the operator should still export Airtable base snapshots from Airtable UI and confirm Render environment variables are available in the service dashboard.

## Airtable Configuration

Base ID referenced by repo configuration:

```text
appNkFVWpoI8ihHmA
```

Table names used by the historical implementation are documented in `docs/database-reset-classification.md` and `docs/pre-post-reset-data-validation.md`.

## Production Rollback Procedure

1. Restore source code to `archive/pre-nexura-v2-reset`.
2. Confirm Render environment variables are unchanged.
3. Trigger a Render deploy from the rollback commit.
4. Smoke test `/`, old operational routes, Airtable form submission, Paystack initialize, Telegram health, and HR document download.
5. If Airtable exports were changed externally, restore them from Airtable revision history or the exported backup.

## Important Constraint

This reset removes the active product layer only. It does not touch external production data, Paystack records, Airtable records, Telegram identities, uploaded documents, or Render secret values.
