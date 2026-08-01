# Payment and Referral Flow Audit

## Current Flow

- Registration UI: `CareerTrackSelector` and `WebsiteForms` collect applicant details and optional referral code.
- Referral capture: `ReferralTracker` reads `ref`, `referral`, or `ambassador` URL parameters, stores the code in local/session storage and browser cookie, then writes referral click/view events.
- Paystack initialization: `/api/paystack/initialize` creates the lead/contact, creates an `NGTP Applications` record, initializes Paystack, writes `Website Payment Events`, and creates pending `Ambassador Referrals` when a valid referral code resolves to an associate.
- Webhook: `/api/paystack/webhook` verifies Paystack signature and transaction status, then updates payment/enrollment/referral/attribution records.
- Associate metrics: `/api/growth/associate-portal` reads `Conversion Attribution`, `Ambassador Referrals`, and `Referral Events`.

## Root Causes

- Post-payment onboarding did not have a dedicated verified success page. Paystack returned users to programme pages with `payment=complete`, which did not verify the reference or display class group access.
- Referral codes were stored client-side but `/api/paystack/initialize` trusted only the request body. If a form failed to include the code, the server did not recover from the referral cookie.
- The webhook owned the payment finalization logic, so the browser callback could not safely finalize or display a verified result when the webhook was delayed.
- No programme-to-group configuration existed for student/customer class groups. The only configured group link was the Growth Associate staff invite link, which must not be reused for paid student onboarding.

## Fix Implemented

- Added shared Paystack fulfillment logic in `src/lib/paystack-fulfillment.ts`.
- Added `/api/paystack/verify`, which verifies a Paystack reference server-side and finalizes records idempotently.
- Updated Paystack callback URL to `/payment/success?reference=...`.
- Added `/payment/success` branded confirmation page with verified payment details and programme-specific next steps.
- Added environment-backed programme group resolution in `src/lib/programme-groups.ts`.
- Preserved Airtable idempotency by keeping lookup-by-payment-reference for enrollments, payments, referral events, and conversion attribution.
- Added server-side referral-cookie fallback in Paystack initialization so referral attribution survives form/client gaps.

## Group Link Status

No production class WhatsApp links were found in the current codebase or environment example. The success page will confirm payment and show onboarding pending until official group links are configured.

Required group links:

1. AI Content Creation WhatsApp group link
2. Certified UI/UX Designer WhatsApp group link
3. AI Financial Analyst WhatsApp group link
4. Any fourth active Career Accelerator track group link, if applicable
5. Business Transformation WhatsApp group link
6. General Nexora community link, if it should also be shown

## Testing Checklist

- Open a referral link and confirm the referral code appears on checkout.
- Complete Paystack payment and confirm redirect to `/payment/success?reference=...`.
- Verify the success page calls `/api/paystack/verify` and does not trust the query string alone.
- Confirm duplicate refreshes do not create duplicate enrollments or payments.
- Confirm `Ambassador Referrals`, `Referral Events`, and `Conversion Attribution` are updated after payment.
- Confirm class group button appears only when the matching official group URL is configured.
