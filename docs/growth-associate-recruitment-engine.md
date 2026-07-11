# NEXORA Growth Associate Recruitment Engine

## Public Flow

The public application lives at `/growth-associate/recruitment`.

Applicants submit interest, profile, reach, motivation, consent, and video assessment information. The website now creates only an `Ambassador Registrations` record. It does not create an active ambassador, referral code, referral link, dashboard, or commission account at this stage.

## Recruitment Stages

1. Application Received
2. Under Review
3. Shortlisted
4. Interview Scheduled
5. Interview Completed
6. Selected for Bootcamp
7. Bootcamp In Progress
8. Probation
9. Official Growth Associate
10. Rejected
11. Withdrawn

## Admin Dashboard

The private dashboard lives at `/growth-associate/admin`.

Operators enter the `GROWTH_ADMIN_SECRET`, load applications, review AI screening, and move candidates through stages. The dashboard can:

- Review applications.
- Shortlist applicants.
- Mark interviews as scheduled or passed.
- Move candidates into bootcamp and probation.
- Reject applicants.
- Approve selected candidates as official Growth Associates.

## Official Activation

Referral tools are created only when an admin action moves the applicant to `Official Growth Associate`.

At that point the system creates or links an `Ambassadors` record with:

- Growth Associate ID.
- Referral code.
- Career accelerator referral link.
- Active status.
- 5% commission rate.
- Referral and commission counters initialized.

## AI Screening

The current screening engine scores applicants using structured application signals:

- Motivation depth.
- Leadership and community experience.
- Sales or promotion experience.
- Video submission.
- Paid Growth Associate fit, including recruitment motivation, promotion experience, audience reach, and social proof.
- Weekly availability.
- Estimated reach.
- Social reach.

The output is saved to Airtable:

- AI Score.
- AI Recommendation.
- AI Strengths.
- AI Weaknesses.
- AI Interview Questions.
- AI Suggested Role Fit.
- AI Screening Summary.

## Scheduling Hook

`/api/growth-associate/calendly` accepts scheduler webhooks. When an invitee email matches an application, it updates:

- Recruitment Stage: Interview Scheduled.
- Interview Status: Scheduled.
- Interview Date Time.
- Calendly Event ID.

Use `CALENDLY_WEBHOOK_SECRET` and pass it as `x-nexora-webhook-secret` or `?secret=`.

## Required Environment Variables

- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`
- `GROWTH_ADMIN_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Optional:

- `CALENDLY_EVENT_TYPE_URL`
- `CALENDLY_WEBHOOK_SECRET`

## Testing Checklist

- Submit a public Growth Associate application.
- Confirm Airtable creates an `Ambassador Registrations` record only.
- Confirm no `Ambassadors` record is created on submission.
- Open `/growth-associate/admin`.
- Move the applicant through review, shortlist, bootcamp, probation, and official approval.
- Confirm only official approval creates the referral code/link and active ambassador record.
- Confirm rejected applicants never receive referral tools.
