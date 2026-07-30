# Copilot Routing Root Cause

Date: 2026-07-30

## Problem

Telegram `/respond` could remain in Business Transformation mode after a prior business conversation. When the next message explicitly mentioned the AI Career Accelerator or AI Content Creation, the Copilot could still produce the business fallback:

```text
From what you described, the first thing to understand is customer management and business growth systems...
```

## Why It Happened

The routing layer trusted stale session context before analysing the latest prospect message.

The critical issue was the priority order:

1. Existing session prospect type and selected programme were read first.
2. Current message programme indicators were read after session context.
3. Track detection could use `session.selectedTrack` before the current message.
4. Business gap/type detection could use old business fields before the current message.

That meant one Telegram chat could remain attached to a previous business prospect, even when the next `/respond` clearly said:

```text
tell me more about AI Career Accelerator program
```

or:

```text
I am interested in AI Content Creation
```

## Where The Repeated Response Originated

The repeated business response came from `src/lib/growth-copilot.ts` inside `knowledgeGroundedReply()`.

The fallback used:

```text
customer management and business growth systems
```

when the current context was treated as `BUSINESS_OWNER` but no specific business gap was found.

The phrase was not a model hallucination, cached AI response or external Telegram bug. It was a deterministic hard-coded business-mode fallback triggered by stale routing.

## What Was Fixed

The router now follows this priority:

1. Explicit programme or prospect type in the current message.
2. Explicit answer to the Copilot’s last programme question.
3. Active prospect session.
4. Attached lead information or explicit API prospect type.
5. Default clarification question.

Implemented changes:

- Added deterministic programme routing: `CAREER_ACCELERATOR`, `BUSINESS_TRANSFORMATION`, `UNKNOWN`.
- Added explicit Career Accelerator detection for:
  - AI Career Accelerator
  - Career Accelerator
  - career programme
  - AI Content Creation
  - UI/UX
  - Financial Analyst
  - student
  - NYSC
  - undergraduate
  - graduate
  - course
  - training track
- Added explicit Business Transformation detection for:
  - Business Transformation
  - business programme
  - my business
  - my store
  - customers
  - orders
  - website
  - Instagram business
  - Facebook vendor
  - WhatsApp orders
  - business automation
  - sales system
  - customer database
- Changed session logic so the current message can immediately switch from business to career or career to business.
- Added `programmeContext` to persisted sales sessions.
- Changed track detection so a current track mention overrides stale session state.
- Changed business gap/type detection so current message evidence wins before old session fields.
- Added a response fingerprint guard to reject stale repeated replies when the latest message materially changes programme context.
- Added response relevance validation to prevent business-only language in Career Accelerator replies.

## Pricing Correction

The approved canonical Career Accelerator price is now:

```text
NGN 10,000
```

The approved Business Transformation price remains:

```text
NGN 35,000
```

The website, programme config, payment fallback, Copilot knowledge and regression tests were updated to match the approved values.

## Regression Coverage

The regression script now covers:

- Career Accelerator enquiry.
- AI Content Creation selection.
- Career affordability objection.
- Business Transformation enquiry.
- Switching from business to career.
- Switching from career to business.
- Ambiguous price question without session.
- Career price question with context.
- Business price question with context.
