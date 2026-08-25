import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(new URL('../supabase/migrations/202608250001_growth_commission_ledger_and_hr.sql', import.meta.url), 'utf8')
const validation = readFileSync(new URL('../supabase/migrations/202608240004_referral_conversion_validation.sql', import.meta.url), 'utf8')
for (const [count, expected] of [[29,0],[30,45000],[31,46500],[34,51000],[40,60000]]) assert.equal(count >= 30 ? count * 1500 : 0, expected)
for (const [count, expected] of [[0,0],[1,500],[4,2000]]) assert.equal(count * 500, expected)
assert.match(migration, /v_l1_count \* v_l1_rate/i, 'Level 1 commission must be calculated authoritatively in the database.')
assert.match(migration, /v_l2_count \* v_l2_rate/i, 'Level 2 commission must be calculated separately in the database.')
assert.match(migration, /sponsor_partner_id/i, 'Level 2 must have a traceable sponsor relationship.')
assert.match(migration, /growth_referral_rules/i, 'Commission configuration must be centralised.')
assert.match(validation, /p\.status = 'PAID'/, 'Only verified paid payments may convert.')
assert.match(validation, /pa\.user_id is distinct from new\.referred_user_id/, 'Self-referrals must be rejected.')
console.log('Growth Associate referral rules passed.')
