# Nexura Institute Platform V2 Plan

## Product Direction

Nexura Institute becomes a premium skills-to-income platform for African talent preparing for the AI economy.

Core proposition:

```text
Learn. Build. Earn. Work.
```

The public story should prioritise future-of-work readiness, practical skills, real project evidence, income readiness and opportunity access. The Partner Network remains a distribution channel, not the brand identity.

## Retained Infrastructure

- Next.js public website and API routes.
- Airtable CRM and programme records.
- Paystack payment and verification flow.
- Referral capture and attribution.
- Telegram admin and associate tooling.
- Growth Copilot.
- HR onboarding.
- Business lead-generation admin test mode.

## New Modules

- Public `Learn` surface for AI Income Accelerator.
- Public `Opportunities` page.
- Public `Hire Nexura Talent` page.
- Public `Partners` page with restrained partner positioning.
- Member workspace shell for role-aware learner/partner/admin direction.
- Shared `From Skill to Income` curriculum module.
- Fourth AI Income Accelerator track: AI Automation & No-Code Solutions.

## Information Architecture

### Public Website

- Home
- Learn
- For Businesses
- Opportunities
- Partners
- About
- Resources
- Login
- Get Started

### Member Platform

- Learner dashboard
- Programme progress
- Live classes
- Assignments
- Portfolio
- Income readiness
- Opportunities
- Partner earnings, where applicable

### Admin & Operations

- Admissions and registrations
- Programme management
- Payments and refunds
- Partner payouts
- Lead generation
- HR onboarding
- Telegram operations

## Rollout Stages

1. Reposition public website and canonical learner programme naming.
2. Add fourth track and shared monetisation layer.
3. Add opportunities, talent and partner public pages.
4. Add role-aware member workspace shell.
5. Extend Airtable schema for live classes, progress and portfolio records.
6. Build learner dashboard on real programme milestones.
7. Build Partner Earnings and monthly payout administration.

## Rollback

- Keep existing routes such as `/career-accelerator` alive for backwards compatibility.
- Do not delete old Growth Associate routes until partner migration is approved and tested.
- Feature-flag new member modules when backend data is not yet complete.

## Testing

- Build and typecheck after each public implementation pass.
- Confirm Paystack initialize and success routes still compile.
- Confirm Telegram webhook still compiles.
- Confirm no hardcoded obsolete public price replaces canonical programme config.
