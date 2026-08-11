# Nexora Institute V2 UI Review

Date: 2026-08-11

## Review Scope

This review covers the member workspace, partner workspace and admin operating system after the product-completion pass. The goal was to move from placeholder pages to a useful, journey-led product surface.

## Major UX Decisions

### App Shell

The workspace now uses a grouped sidebar with icons, active states and compact navigation. The header includes search, notification access and a profile menu with Profile, Settings, Billing, Partner Settings, Help and Log Out.

### New User Experience

New accounts no longer land on large empty cards. The home dashboard now shows:

- A primary “Start Your Nexora Journey” action.
- Onboarding checklist.
- Compact readiness and progress metrics.
- Learning path preview.
- Income readiness checklist.
- Next class guidance.
- Recent activity stream.

### Programme Discovery

`/app/programmes` and `/app/programmes/:slug` now use the canonical programme records:

- AI Income Accelerator: NGN 10,000.
- AI Business Transformation Programme: NGN 25,000.

The Career Accelerator tracks are shown as part of AI Income Accelerator and are not mixed into the business programme.

### Learning, Classes, Projects and Portfolio

Each area now answers:

- What is missing?
- Why is it missing?
- What can the user do next?

The screens include tabs, previews, tables, progress states and clear CTAs without exposing internal implementation language.

### Partner Workspace

The partner workspace now includes:

- Activation route.
- Referral link and referral code space.
- Referral funnel.
- Referral statistics.
- Milestone progress.
- Commission rules.
- Earnings wallet.
- Ledger and payout history.
- Payment details.
- Partner resources.
- Growth Copilot surface.

The language avoids MLM framing and uses “partner”, “referrals”, “qualified sales”, “network sales”, L2 and L3.

### Admin Operating System

Admin pages now provide operational structures for:

- Users.
- Programmes.
- Classes.
- Partners.
- Referrals.
- Commissions.
- Payouts.
- Opportunities.
- Analytics.
- Settings.

The admin UI shows management intent and operational queues while preserving the need for real server records before production actions are made persistent.

## Visual System

Updates include:

- Smaller, more professional workspace headings.
- Compact metric cards.
- Grouped navigation with icons.
- Semantic colours for success, warning and action states.
- Tables for operational records.
- Progress bars and checklist items.
- Maximum workspace width and deliberate dashboard grids.
- Better mobile stacking for sidebars, tables and grids.

## Required Route Status

| Route | Status |
| --- | --- |
| `/app` | Working |
| `/app/programmes` | Working |
| `/app/programmes/:slug` | Working |
| `/app/learning` | Working |
| `/app/classes` | Working |
| `/app/projects` | Working |
| `/app/portfolio` | Working |
| `/app/opportunities` | Working |
| `/app/resources` | Working |
| `/app/notifications` | Working |
| `/app/profile` | Working |
| `/app/settings` | Working |
| `/app/billing` | Working |
| `/app/partner` | Working |
| `/app/partner/activate` | Working |
| `/app/partner/referrals` | Working |
| `/app/partner/earnings` | Working |
| `/app/partner/resources` | Working |
| `/app/partner/copilot` | Working |
| `/app/partner/payment-details` | Working |

## Remaining Production Work

- Connect durable auth and role routing.
- Persist profile, partner activation and payment details.
- Connect real enrolment, progress, class, project and portfolio records.
- Connect real partner wallet, payout and referral ledger records.
- Add admin CRUD actions after the canonical database is approved.
- Capture visual screenshots through browser QA before production push.
