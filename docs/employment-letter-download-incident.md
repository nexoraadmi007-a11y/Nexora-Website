# Employment Letter Download Incident

## Summary

The Growth Associate HR portal could show a submitted HR profile while the employment letter download still failed. The failure was caused by a split between HR submission and employment agreement generation.

## Root Cause

The associate-facing download endpoint required an `Employment Agreements` record before returning a PDF. Admin generation created this agreement record, but the associate HR submission route only marked the ambassador as submitted. When a candidate completed HR onboarding before an admin generated the letter, the portal could tell them the next step was to download the letter while the API returned `Employment letter has not been generated yet.`

The implementation also generated the PDF on request instead of saving it to local Render storage. This is acceptable because the PDF is regenerated from durable Airtable records and private server assets, but the status and agreement record must exist consistently.

## Fix Implemented

- Added a shared `ensureEmploymentAgreement()` helper in `src/lib/hr-onboarding.ts`.
- HR submission now ensures the employment agreement exists and sets `Employment Letter Status` to `LETTER_READY`.
- Admin generation now uses the same helper instead of creating a separate agreement shape.
- The associate download endpoint now repairs a missing agreement record on demand after HR submission.
- PDF responses now include:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="Nexora_Employment_Letter_<Associate_Name>.pdf"`
  - `Cache-Control: private, no-store`
  - `Content-Length`
- The mobile portal now downloads through `fetch()` and a blob URL, so failed downloads can show a clear error.
- Added `scripts/repair-employment-letter-documents.mjs` for dry-run/apply repair of submitted associates that are missing agreement records.

## Status Model

The intended document statuses are:

- `LETTER_GENERATION_PENDING`
- `LETTER_GENERATING`
- `LETTER_GENERATION_FAILED`
- `LETTER_READY`
- `Downloaded`
- `Signed Uploaded`
- `Correction Required`
- `Approved`
- `Rejected`

Legacy values such as `Generated` and `Sent` are still treated as download-ready for backward compatibility.

## Repair Procedure

Dry run:

```bash
node scripts/repair-employment-letter-documents.mjs
```

Repair all submitted associates with missing agreement records:

```bash
node scripts/repair-employment-letter-documents.mjs --apply
```

Repair one associate:

```bash
node scripts/repair-employment-letter-documents.mjs --associate-id=recXXXXXXXXXXXXXX --apply
```

## Durable Storage Note

Signed copies are stored as private base64 document data in Airtable-backed `Associate Documents`, not on Render ephemeral disk. Employment letters are generated on demand from durable Airtable HR/profile/agreement records and private server-side assets. If Nexora later adds object storage, the `Generated File Reference` field can point to the durable PDF object while keeping the same download endpoint.
