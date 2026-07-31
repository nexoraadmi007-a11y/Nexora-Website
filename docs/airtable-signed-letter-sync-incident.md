# Airtable Signed Letter Sync Incident

## Issue

The signed employment-letter upload reached the backend and passed file validation, but the associate saw:

```text
AIRTABLE_SYNC_FAILED
```

The reported file was a valid PDF of approximately 270.5 KB.

## Confirmed Root Cause

The existing upload flow stored the signed PDF as base64 inside one Airtable `Associate Documents` long-text field:

```text
Private File Data
```

A 270.5 KB PDF expands to a much larger base64 string. That makes a single Airtable text cell too fragile for this workflow and can cause the Airtable record create/update stage to fail even though the file itself is valid.

This was not a PDF validation problem and not a frontend JSON parsing problem. It was an Airtable storage/sync shape problem.

## Files Changed

- `src/lib/hr-onboarding.ts`
- `src/app/api/admin/associates/[id]/signed-letter/download/route.ts`
- `src/app/api/hr-onboarding/signed-letter/route.ts`

## Fix Implemented

- Large signed-letter files are now split into safe base64 chunks.
- The main `Associate Documents` record remains the canonical signed-letter document.
- Additional chunk records are stored as `Document Type = Other` and linked to the same associate and employment agreement.
- The main document stores a marker:

```text
CHUNKED:<chunk_count>:<checksum>
```

- Chunk records store:

```text
SIGNED_LETTER_CHUNK:<main_document_id>:<chunk_index>:<chunk_count>:<checksum>
```

- Admin download now reconstructs the original file from chunks automatically.
- Duplicate upload detection now reconstructs the existing stored file before comparing it.
- Secondary status updates to the employment agreement and ambassador record no longer invalidate a successfully stored document.

## User-Facing Behaviour

Associates should no longer see `AIRTABLE_SYNC_FAILED` for a valid file that has been received. The successful response remains:

```text
Signed employment letter submitted successfully. Status: Awaiting HR verification.
```

## Notes

This remains Airtable-backed private storage. It avoids Render ephemeral disk. A future upgrade should move the binary file itself to dedicated private object storage, with Airtable holding metadata and review status only.
