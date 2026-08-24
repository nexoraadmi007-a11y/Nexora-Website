import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(new URL('../supabase/migrations/202608240002_growth_associate_referrals.sql', import.meta.url), 'utf8')
const validation = readFileSync(new URL('../supabase/migrations/202608240004_referral_conversion_validation.sql', import.meta.url), 'utf8')
for (const [count, expected] of [[29,0],[30,0],[31,2000],[32,4000],[40,20000]]) assert.equal(Math.max(count - 30, 0) * 2000, expected)
assert.match(migration, /unique \(referred_user_id\)/i, 'One learner must count only once across course purchases and webhook retries.')
assert.match(migration, /greatest\(v_count - 30, 0\) \* 2000/i, 'Commission must be calculated in the database.')
assert.match(validation, /p\.status = 'PAID'/, 'Only verified paid payments may convert.')
assert.match(validation, /pa\.user_id is distinct from new\.referred_user_id/, 'Self-referrals must be rejected.')
assert.doesNotMatch(migration, /\bL2\b|\bL3\b|downline/i, 'The new system must remain single-level.')
console.log('Growth Associate referral rules passed.')
