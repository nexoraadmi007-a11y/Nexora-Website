# Nexora Institute Final Product QA

Date: 2026-08-11

## Scope

This QA pass focused on turning visible V2 screens into working product workflows without inventing production records. Some account/settings/support workflows remain preview-level until durable auth and database storage are connected.

## Implemented Repairs

- Profile page reorganized with avatar, profile completion, checklist, personal/career sections, save feedback and CV upload control.
- Partner activation now uses agreement checkboxes, links to `/legal/partner-terms`, and calls the server-backed partner activation API.
- Support page headline corrected and categories are selectable.
- Support tickets are created in preview storage and visible at `/app/help/tickets`.
- Settings cards now open real settings routes.
- Account, security, notification and privacy settings have save feedback.
- Partner payment details route includes bank selection, account-number entry, resolved account name and profile/name comparison status.
- Notifications have functional category filters, actionable links, Mark as Read and Mark All as Read.
- Global search opens a command panel and routes to matching programmes, tracks, resources, classes, projects, opportunities and help.
- Logout now requires confirmation.
- Opportunities page has working tabs, filters and save state.
- Learner and partner resource categories are clickable and have category detail pages.
- Partner Earnings includes Request Payout with approved-balance and bank-verification validation.
- Checkout now shows the canonical programme price, optional promo code, discount and final payable amount.
- Promo validation is server-side at `/api/promos/validate`.
- Paystack initialization uses server-calculated payable amount.
- Commission defaults now use 15% L1 on actual verified amount paid.
- Admin promo route exists at `/admin/promos`.
- Entitlement helper functions exist in `src/lib/entitlements.ts`.

## Pricing QA

| Programme | List Price | Promo | Discount | Final Price | Result |
| --- | ---: | --- | ---: | ---: | --- |
| AI Income Accelerator | NGN 10,000 | None | NGN 0 | NGN 10,000 | Passed |
| AI Business Transformation Programme | NGN 25,000 | None | NGN 0 | NGN 25,000 | Passed |

## Route Smoke Test

Passed with HTTP 200:

- `/app/profile`
- `/app/settings`
- `/app/settings/account`
- `/app/notifications`
- `/app/opportunities`
- `/app/resources/career`
- `/app/partner/activate`
- `/app/partner/earnings`
- `/app/partner/payment-details`
- `/help`
- `/app/help/tickets`
- `/checkout`
- `/admin/promos`

## Automated Checks

- `npm run typecheck`: Passed.
- `npm run build`: Passed.
- Build output generated 93 routes.

## Known Production Dependencies

- Durable authentication and server-side sessions.
- Persistent profile, settings and support ticket storage.
- Real Paystack bank account resolution endpoint for production account-name lookup.
- Durable first-party authentication and server-side access enforcement.
- Real notification database and read-state storage.
- Admin CRUD for promo creation/editing beyond the seeded preview validation rule.
- Refund and negative adjustment processing in the finance ledger.
- Full visual screenshot capture should be performed through browser QA before production deployment.
