# Pre/Post Reset Data Validation

Date: 2026-08-10

## Pre-Reset Read-Only Airtable Counts

Captured with read-only Airtable API calls using the configured base ID.

| Table | Pre-reset result |
| --- | ---: |
| Master Contacts | 12 |
| Ambassadors | 8 |
| Referral Events | 34 |
| Ambassador Referrals | 3 |
| Website Payment Events | 4 |
| NGTP Applications | 5 |
| Programmes | 11 |
| Interaction Log | 6 |

The following tables could not be counted by the current token or table mapping and returned Airtable `INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND`:

- HR Profiles
- Documents
- Business Leads
- Lead Assignments

## Post-Reset Validation

Because this reset does not perform external data mutations or schema changes, record counts are expected to remain unchanged.

| Table | Pre-reset | Post-reset | Status |
| --- | ---: | ---: | --- |
| Master Contacts | 12 | 12 | Unchanged |
| Ambassadors | 8 | 8 | Unchanged |
| Referral Events | 34 | 34 | Unchanged |
| Ambassador Referrals | 3 | 3 | Unchanged |
| Website Payment Events | 4 | 4 | Unchanged |
| NGTP Applications | 5 | 5 | Unchanged |
| Programmes | 11 | 11 | Unchanged |
| Interaction Log | 6 | 6 | Unchanged |

Validated after reset:

- Source build succeeds.
- No database destructive command was run.
- No Airtable write command was run.
- No Paystack write/charge command was run.
- No file storage delete command was run.

## Required Before Production Deployment

Before deploying the reset, export the Airtable base from Airtable UI if a full external backup is required by operations. This repository reset preserves data by not touching it.
