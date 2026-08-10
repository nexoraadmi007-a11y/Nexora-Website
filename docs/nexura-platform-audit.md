# Nexura Institute Platform Audit

## Current Architecture

- Frontend: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Framer Motion, lucide-react.
- Backend: Next.js API routes under `src/app/api`.
- Database/CRM: Airtable via `src/lib/airtable.ts`.
- Payments: Paystack initialise, verify and webhook routes.
- Messaging: Telegram bot/webhook, admin test mode, send queue and health endpoint.
- Email: Resend integration via `src/lib/email.ts`.
- Lead generation: Apify discovery, individual growth engine, business lead discovery, daily automation and Telegram admin testing.
- Referral/partner foundation: referral capture, Paystack attribution, associate portal, referral repair and attribution review.
- HR onboarding: growth associate recruitment/admin, employment letters, signed letter upload, HR profile and payroll detail capture.
- Programme data: Airtable-backed website records with fallbacks in `src/lib/site-data.ts`, commercial knowledge in `src/lib/commercial-knowledge.ts`, career tracks in `src/lib/career-accelerator-v2.ts`.

## Component Classification

| Component | Status | Decision |
| --- | --- | --- |
| Public website pages | Working but repositioning needed | REFACTOR |
| Existing dark premium visual system | Strong base | KEEP |
| `Programmes` Airtable model | Active canonical website source | EXTEND |
| `career-accelerator-v2.ts` | Good structured curriculum base | EXTEND |
| Paystack payment flow | Working production infrastructure | KEEP |
| Referral tracker and cookies | Working attribution layer | KEEP |
| Existing Growth Associate portal | Production operational tool | KEEP, then migrate language to Partner |
| Telegram Growth Copilot | Working and recently repaired | KEEP |
| Business lead generation | Recently repaired admin-only test mode | KEEP |
| HR onboarding and employment docs | Working production workflow | KEEP |
| `complete-ai-accelerator` route | Obsolete public offer | DEPRECATE |
| Old “ambassador” naming | Legacy distribution language | REFACTOR |
| Public “course/training” framing | Too narrow for V2 positioning | REFACTOR |
| Instant earnings-style language | Brand risk | REMOVE from public positioning |
| Business Transformation Programme | Still valuable but separate | KEEP, with price pending admin confirmation for public exact pricing |

## Data and Business Logic Notes

- Commission/referral logic must remain backend-owned. Frontend should only display canonical metrics.
- Airtable remains the current source of operational truth; no duplicate learner/payment/referral system should be created in this sprint.
- Existing growth associates should be treated as future Founding Nexura Partners, preserving record IDs, referral codes, Telegram IDs, HR records and history.
- The public website should lead with the skills-to-income platform story, not partner recruitment.

## Immediate Gaps

1. Public homepage does not yet clearly lead with Future of Work -> Skills -> Projects -> Income Readiness -> Opportunity Network.
2. Career programme is still named AI Career Accelerator publicly, while the new flagship learner product is AI Income Accelerator.
3. Current learner track set has three tracks; V2 requires four, including AI Automation & No-Code Solutions.
4. There is no clear Opportunities page or Hire Nexura Talent page.
5. There is no role-aware member workspace entry page.
6. Partner Network exists operationally through growth associate/referral tooling but needs premium, non-MLM public positioning.

## Safety Constraints

- Preserve Paystack, Airtable, Telegram, HR onboarding, referral attribution and lead-generation APIs.
- Do not alter employment agreements automatically.
- Do not enable associate lead delivery automatically.
- Do not change Business Transformation final public price to a new exact amount until admin confirms it.
