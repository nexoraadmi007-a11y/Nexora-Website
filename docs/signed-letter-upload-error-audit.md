# Signed Letter Upload Error Audit

## Issue

Associates could download the employment letter, select a valid signed PDF, then see:

```text
Unexpected end of JSON input
```

The selected file in the reported case was a valid PDF smaller than 1 MB.

## Confirmed Root Cause

The frontend upload handler called `response.json()` directly after the upload request. If the backend returned an empty body, a platform-generated non-JSON response, or an unhandled error response, the browser surfaced the raw parser failure to the associate.

The signed-letter upload endpoint also had no route-level `try/catch`, so exceptions from multipart parsing, Airtable record creation, linked-record lookup, or document storage could escape the route without the standardized JSON body the frontend expected.

## Request Shape

The corrected upload request uses:

- Method: `POST`
- URL: `/api/hr-onboarding/signed-letter`
- Body: `FormData`
- File field: `signed_letter`
- Compatibility fallback accepted by backend: `file`
- Credentials: `include`
- No manual `Content-Type` header, so the browser supplies the multipart boundary.

## Backend Response Contract

The endpoint now always returns `application/json` through `NextResponse.json()`.

Success:

```json
{
  "success": true,
  "message": "Signed employment letter submitted successfully. Status: Awaiting HR verification.",
  "document": {
    "status": "SIGNED_COPY_UNDER_REVIEW",
    "file_name": "Employment Letter.pdf",
    "uploaded_at": "2026-07-31T09:31:00Z"
  },
  "request_id": "req_00000000"
}
```

Failure responses include:

- `UNAUTHORISED`
- `MALFORMED_MULTIPART`
- `MISSING_FILE`
- `INVALID_FILE_TYPE`
- `FILE_TOO_LARGE`
- `EMPLOYMENT_LETTER_NOT_READY`
- `AIRTABLE_SYNC_FAILED`
- `INTERNAL_SERVER_ERROR`

Each response includes `request_id` and the `x-nexora-request-id` header.

## Storage And Idempotency

Signed copies are still stored in the existing durable Airtable-backed `Associate Documents` record as private base64 document data, not on Render disk.

Duplicate taps are handled by comparing the latest signed document against the new upload's base64 data, safe filename and file size. If the same file already exists, the system returns the existing document instead of creating another record.

## User Experience Fix

The frontend now safely checks the response content type before parsing. Empty or HTML responses no longer surface raw errors such as `Unexpected end of JSON input`, `SyntaxError`, or `TypeError`.

Friendly messages are shown for session expiry, invalid file, large file, storage/Airtable failure and temporary server issues.

## Verification Notes

This audit was performed from the repository implementation and production failure symptoms. Direct Android Chrome network capture was not available inside Codex, but the confirmed code path matched the reported error exactly: unconditional JSON parsing plus missing backend route-level JSON error handling.
