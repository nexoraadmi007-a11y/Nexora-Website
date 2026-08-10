# Database and External Data Reset Classification

Date: 2026-08-10

The current repository primarily uses Airtable as the operational data store. No local database schema or migration folder was found in the reset audit.

## Preserve

| Data area | System | Classification | Notes |
| --- | --- | --- | --- |
| Master contacts / users | Airtable | PRESERVE | Identity, contact records and CRM status must remain stable. |
| Ambassadors / partners / growth associates | Airtable | PRESERVE | Partner IDs, referral codes and Telegram IDs must not be regenerated. |
| Referral Events | Airtable | PRESERVE | Historical attribution evidence. |
| Ambassador Referrals | Airtable | PRESERVE | Historical referral conversion records. |
| Website Payment Events | Airtable + Paystack | PRESERVE | Paystack references and payment records remain historical truth. |
| NGTP Applications | Airtable | PRESERVE | Existing application records. |
| Programmes | Airtable | PRESERVE/REVIEW | Keep records; V2 should define canonical programme schema before edits. |
| Interaction Log | Airtable | PRESERVE | CRM engagement history. |
| HR profiles/documents | Airtable/storage | PRESERVE | Existing employment and signed-document records remain external/private. |
| Business Leads / Lead Assignments | Airtable | PRESERVE/REVIEW | Existing lead records must not be deleted; V2 can decide migration later. |

## Archive / Rebuild Later

| Data or logic | Classification | Notes |
| --- | --- | --- |
| Old dashboard counters | ARCHIVE/REBUILD | Recompute from canonical events in V2. |
| Old commission calculations | ARCHIVE/REBUILD | Must be rebuilt around approved L1/L2/L3, milestones and 35% ceiling. |
| Hard-coded programme data in code | ARCHIVE/REBUILD | V2 requires canonical programme records. |
| Old UI preferences/page content | DELETE/REBUILD | Not canonical business data. |

## Schemas Modified

None.

## Data Mutations Executed

None.
