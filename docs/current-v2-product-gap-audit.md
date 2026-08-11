# Nexora Institute V2 Product Gap Audit

Date: 2026-08-11  
Scope: Existing Nexora Institute V2 application in `NEXORA-WEBSITE-business-leads`.

## Summary

The V2 foundation has a working Next.js route shell, public pages, preserved Airtable/Paystack/Telegram APIs, and canonical programme records. The member workspace and admin operating system were mostly placeholder screens. The biggest gap was not route existence; it was that the product did not yet guide a new learner, business customer, partner or admin toward a meaningful next action.

## Feature Classification

| Area | Status | Notes |
| --- | --- | --- |
| Public website routes | PARTIAL | Core pages exist and use canonical programme records, but full enrolment journey still needs durable account/payment state. |
| Canonical programme data | WORKING | `src/config/programmes.ts` stores AI Income Accelerator at NGN 10,000 and Business Transformation at NGN 25,000. |
| Signup | PARTIAL | Captures signup intent and validates WhatsApp/password. Durable auth/database account creation remains pending. |
| Login | PARTIAL | Preview login routes users to `/app`. Real sessions/password verification remain pending. |
| Member app shell | PARTIAL | Sidebar/topbar existed but lacked icons, active state, search, bell and profile menu. Upgraded in this pass. |
| Home dashboard | PLACEHOLDER | Previously only three empty cards. Needs command-centre layout, onboarding, metrics and actions. |
| App programme catalogue | MISSING | `/app/programmes` and `/app/programmes/:slug` were absent. |
| Learning page | PLACEHOLDER | Previously showed “Modules unlock after enrolment.” Needs learning path and programme previews. |
| Classes page | PLACEHOLDER | Needs upcoming/past/calendar structure. |
| Projects page | PLACEHOLDER | Needs active/submitted/completed structure and useful zero-state. |
| Portfolio page | PLACEHOLDER | Needs stats, sections and public preview preparation. |
| Opportunities page | PARTIAL | Route existed but contained developer-facing copy. Needs tabs, filters and readiness actions. |
| Resources centre | MISSING | `/app/resources` absent. |
| Notifications | PLACEHOLDER | Route existed but lacked categories and activity style. |
| Profile | PARTIAL | Basic fields only. Needs avatar, professional and programme fields. |
| Settings | PLACEHOLDER | Needs account/security/notification/privacy/payment sections. |
| Billing | MISSING | `/app/billing` absent. |
| Partner overview | PLACEHOLDER | Needs activation state, referral link, funnel, milestones and commission explanation. |
| Partner activation | MISSING | `/app/partner/activate` absent. |
| Partner referrals | MISSING | `/app/partner/referrals` absent. |
| Partner earnings/wallet | PLACEHOLDER | Route existed but no wallet, payout cycle, ledger or payout history. |
| Partner payment details | MISSING | Existing payment settings route was nested differently; required `/app/partner/payment-details`. |
| Partner resources | PLACEHOLDER | Needs searchable resource categories. |
| Growth Copilot | PLACEHOLDER | Route existed but needs input/result structure. |
| Admin dashboard | PLACEHOLDER | Needed operational cards and management coverage. |
| Admin modules | PARTIAL | Routes exist but remain static management shells. |
| Airtable integration | PARTIAL | Preserved APIs exist. Some tables may be unavailable depending on Airtable permissions. |
| Paystack integration | PARTIAL | Preserved server routes exist and use updated programme prices. Payment-state UI still needs durable enrolment records. |
| Telegram integration | PARTIAL | Preserved bot/API routes exist, but local preview may not have tokens configured. |
| OpenAI/Growth Copilot | PARTIAL | Conversation logic exists separately; app route needs polished interface. |

## Implementation Direction

This pass upgrades the product surface without deleting working integrations. It introduces useful zero-data states, canonical programme-driven catalogue/detail pages, partner wallet/referral screens, profile/settings/billing/resource routes, and a more professional app shell. It does not create fake production enrolments, earnings or payments.

## Remaining Production Dependencies

- Durable user authentication.
- Canonical user/enrolment/payment database.
- Server-side learner progress records.
- Partner activation persistence.
- Real wallet ledger and payout records.
- Admin CRUD actions for programmes/classes/projects/resources.
- Role-aware server routing for learners, business users and partners.
