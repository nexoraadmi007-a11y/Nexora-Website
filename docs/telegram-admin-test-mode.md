# Nexora Telegram Admin Test Mode

## Existing Telegram Architecture

Nexora uses one Telegram bot through the existing Next.js webhook route:

- Webhook route: `/api/telegram/webhook`
- Bot token: `TELEGRAM_BOT_TOKEN`
- Webhook protection: `TELEGRAM_WEBHOOK_SECRET`
- Admin notifications: `TELEGRAM_ADMIN_CHAT_ID`
- Outbound queue sender: `/api/telegram/send-queue`

The implementation reuses the existing bot. No duplicate bot, database, lead table, or referral system was created.

## Admin Identity Resolution

Admin identity is resolved in this order:

1. `TELEGRAM_TEST_ALLOWED_USER_IDS`
2. `TELEGRAM_ADMIN_USER_ID`
3. `ADMIN_TELEGRAM_ID`
4. `TELEGRAM_OWNER_ID`
5. `SUPER_ADMIN_TELEGRAM_ID`
6. `TELEGRAM_ADMIN_CHAT_ID`

The current production system already stores the admin Telegram destination through environment configuration. Test commands are available only when the incoming Telegram user or chat ID matches the resolved admin identity.

If an unknown user sends `/start`, the bot displays the detected Telegram User ID and Chat ID and asks for dashboard verification. It does not grant admin access automatically.

## Feature Flags

Recommended production flags:

```text
ENABLE_ADMIN_TELEGRAM_TEST_MODE=true
ENABLE_TELEGRAM_LEAD_PREVIEW=true
ENABLE_TELEGRAM_AI_RESPONSE_TEST=true
TELEGRAM_TEST_ADMIN_ONLY=true
ENABLE_ASSOCIATE_TELEGRAM_LEAD_DELIVERY=false
ALLOW_ADMIN_LIVE_LEAD_TEST=false
TELEGRAM_TEST_MAX_LEADS=10
TELEGRAM_TEST_DEFAULT_LEADS=5
TELEGRAM_TEST_SESSION_TTL_MINUTES=10
```

To disable the feature, set:

```text
ENABLE_ADMIN_TELEGRAM_TEST_MODE=false
```

## Commands

```text
/teststatus
```

Shows whether admin test mode, lead preview, AI response testing, and associate delivery are enabled.

```text
/testhelp
```

Shows the test command guide.

```text
/testleads
/testleads 5
/testleads 10
```

Previews existing Career Accelerator individual leads. The preview prioritizes yesterday's qualified individual leads in the Africa/Lagos timezone. If no qualifying leads from yesterday exist, it shows the most recent available individual leads.

```text
/respond
```

Starts a 10-minute temporary session. The next non-command message is analysed by the sales assistant.

```text
/respond Prospect: ...
```

Analyses the pasted conversation immediately.

```text
/cancel
```

Cancels the active test session.

## Lead Preview Behaviour

Preview mode does not:

- Assign leads to the admin.
- Change lead ownership.
- Change lead status.
- Consume associate quotas.
- Count toward associate performance.
- Create production follow-ups.
- Affect referrals, leaderboard, targets, bonuses, or attribution.

Each lead card shows only non-sensitive lead details and a safe reference. Source buttons are shown only when the lead has a valid public URL.

## Test Buttons

Lead cards can include:

- View Source
- View Full Details
- Test Contacted
- Test Interested
- Test Follow-Up
- Test AI Reply

All button actions are recorded as test audit events only. Production lead records are not mutated.

## Test Logging

Test events are written to `Growth Audit Logs` with:

- `Action` prefixed with `TELEGRAM_TEST_`
- `New Value` containing `is_test: true`
- `Reason` explaining that no production lead state changed

These logs are excluded from associate activity, monthly intake, referral attribution, and bonus calculations.

## AI Conversation Assistant

The Telegram test mode reuses the existing Nexora sales assistant logic from `growth-actions`. It identifies:

- Sales stage
- Objection
- Recommended reply
- Shorter reply
- Reasoning summary
- Next action
- Suggested follow-up

The assistant is constrained to safe Nexora communication rules: no false urgency, no invented discounts, no job or income guarantees, no personal payment requests, and escalation when admin confirmation is needed.

## Troubleshooting

If `/teststatus` says the account is not verified:

- Confirm `TELEGRAM_TEST_ALLOWED_USER_IDS` or `TELEGRAM_ADMIN_CHAT_ID` contains the admin Telegram ID.
- Send `/start` to the bot to see the detected User ID and Chat ID.
- Update the environment variable on Render and redeploy.

If `/testleads` returns no leads:

- Confirm `Growth Leads` contains `INDIVIDUAL`, `NYSC_MEMBER`, `FINAL_YEAR_STUDENT`, or `RECENT_GRADUATE` records.
- Confirm lead status is `New`, `Qualified`, or `Assigned`.
- Confirm records are not restaurant, SME, business, corporate, invalid, or opted out leads.

If `/respond` fails:

- Send enough conversation context.
- Use `/cancel` and start again with `/respond`.

## Later Associate Enablement

Associate lead delivery remains disabled during admin-only testing. When ready, enable associate delivery deliberately, confirm each associate has a verified `Telegram User ID`, and test with one associate before expanding.
