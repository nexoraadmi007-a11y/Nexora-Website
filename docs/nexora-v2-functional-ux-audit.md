# Nexora Institute V2 Functional UX Audit

Date: 2026-08-11  
Scope: Member workspace, partner workspace, public support, checkout and admin operating system.

## Summary

The application had strong route coverage but many controls were visual only. The most visible broken behaviours were static login/signup-like flows, static top search, immediate logout, non-functional settings cards, static notification filters, decorative resource categories, decorative opportunity tabs, partner activation agreement as free text, no payout request workflow, no server-side promo validation and no clear entitlement model.

## Screen Audit

| Route | Purpose | Visible Controls | Control Status | Data Source | Access | UX Issue | Recommended Repair |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/app` | Member command centre | Explore programmes, class/resource/profile links | PARTIAL | Canonical programme config + local preview state | Preview login | Good structure, needs entitlement-aware onboarding | Add goal selection, locked access messaging and programme pricing strategy |
| `/app/programmes` | Programme catalogue | View Programme, Enrol | PARTIAL | `src/config/programmes.ts` | Preview login | Uses single price concept | Add list price + promo payable price |
| `/app/programmes/:slug` | Programme detail | Enrol, track links | PARTIAL | Programme config | Preview login | Price copy needs promo model | Use list price and checkout promo |
| `/app/learning` | Learning workspace | Explore Programmes | PARTIAL | Programme config | Paid learner required for full access | Unpaid access not clearly locked | Add entitlement/locked messaging |
| `/app/classes` | Class agenda | Tabs, View Programmes, Resources | PARTIAL | Static empty state | Paid learner required for class join | Tabs were decorative | Convert to meaningful agenda state; avoid join buttons until classes exist |
| `/app/projects` | Project workspace | Tabs, Explore Programmes | PARTIAL | Static examples | Paid learner required | Tabs decorative | Keep non-dead preview with examples and paid lock copy |
| `/app/portfolio` | Portfolio workspace | Complete Profile | PARTIAL | Local/profile future state | Preview login | Save/publish not persistent yet | Add profile persistence and CV upload |
| `/app/opportunities` | Opportunity matching | Tabs and filters | BROKEN | Static | Preview access, full matching later | Tabs/filters decorative | Add client-side tab/filter/save state |
| `/app/resources` | Learner resource library | Category cards | BROKEN | Static categories | Preview access, paid resources later | Cards not clickable | Add category routes or query-driven category view |
| `/app/notifications` | Notification centre | Category tabs, rows | BROKEN | Static notifications | Preview login | Filters and read state decorative | Add client-side filtering/read state |
| `/app/profile` | User profile | Save profile | BROKEN | Static form | Preview login | Poor layout, no persistence, no CV upload | Add client form, local persistence and upload control |
| `/app/settings` | Account settings | Open buttons | BROKEN | Static cards | Preview login | Buttons had no destinations | Add settings routes and working forms |
| `/app/billing` | Payment history | Table only | PARTIAL | Future payment records | Preview login | No receipt actions until records exist | Keep transparent empty purchase state |
| `/app/partner` | Partner overview | Activate, copy/share | PARTIAL | Partner state future | Partner active for full access | Copy/share not wired | Add activation and copy/payout workflow |
| `/app/partner/activate` | Partner activation | Form, submit | BROKEN | Static | Preview login | Agreement was free text | Add terms checkboxes and stepper |
| `/app/partner/referrals` | Referral analytics | Table/funnel | PARTIAL | Future referral events | Active partner | No live data yet | Keep locked/zero state until active |
| `/app/partner/earnings` | Wallet/payouts | Table only | BROKEN | Future payout ledger | Active partner | No Request Payout flow | Add payout request validation |
| `/app/partner/payment-details` | Bank details | Add/update | PARTIAL | Local preview; Paystack later | Active partner | No resolution/name check | Add bank resolution mock path and similarity state |
| `/app/partner/resources` | Partner resources | Category cards | BROKEN | Static categories | Active partner | Cards not clickable | Add resource category links |
| `/app/partner/copilot` | Sales assistant | Get Suggested Reply | PARTIAL | Existing Copilot API future hook | Active partner | Button not hooked in workspace UI | Add meaningful disabled/submit flow or API hook |
| `/help` | Support | Category list, submit | BROKEN | Static | Public/member | Headline/internal copy, categories static | Add interactive support form and ticket creation |
| `/app/help/tickets` | Ticket history | Missing | MISSING | Local/support records | Preview login | Required route absent | Add ticket list |
| `/checkout` | Payment start | Continue to Paystack | BROKEN | Programme config + Paystack API | Public | Button did nothing | Add promo validation and Paystack initialization |
| `/admin` | Operating dashboard | Tables/cards | PARTIAL | Config + future records | Admin | Some actions decorative | Link controls to routes, avoid fake mutation |
| `/admin/promos` | Promo management | Missing | MISSING | Promo model | Admin | Required for pricing strategy | Add promo management route |

## Repair Policy

- Visible controls must navigate, submit, filter, copy, save, open a modal or be removed.
- Production data must not be invented.
- Preview-only persistence uses browser local storage and is labelled as preview where applicable.
- Server-side payable pricing is introduced before Paystack initialization.
