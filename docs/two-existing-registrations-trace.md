# Two Existing Registrations Trace

Diagnostic date: 2026-08-01 (Africa/Lagos)

## Scope and record count

Production contained three referred application/check-out records for referral code `NEX-OLUZE-44BBF`. Two were successful Paystack payments; the third was an abandoned checkout. Therefore the completed-registration total is exactly two. The abandoned attempt is documented separately and is not credited.

## Registration 1

```text
Learner: OLUWADARA ZEPHANIAH MORAKINYO (email masked in this report)
Application found: YES
Application ID: APP-1785503913861 / Airtable recZLO2pNOgTnkPV6
Application referral code: The application table had no canonical referral field; the linked Website Payment Event and referral-event ledger contain NEX-OLUZE-44BBF.
Application referrer associate ID: The linked Website Payment Event and referral records contain recAdtIpHoO4yYLq1.

Paystack transaction found: YES (production verification endpoint)
Paystack reference: NEXORA-NGTP-1785503911960-WU50BP
Paystack status: success
Paystack metadata referral code: NEX-OLUZE-44BBF (resolved by production fulfilment)
Paystack metadata associate ID: recAdtIpHoO4yYLq1 (resolved by production fulfilment)

Payment record found: YES (created during idempotent production verification)
Payment status: Confirmed
Payment linked to application: YES, through the canonical conversion-attribution relationship

Enrolment found: YES
Enrolment ID: recx2LunkmarBTwTq
Enrolment linked to payment: YES

Referral attribution found: YES (created during idempotent production verification)
Attributed associate: recAdtIpHoO4yYLq1
Attribution source: DIRECT_REFERRAL
Attribution status: APPROVED at recovery time; changed to REPAIRED for the historical repair audit

Visible in associate portal: NO before repair; expected YES after the portal linked-record query correction is deployed

Exact failure point: WEBHOOK_NOT_PROCESSED and PORTAL_QUERY_USING_WRONG_FIELD. Paystack was successful, but Airtable remained Payment Status=Initialized with no Payment, Enrollment, or Conversion Attribution. The portal also attempted to find an Airtable linked record by searching its displayed ARRAYJOIN value for the record ID, which always returned no rows.
Recommended repair: Completed through the production verification endpoint; deploy the portal linked-record query correction.
```

Programme: Certified UI/UX Designer (AI-Powered)  
Amount expected/paid: NGN 10,000 / NGN 10,000  
Payment date: 2026-07-31

## Registration 2

```text
Learner: taiwo (email masked in this report)
Application found: YES
Application ID: APP-1785588922724 / Airtable reclhfnklqYKZn9BL
Application referral code: The application table had no canonical referral field; the linked Website Payment Event and referral-event ledger contain NEX-OLUZE-44BBF.
Application referrer associate ID: The linked Website Payment Event and referral records contain recAdtIpHoO4yYLq1.

Paystack transaction found: YES (production verification endpoint)
Paystack reference: NEXORA-NGTP-1785588921145-BSHHJ1
Paystack status: success
Paystack metadata referral code: NEX-OLUZE-44BBF (resolved by production fulfilment)
Paystack metadata associate ID: recAdtIpHoO4yYLq1 (resolved by production fulfilment)

Payment record found: YES (created during idempotent production verification)
Payment status: Confirmed
Payment linked to application: YES, through the canonical conversion-attribution relationship

Enrolment found: YES
Enrolment ID: rec50C6pFLtT6ZsbK
Enrolment linked to payment: YES

Referral attribution found: YES (created during idempotent production verification)
Attributed associate: recAdtIpHoO4yYLq1
Attribution source: DIRECT_REFERRAL
Attribution status: APPROVED at recovery time; changed to REPAIRED for the historical repair audit

Visible in associate portal: NO before repair; expected YES after the portal linked-record query correction is deployed

Exact failure point: WEBHOOK_NOT_PROCESSED and PORTAL_QUERY_USING_WRONG_FIELD. Paystack was successful, but Airtable remained Payment Status=Initialized with no Payment, Enrollment, or Conversion Attribution. The portal's linked-record formula returned no rows.
Recommended repair: Completed through the production verification endpoint; deploy the portal linked-record query correction.
```

Programme: AI Financial Analyst  
Amount expected/paid: NGN 10,000 / NGN 10,000  
Payment date: 2026-08-01

## Referral link and associate evidence

- Exact captured referral URL: `https://www.nexoragroup.ink/career-accelerator?ref=NEX-OLUZE-44BBF`
- Query parameter: `ref`
- Referral code: `NEX-OLUZE-44BBF`
- Referral click events exist on 2026-07-31 and 2026-08-01.
- Application-started and checkout-started events retain the same associate and referral code.
- Associate Airtable record: `recAdtIpHoO4yYLq1`
- Associate status: Active
- Referral status: Active
- Referral code is present and maps to this one associate in the inspected production data.
- Both Website Payment Events and Ambassador Referral records link the payment references to this associate.

## Non-completed attempt

Reference `NEXORA-NGTP-1785525038776-OUERD4` has an application and submitted referral record but Paystack reports `abandoned`. It has no Payment, Enrollment, or Conversion Attribution and was correctly excluded from confirmed intake and revenue.

## Root cause

The two successful Paystack transactions were never durably fulfilled into Airtable before this diagnostic. The most likely operational classification is `WEBHOOK_NOT_PROCESSED`; the success callback/verification path had not completed the missing records. A second independent defect, `PORTAL_QUERY_USING_WRONG_FIELD`, caused the associate portal to return empty arrays even after canonical attribution records existed.

The local development `PAYSTACK_SECRET_KEY` belongs to a different Paystack transaction history than the production service. Local verification therefore returned `Transaction reference not found`; production verification correctly found both successful payments. Production Paystack must remain the source for these historical transaction checks.

## Repair result

- Successful completed registrations: 2
- Confirmed Payments: 2
- Enrollments: 2
- Conversion Attribution records: 2
- Correct associate: `recAdtIpHoO4yYLq1`
- Paid referral count: 2
- Attributed revenue: NGN 20,000
- Abandoned checkout excluded: 1

