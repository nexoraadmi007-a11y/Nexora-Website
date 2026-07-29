# Nexora AI Growth Copilot

## Purpose

Nexora AI Growth Copilot helps Growth Associates discover, understand, contact, converse with, qualify, follow up and close prospects. It expands the old Sales Assistant concept into five modes:

- Conversation Copilot
- Lead Analyzer
- Outreach Copilot
- Follow-Up Copilot
- Opportunity Copilot

## Reused Architecture

- Existing Telegram bot.
- Existing Airtable `Growth Leads`, `Ambassadors`, `Lead Activities`, and `Growth Audit Logs`.
- Existing referral and payment systems.
- Existing associate portal and admin routes.

## Lead Categories

Individual prospects include NYSC members, prospective NYSC members, final-year students, 500-level students, recent graduates and early-career professionals.

Business prospects focus on accessible social-commerce vendors: Instagram vendors, Facebook vendors, WhatsApp-based sellers, founder-led businesses, and small online brands.

Large bureaucratic organisations are not prioritised.

## Contactability Rules

Assignable leads must have a valid public contact route:

- Public social profile
- WhatsApp link
- Phone
- Email
- Website contact route

Generic blog articles, news pages and non-actionable search snippets are rejected from assignment.

## Telegram Commands

```text
/copilothelp
/respond pasted conversation
/analyze profile or business description
/outreach prospect details
/followup stalled conversation
/newindividual lead details
/newbusiness business/vendor details
```

Existing commands remain available.

## Associate-Submitted Leads

Associates can submit free-form individual or business opportunities. The system analyses the description, checks contactability, prevents duplicates, writes the lead to `Growth Leads`, and keeps ownership with the submitting associate when available.

## Business Solution Matching

The Copilot recommends one entry solution at a time, such as:

- WhatsApp order and customer follow-up system
- Website or online storefront
- Booking system
- Simple CRM and customer follow-up system
- Payment workflow

It does not pitch every solution at once.

## Programme Matching

Career matching maps observable signals to:

- AI Content Creation
- Certified UI/UX Designer
- AI Financial Analyst
- Career Accelerator fallback

The Copilot must not invent prices, dates, discounts, guarantees or policies. Missing commercial details should be confirmed from official Nexora records.

## Feature Flags

```text
ENABLE_GROWTH_COPILOT=true
ENABLE_CONVERSATION_COPILOT=true
ENABLE_LEAD_ANALYZER=true
ENABLE_OUTREACH_COPILOT=true
ENABLE_FOLLOW_UP_COPILOT=true
ENABLE_OPPORTUNITY_COPILOT=true
ENABLE_INDIVIDUAL_LEADS=true
ENABLE_BUSINESS_VENDOR_LEADS=true
ENABLE_ASSOCIATE_SUBMITTED_LEADS=true
ENABLE_LARGE_CORPORATE_LEADS=false
ENABLE_BUREAUCRATIC_ORGANISATION_LEADS=false
ENABLE_GENERIC_BLOG_LEADS=false
REQUIRE_VALID_CONTACT_PATH=true
```

## Testing

1. Run `/copilothelp` from the admin Telegram account.
2. Run `/analyze` with a public profile or vendor description.
3. Run `/outreach` with prospect details.
4. Run `/followup` with a stalled conversation.
5. Run `/newbusiness` with a real vendor description.
6. Run `/newindividual` with a real individual lead description.
7. Confirm new records in Airtable have contactability and source-quality fields.
8. Confirm existing `/leads`, `/reply`, `/testleads`, and payment/referral flows still work.

## Deployment

Deploy code first, run the additive Airtable sync, then enable flags on Render. Start with admin testing, then one associate, then expand.

## Rollback

Disable `ENABLE_GROWTH_COPILOT` and `ENABLE_ASSOCIATE_SUBMITTED_LEADS`. Existing records remain intact because all schema updates are additive.

## Known Limitations

The current repo has no OpenAI client or API wrapper. The first Growth Copilot release uses deterministic rules and structured formatting. A model-backed service can later be added behind the same `runGrowthCopilot` interface.
