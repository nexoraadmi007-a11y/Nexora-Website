# HR Onboarding Integration Plan

## Objective

Extend the existing Nexora Growth Associate system with secure HR onboarding, employment-letter generation, signed-document upload and admin verification without duplicating associate records or disrupting recruitment, referrals, payments, Telegram or lead workflows.

## Existing Files To Retain

- `src/app/api/growth-associate/admin/route.ts`
- `src/app/growth-associate/admin/AdminRecruitmentDashboard.tsx`
- `src/app/growth-associate/portal/AssociatePortalClient.tsx`
- `src/app/api/growth/associate-portal/route.ts`
- `src/lib/airtable.ts`
- `src/lib/email.ts`
- `src/lib/telegram.ts`
- `scripts/sync-growth-operations-airtable.mjs`

## Existing Modules To Extend

- Admin recruitment route: generate or resend HR onboarding links after interview pass/approval.
- Admin dashboard: add HR onboarding status and actions.
- Associate portal: add Employment Onboarding section.
- Airtable sync: add HR tables and status fields.

## New Airtable Tables

### Associate HR Profiles

Linked to `Ambassadors`.

Fields:

- Legal name
- Date of birth
- Residential address
- State of residence
- Emergency contact details
- Education details
- Passport photograph reference
- HR form status
- Submitted at
- Reviewed at
- Reviewer

### Payroll Details

Linked to `Ambassadors`.

Fields:

- Bank name
- Account name
- Account number encrypted or restricted
- Account number last four
- Verification status
- Verification date
- Updated at

General views must show only masked account numbers.

### Associate Documents

Linked to `Ambassadors` and employment agreement where needed.

Fields:

- Document type
- File reference
- Upload status
- Uploaded at
- Verification status
- Reviewed by
- Reviewed at
- Notes

### Employment Agreements

Linked to `Ambassadors`.

Fields:

- Document reference
- Template version
- Document version
- Employment title
- Role title
- Salary
- Monthly target
- Issue date
- Start date
- Employer signatory
- Signatory title
- Generated file reference
- Signed file reference
- Downloaded at
- Signed uploaded at
- Verification status
- Completion status

## New Ambassador Fields

Add additively:

- `HR Onboarding Status`
- `Employment Letter Status`
- `HR Onboarding Token Hash`
- `HR Onboarding Token Expires At`
- `HR Onboarding Link Revoked`
- `Employment Onboarding Completed At`

## API Endpoints

Recommended routes:

- `POST /api/admin/associates/[id]/hr-onboarding-link`
- `POST /api/admin/associates/[id]/hr-onboarding-link/revoke`
- `GET /api/hr-onboarding/validate-token`
- `GET /api/hr-onboarding/profile`
- `PUT /api/hr-onboarding/profile`
- `POST /api/hr-onboarding/submit`
- `GET /api/associate/employment-onboarding`
- `POST /api/admin/associates/[id]/approve-hr-profile`
- `POST /api/admin/associates/[id]/generate-employment-letter`
- `GET /api/associate/employment-letter`
- `POST /api/associate/employment-letter/signed-upload`
- `POST /api/admin/associates/[id]/signed-letter/approve`
- `POST /api/admin/associates/[id]/signed-letter/reject`
- `GET /api/admin/hr-onboarding`

Every endpoint must perform server-side permission checks.

## Document Storage Approach

Version 1 options:

1. Airtable attachments with strictly restricted HR/admin views.
2. Private object storage with signed/expiring access links.

Production recommendation: private object storage. Do not place identity documents, payroll documents, signed letters or the employer signature in `public/`.

## Letter Generation Approach

Use a server-side template system:

- Version-controlled employment letter template.
- Variables for associate and employment terms.
- Server-side PDF generation.
- Logo embedded from an internal/public logo asset.
- Signature image loaded from a restricted server-side path or private storage.
- Unique document reference and verification code.

Do not generate final production letters until all mandatory details are confirmed.

## Signature Storage Approach

- Store signature image outside `public/`.
- Restrict access to server-only document generation.
- Never expose the raw signature URL.
- Log each use of the signature.
- Do not allow arbitrary document generation with the signature.

## Security Controls

- Hash onboarding tokens before storage.
- 7-day default token expiry.
- Token revocation.
- Token does not reveal Airtable record IDs.
- Server-side validation for every form submission.
- Rate limiting for token endpoints.
- Sensitive values masked in general responses.
- Full bank details excluded from Telegram/email/logs.
- Signed-copy upload does not auto-complete onboarding.
- Admin approval required for completion.

## Migration Plan

1. Add Airtable tables and fields additively.
2. Add feature flags disabled by default:

```text
ENABLE_HR_ONBOARDING=false
ENABLE_EMPLOYMENT_LETTER_GENERATION=false
ENABLE_SIGNED_LETTER_UPLOAD=false
ENABLE_HR_AIRTABLE_SYNC=true
ENABLE_EMPLOYMENT_DOCUMENT_VERIFICATION=false
ENABLE_BANK_ACCOUNT_API_VERIFICATION=false
REQUIRE_ADMIN_APPROVAL_BEFORE_LETTER=true
REQUIRE_SIGNED_LETTER_BEFORE_EMPLOYMENT_COMPLETE=true
```

3. Deploy foundation code.
4. Enable for one approved test associate after required assets are confirmed.

## Testing Plan

Regression:

- Existing recruitment approval still creates one `Ambassadors` record.
- Existing referral codes and referral links are unchanged.
- Existing associate portal still loads by referral code.
- Existing Telegram and email notifications still work.
- Existing payment/referral attribution remains intact.

HR onboarding:

- Approved associate receives a secure token link.
- Rejected/unknown associate cannot access onboarding.
- Expired/revoked tokens fail.
- Account-number confirmation must match.
- Unsupported/oversized files fail.
- Sensitive data is not logged.
- Signed upload does not complete onboarding without admin approval.

Letter:

- Logo appears.
- Associate legal name appears.
- Salary of NGN 75,000 appears.
- Monthly target of 30 confirmed paid intakes appears.
- Responsibilities and incentive clauses appear.
- Employer signature appears only from restricted source.
- Employee acceptance section appears.
- No unresolved template variables remain.

## Deployment Sequence

1. Confirm missing assets and policy details.
2. Add HR Airtable schema.
3. Deploy with feature flags off.
4. Test token generation on one approved associate.
5. Test HR form draft and submission.
6. Test admin review.
7. Test letter preview.
8. Test PDF generation.
9. Test signed-copy upload.
10. Test admin verification and completion.
11. Enable for all approved associates.

## Rollback Procedure

- Disable HR feature flags.
- Revoke active HR onboarding tokens.
- Stop letter generation.
- Leave additive Airtable tables/fields in place.
- Do not delete existing HR submissions unless requested under a controlled data-retention process.

## Missing-Asset Gate

The document-generation phase must not proceed to production until these are confirmed:

- Nexora logo: found.
- Full company name: partially found as `NEXORA Institute`; legal/trading name still needs confirmation.
- Company address: found in contact page, needs confirmation for employment documents.
- Official email: found as `admin@nexoragroup.ink`.
- Official phone number: found as `0701002613 | 08103200200`.
- Website: `https://www.nexoragroup.ink`.
- Registration number: not found.
- Zephaniah Morakinyo official title: not confirmed.
- Zephaniah Morakinyo signature image: not found.
- Employment type: not confirmed.
- Salary basis, gross or net: not confirmed.
- Employment start-date rule: not confirmed.
- Salary payment date: not confirmed.
- Working days and hours: not confirmed.
- Remote/hybrid/field arrangement: not confirmed.
- Probation period: not confirmed.
- Notice period: not confirmed.
- Leave terms: not confirmed.
- Statutory deductions: not confirmed.
- Witness signature requirement: not confirmed.
