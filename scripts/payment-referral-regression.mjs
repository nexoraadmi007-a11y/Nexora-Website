import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const checks = [
  {
    file: 'src/app/api/paystack/initialize/route.ts',
    mustInclude: ['/payment/success?reference=', "request.cookies.get('nexora_referral_code')"],
  },
  {
    file: 'src/app/api/paystack/webhook/route.ts',
    mustInclude: ['finalizeSuccessfulPaystackPayment(reference, event)'],
    mustNotInclude: ['createPaymentIfMissing', 'upsertEnrollment'],
  },
  {
    file: 'src/app/api/paystack/verify/route.ts',
    mustInclude: ['finalizeSuccessfulPaystackPayment(reference)'],
  },
  {
    file: 'src/lib/programme-groups.ts',
    mustInclude: ['CAREER_GROUP_AI_CONTENT_CREATION_URL', 'BATP_GROUP_URL'],
    mustNotInclude: ['chat.whatsapp.com/'],
  },
]

for (const check of checks) {
  const contents = read(check.file)
  for (const needle of check.mustInclude || []) {
    if (!contents.includes(needle)) throw new Error(`${check.file} is missing ${needle}`)
  }
  for (const needle of check.mustNotInclude || []) {
    if (contents.includes(needle)) throw new Error(`${check.file} should not contain ${needle}`)
  }
}

console.log('payment/referral regression checks passed')
