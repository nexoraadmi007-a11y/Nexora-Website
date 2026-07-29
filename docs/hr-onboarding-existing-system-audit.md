# HR Onboarding Existing System Audit

## Current Architecture

- Framework: Next.js 15 App Router with TypeScript.
- Database: Airtable, through `src/lib/airtable.ts`.
- Deployment: GitHub repository deployed to Render.
- Admin access: shared admin secret via `GROWTH_ADMIN_SECRET`, with fallbacks to Telegram/Cron secrets in some routes.
- Associate access: referral-code based associate portal at `/growth-associate/portal`.
- Notifications: Resend email through `src/lib/email.ts` and Telegram through `src/lib/telegram.ts`.
- Existing recruitment admin API: `src/app/api/growth-associate/admin/route.ts`.
- Existing associate portal API: `src/app/api/growth/associate-portal/route.ts` and `src/app/api/growth/associate-workspace/route.ts`.

## Existing Associate Tables And Fields

The existing associate source of truth is the Airtable `Ambassadors` table.

Approved applicants are created from `Ambassador Registrations` into `Ambassadors` in `createOfficialAssociate()` inside `src/app/api/growth-associate/admin/route.ts`.

Existing associate fields include:

- `Ambassador Name`
- `Ambassador ID`
- `Email`
- `Phone Number`
- `Telegram Username`
- `Referral Code`
- `Referral Link`
- `Ambassador Referral Link`
- `Ambassador Status`
- `Onboarding Status`
- `Referral Status`
- `Monthly Intake Target`
- `Daily Lead Quota`
- Commission fields

There is no separate HR profile, payroll, document, or employment-agreement table currently implemented.

## Existing Associate Identity Rules

- Applicant identity comes from `Ambassador Registrations`.
- Official associate identity is stored in `Ambassadors`.
- Referral code and referral link are generated when the applicant passes interview.
- The current associate portal authenticates by referral code, not by a signed-in user session.
- Telegram identity is optional and stored as `Telegram User ID` or `Telegram Username` where available.

## Existing Portal Capabilities

The associate portal currently supports:

- Referral dashboard.
- Referral metrics.
- Commission summary.
- Assigned lead workspace.
- Lead status updates.
- Growth Copilot / sales guidance through existing workspace APIs.

It does not currently support:

- HR onboarding forms.
- Secure token links.
- File uploads.
- Private document downloads.
- Employment-letter generation.
- Signed document review.

## Existing Upload Flow

No general file-upload service was found in the repository.

Because the proposed HR form collects passport photographs, government ID documents, signed letters and payroll information, the system needs a private storage approach before production use. Airtable attachment fields may be used only if access is restricted to HR/admin views.

## Existing Document Generation Capability

No existing PDF generation library or document-template system was found in `package.json`.

No existing employment letter, offer letter, appointment letter, signature, or letterhead template was found.

## Existing Branding And Company Details

Found:

- Logo: `public/nexora-logo.png`
- Mark: `public/nexora-mark.png`
- Company-facing name: `NEXORA Institute`
- Official email in contact page: `admin@nexoragroup.ink`
- Phone/WhatsApp in contact page: `0701002613 | 08103200200`
- Office address in contact page: `Thebunker Office Building, Beside Access Bank, Oke Ilewo, Along Jide Jones, Abeokuta, Ogun State.`
- Website: `https://www.nexoragroup.ink`

Missing or unconfirmed:

- Authorised signatory signature image.
- Authorised signatory official title.
- Full legal/trading company name for employment documents.
- Registration number, if it should appear.
- Salary basis: gross or net.
- Employment type.
- Working arrangement, working days and hours.
- Salary payment date.
- Probation, notice and leave terms.
- Statutory deduction treatment.
- Employment start-date rule.
- Witness requirement.

## Data Security Risks

- Referral-code access is not sufficient for sensitive HR and payroll data.
- Bank account details and government ID documents require stricter access control than the current associate portal.
- Signature image must not be placed in public assets.
- Airtable views containing payroll and identity documents must be restricted.
- Full bank details must not be included in Telegram/email notifications or logs.
- Onboarding tokens must be hashed and must not expose Airtable record IDs.

## Integration Approach

Use additive Airtable tables linked to the existing `Ambassadors` table:

- `Associate HR Profiles`
- `Payroll Details`
- `Associate Documents`
- `Employment Agreements`

Add status fields to `Ambassadors` only where needed:

- `HR Onboarding Status`
- `Employment Letter Status`
- `HR Onboarding Token Hash`
- `HR Onboarding Token Expires At`

## Components To Reuse

- `Ambassadors` as the associate source of truth.
- Existing recruitment approval flow.
- Existing admin secret model for initial admin endpoints.
- Existing email and Telegram notification services.
- Existing `Growth Audit Logs` pattern for audit events.
- Existing logo assets.

## Components To Extend

- Admin dashboard: add HR onboarding controls.
- Associate portal: add employment onboarding workflow.
- Airtable sync script: add HR tables and fields additively.
- API routes: add token generation, HR profile submission, letter preview/download and signed-copy review.

## Components Not To Modify

- Referral code generation and existing referral links.
- Existing recruitment records.
- Existing payment attribution.
- Existing lead allocation.
- Existing Telegram bot workflows, except for optional HR notifications later.

## Mandatory Blocker Before Final Letter Generation

Final production employment-letter generation is blocked until the missing signatory, company and employment-policy details are confirmed and the signature image is provided as a restricted server-side asset.
