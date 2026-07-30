const baseUrl = process.env.NEXORA_TEST_BASE_URL || 'http://127.0.0.1:3000'
const adminSecret = process.env.GROWTH_ADMIN_SECRET || process.env.NEXORA_TEST_ADMIN_SECRET

if (!adminSecret) {
  console.error('Set GROWTH_ADMIN_SECRET or NEXORA_TEST_ADMIN_SECRET before running this regression script.')
  process.exit(1)
}

const forbidden = [
  'missing valid contact path',
  'contactability',
  'source url',
  'lead qualification',
  'before outreach',
  'public profile',
  'confirm from the official page',
]

const cases = [
  {
    name: 'Career price from approved knowledge',
    body: { mode: 'conversation', text: 'How much is the Career Accelerator?', prospectReference: 'test-career-price' },
    expectIntent: 'PRICE_QUERY',
    mustInclude: ['NGN 25,000'],
    mustNotInclude: ['NGN 10,000'],
  },
  {
    name: 'Business price from approved knowledge',
    body: { mode: 'conversation', text: 'How much is the business programme?', prospectReference: 'test-business-price' },
    expectIntent: 'PRICE_QUERY',
    mustInclude: ['NGN 35,000', '4 weeks'],
    mustNotInclude: ['Career Accelerator'],
  },
  {
    name: 'Business enquiry uses business knowledge',
    body: { mode: 'conversation', text: 'I sell skincare products on Instagram. What exactly can Nexora do for me?', prospectReference: 'test-business-owner' },
    mustInclude: ['business', 'assessment'],
    mustNotInclude: ['AI Content Creation', 'UI/UX', 'Financial Analyst'],
  },
  {
    name: 'Ambiguous enquiry asks clarifying question',
    body: { mode: 'conversation', text: 'I want to know more', prospectReference: 'test-ambiguous' },
    mustInclude: ['career skill', 'business'],
  },
  {
    name: 'Selected track persists in session',
    sequence: [
      { mode: 'conversation', text: 'Which path should I choose?', prospectReference: 'test-session-track' },
      { mode: 'conversation', text: 'AI Content Creation', prospectReference: 'test-session-track' },
      { mode: 'conversation', text: 'How much is it?', prospectReference: 'test-session-track' },
    ],
    mustInclude: ['AI Content Creation', 'NGN 25,000'],
    mustNotInclude: ['Which path'],
  },
  {
    name: 'Not interested is respected',
    body: { mode: 'conversation', text: "I'm not interested", prospectReference: 'test-not-interested' },
    expectIntent: 'NOT_INTERESTED',
    mustInclude: ['No problem'],
  },
]

async function call(body) {
  const response = await fetch(`${baseUrl}/api/growth/copilot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-nexora-admin-secret': adminSecret,
    },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok || !data.ok) throw new Error(data.error || `Request failed with ${response.status}`)
  return data
}

function assertCase(condition, message) {
  if (!condition) throw new Error(message)
}

const results = []

for (const test of cases) {
  try {
    let data
    if (test.sequence) {
      for (const step of test.sequence) data = await call(step)
    } else {
      data = await call(test.body)
    }
    const output = `${data.formatted || ''} ${data.replyToSend || ''} ${data.nextBestAction || ''}`.toLowerCase()
    assertCase(!forbidden.some((term) => output.includes(term)), 'Forbidden lead-analysis wording appeared.')
    if (test.expectIntent) assertCase(data.detectedIntent === test.expectIntent, `Expected ${test.expectIntent}, got ${data.detectedIntent}`)
    for (const item of test.mustInclude || []) assertCase(output.includes(item.toLowerCase()), `Missing expected text: ${item}`)
    for (const item of test.mustNotInclude || []) assertCase(!output.includes(item.toLowerCase()), `Unexpected text present: ${item}`)
    results.push({ name: test.name, ok: true })
  } catch (error) {
    results.push({ name: test.name, ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

console.table(results)
if (results.some((item) => !item.ok)) process.exit(1)
