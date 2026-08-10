# Nexora Institute V2 Release 1 Foundation Report

Date: 2026-08-10

## Architecture

Release 1 establishes a coherent V2 product foundation on top of the preserved infrastructure:

- `src/config/programmes.ts` is the canonical Release 1 programme source.
- `src/components/ui.tsx` defines reusable primitives.
- `src/components/shell.tsx` defines public, member and admin shells.
- Public, member and admin routes are separated into distinct product surfaces.
- Existing API and integration routes remain preserved for migration.

## Public Experience

Completed V2 routes:

- `/`
- `/programmes`
- `/programmes/[programme]`
- `/programmes/ai-income-accelerator/[track]`
- `/business`
- `/opportunities`
- `/partners`
- `/about`
- `/resources`
- `/hire`
- `/help`

Public narrative now prioritises skills, practical projects, income readiness, future of work and opportunities. Partner Network is secondary and responsibly positioned.

## Authentication

Frontend shells created:

- `/signup`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

Durable auth backend, sessions, password reset tokens and email verification are intentionally deferred until the V2 auth service/database design is approved.

## Learning

Member shell routes created:

- `/app`
- `/app/learning`
- `/app/classes`
- `/app/projects`
- `/app/portfolio`
- `/app/opportunities`
- `/app/notifications`
- `/app/profile`
- `/app/settings`

These use empty states instead of fake production data.

## Partner System

Partner shell routes created:

- `/app/partner`
- `/app/partner/earnings`
- `/app/partner/resources`
- `/app/partner/copilot`
- `/app/partner/settings/payment`

Commission calculation, ledger persistence and payout approvals are intentionally deferred until the canonical database/event model is approved.

## Wallet

Wallet route exists at `/app/partner/earnings` as an earnings ledger shell. It does not show fake earnings.

## Business Programme

Business route exists at `/business`.

Canonical confirmed price:

```text
AI Business Transformation Programme = NGN 25,000
```

## Admin

Admin operating-system shell routes created:

- `/admin`
- `/admin/users`
- `/admin/programmes`
- `/admin/classes`
- `/admin/partners`
- `/admin/referrals`
- `/admin/commissions`
- `/admin/payouts`
- `/admin/opportunities`
- `/admin/analytics`
- `/admin/settings`

## Database

No migrations executed. Existing Airtable records remain preserved.

V2 still needs an approved canonical data model before production auth, learning progress, commission and payout logic are enabled.

## Integrations

| Integration | Status |
| --- | --- |
| Paystack | Preserved. Price fallback for BATP updated to NGN 25,000. |
| Airtable | Preserved. Existing adapter remains in `src/lib/airtable.ts`. |
| Telegram | Preserved. Existing transport and routes remain. |
| OpenAI | Preserved for review through existing product logic. |
| Storage | Preserved. Public and HR assets remain. |

## Testing

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Local production preview: passed for `/`, `/programmes`, `/programmes/ai-income-accelerator`, `/programmes/ai-income-accelerator/ai-content-digital-marketing`, `/business`, `/login`, `/signup`, `/app`, `/admin`, `/api/system/health`.

## Remaining Limitations

- Auth screens are UI shells, not connected to durable auth yet.
- Checkout screen is prepared but not wired to submit to Paystack from the new V2 UI.
- Member/admin screens show intentional empty states.
- Learning progress, class scheduling, projects, portfolio uploads, notifications, partner commissions, wallet ledger, payout engine and RBAC require the next backend/data release.

## Next Phase

Design and approve the canonical database and service architecture for:

- users and roles,
- programmes/tracks/cohorts/classes,
- enrolments/payments,
- projects/portfolio/progress,
- referrals/commissions/wallet/payouts,
- notifications and audit logs.
