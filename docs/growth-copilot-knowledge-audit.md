# Growth Copilot Knowledge Audit

Date: 2026-07-30

## Purpose

This audit reconciles the sources currently used by the Nexora Growth Copilot, website, application forms, Paystack initialization and Telegram sales assistant before rebuilding the Copilot around approved commercial knowledge.

## Sources Inspected

### Public Website

- Homepage: `https://www.nexoragroup.ink`
- Programmes page: `https://www.nexoragroup.ink/programs`
- Career Accelerator page: `https://www.nexoragroup.ink/career-accelerator`
- Business Transformation page: `https://www.nexoragroup.ink/business-transformation`

Observed live website content during audit:

- Homepage showed AI Career Accelerator at `NGN 10,000 each`.
- Homepage showed AI Business Transformation Program at `NGN 35,000`.
- Homepage described the Career Accelerator as `3 career programmes`.
- Homepage described Business Transformation as a practical 30-day/four-week programme with branding, website, customer database, marketing engine, sales process, automation, dashboards and a 90-day growth plan.

### Local Programme Configuration

- `src/lib/career-accelerator-v2.ts`
- `src/lib/course-tracks.ts`
- `src/lib/site-data.ts`
- `src/lib/business-transformation-program.ts`

Observed local approved values after the latest pricing correction:

- Career Accelerator base price: `NGN 25,000` per programme.
- Career tracks:
  - AI Content Creation
  - Certified UI/UX Designer (AI-Powered)
  - AI Financial Analyst
- Business Transformation price: `NGN 35,000`.
- Business Transformation duration: `4 weeks`.
- Business Transformation deliverables include brand identity, website, lead capture, CRM, customer database, marketing calendar, SOP manual, finance tracker, KPI dashboard, workflow automation and 90-day growth plan.

### Airtable Programme Records

- `src/lib/site-data.ts` reads Airtable `Programmes` where `{Display on Website}=TRUE()` and `{Website Status}='Active'`.
- Airtable can override website programme name, duration, price, description, curriculum, CTA and payment link.
- If Airtable is unavailable, `fallbackPrograms` is used.

Risk: Copilot previously did not retrieve a structured approved programme snapshot before answering. This allowed hard-coded or stale text to leak into Telegram responses.

### Application Forms

- `src/components/sections/CareerTrackSelector.tsx` initializes Career Accelerator payment with selected track metadata.
- `src/components/sections/WebsiteForms.tsx` supports `AI Career Accelerator`, `AI Business Transformation Program`, `Complete AI Accelerator`, `Corporate AI Training` and general enquiries.
- `src/app/api/website/forms/route.ts` creates website form records and maps BATP/accelerator form intent.

### Payment Integration

- `src/app/api/paystack/initialize/route.ts`
- Career Accelerator amount is calculated from selected track pricing.
- BATP falls back to `35000`.
- Generic non-BATP fallback uses `25000`.

### Existing Copilot and Telegram Prompts

- `src/lib/growth-copilot.ts`
- `src/app/api/growth/copilot/route.ts`
- `src/app/api/telegram/webhook/route.ts`
- `src/lib/telegram-admin-test.ts`
- `src/app/api/growth/associate-workspace/route.ts`

Previous issues:

- Conversation mode used a career-only trusted snapshot.
- Business Transformation was not first-class in conversation replies.
- The Copilot defaulted unclear conversations to Career Accelerator.
- Session memory was incomplete, so a standalone answer like `AI Content Creation` could be treated as a fresh message instead of a selected track.
- Lead-analysis language and contactability checks were already removed from conversation mode in the previous fix, but the commercial knowledge structure was still insufficient.

## Current Conflicts

### Conflict 1

- Field: `CAREER_ACCELERATOR.current_price`
- Website value: `NGN 10,000`
- Database/local approved value: `NGN 25,000`
- Existing hard-coded value before correction: `NGN 10,000`
- Recommended resolution: Keep the approved snapshot value until admin confirms whether public website cache/content must be updated or local approved pricing must be changed.
- Admin approval status: `PENDING_ADMIN_APPROVAL`

### Conflict 2

- Field: `CAREER_ACCELERATOR.track_count`
- Website value: public text may mention `3 career programmes`; older prompt history mentioned `5 tracks`.
- Database/local approved value: `3 active tracks`.
- Existing hard-coded value before rebuild: `3 active tracks`.
- Recommended resolution: Confirm active public track list before approving a new knowledge version.
- Admin approval status: `PENDING_ADMIN_APPROVAL` when detected by website sync.

## Missing Business Information Before Rebuild

- Business Transformation did not have equal retrieval priority in Telegram conversation mode.
- Business replies could fall back to career-style answers.
- Business-specific gaps such as WhatsApp orders, CRM, website, customer follow-up, marketing engine and dashboards were not used as structured approved knowledge.

## Source That Controls Application and Payment

- Application:
  - Career Accelerator: `/career-accelerator` and selected track pages/forms.
  - Business Transformation: `/business-transformation`.
- Payment:
  - Paystack initialization endpoint: `/api/paystack/initialize`.
  - Career amount is calculated from selected track pricing.
  - BATP amount is `35000` unless explicitly overridden by request body.

## Recommended Canonical Source of Truth

Use a controlled local approved commercial knowledge snapshot as the Copilot runtime source:

1. Public website is treated as an external commercial source to sync and compare.
2. Local programme configuration and Airtable website programme data provide structured programme facts.
3. Critical changes from website sync become `KNOWLEDGE_CONFLICT` records until admin approval.
4. Copilot responses use only the approved snapshot.
5. If website sync fails, continue using the last approved valid snapshot.

## Implemented Knowledge Architecture

```text
Public Website
        |
Website Content Extractor
        |
Validation and Normalisation
        |
Nexora Commercial Knowledge Store
        |
Approved Knowledge Snapshot
        |
Copilot Retrieval Layer
        |
Sales Response Engine
```

Implemented files:

- `src/lib/commercial-knowledge.ts`
- `src/lib/sales-session.ts`
- `src/app/api/growth/copilot-knowledge/route.ts`
- `src/app/growth-associate/admin/copilot-knowledge/page.tsx`

## Migration Risks

- Airtable may not yet contain a `Telegram Sales Sessions` table. The implementation falls back to local memory if Airtable persistence fails.
- Public website content may be cached by deployment/CDN, causing sync to report old values even after GitHub deployment.
- Paystack and Airtable can still contain old programme records. These must be reviewed before making a new approved knowledge version.
- Admin approval controls are currently represented as conflict status and report UI. A later phase can add write-back approval records if Airtable fields are created for knowledge versions/conflicts.

## Result

The Copilot now uses an approved commercial knowledge snapshot for sales replies, supports Career Accelerator and Business Transformation, flags website conflicts, and keeps conversation state for selected programme/track and business gap progression.
