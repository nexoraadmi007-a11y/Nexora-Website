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

const runId = Date.now()

const cases = [
  {
    name: 'Comparison A - Direct comparison',
    body: { mode: 'conversation', text: 'Which would you suggest for me between AI Financial Analyst and Business Transformation?', prospectReference: `compare-a-${runId}` },
    expectIntent: 'PROGRAMME_COMPARISON',
    mustInclude: ['different problems', 'financial analyst', 'business transformation', 'which is more urgent'],
    mustNotInclude: ['Great choice', 'currently costs NGN 10,000', 'registration link'],
    expectSelectedTrack: '',
  },
  {
    name: 'Comparison B - Mixed identity',
    body: { mode: 'conversation', text: 'I own a fashion business, but I also want to become a financial analyst.', prospectReference: `compare-b-${runId}` },
    expectIntent: 'CAREER_AND_BUSINESS_INTEREST',
    mustInclude: ['both goals', 'different problems', 'business', 'finance career'],
    mustNotInclude: ['Great choice', 'registration link'],
  },
  {
    name: 'Comparison C - Immediate business priority',
    sequence: [
      { mode: 'conversation', text: 'I own an active business. My main income currently comes from the business. The business has weak customer and sales systems.', prospectReference: `compare-c-${runId}` },
      { mode: 'conversation', text: 'Which should I start with?', prospectReference: `compare-c-${runId}` },
    ],
    expectIntent: 'PRIORITY_DECISION',
    mustInclude: ['Business Transformation first', 'active', 'sales'],
  },
  {
    name: 'Comparison D - Immediate career priority',
    sequence: [
      { mode: 'conversation', text: 'I want an entry-level finance role. The business idea is secondary and not actively operating.', prospectReference: `compare-d-${runId}` },
      { mode: 'conversation', text: 'Which should I start with?', prospectReference: `compare-d-${runId}` },
    ],
    expectIntent: 'PRIORITY_DECISION',
    mustInclude: ['AI Financial Analyst first', 'finance role'],
  },
  {
    name: 'Comparison E - Can I do both',
    body: { mode: 'conversation', text: 'Can I do both?', prospectReference: `compare-e-${runId}` },
    expectIntent: 'COMBINATION_ENQUIRY',
    mustInclude: ['take both', 'one after the other', 'which result do you need first'],
    mustNotInclude: ['simultaneous'],
  },
  {
    name: 'Comparison F - Confirmed selection',
    body: { mode: 'conversation', text: 'I have decided to go with AI Financial Analyst.', prospectReference: `compare-f-${runId}` },
    mustInclude: ['AI Financial Analyst', 'NGN 10,000'],
    expectSelectedTrack: 'AI Financial Analyst',
  },
  {
    name: 'Test A - Career Accelerator enquiry',
    body: { mode: 'conversation', text: 'tell me more about AI Career Accelerator program', prospectReference: 'test-a-career-enquiry' },
    mustInclude: ['Career Accelerator', 'AI Content Creation', 'UI/UX', 'Financial Analyst', 'NGN 10,000'],
    mustNotInclude: ['Business Transformation', 'business assessment', 'customer database', 'business systems'],
  },
  {
    name: 'Test B - AI Content Creation selection',
    body: { mode: 'conversation', text: 'I am interested in AI Content Creation', prospectReference: 'test-b-content-track' },
    mustInclude: ['AI Content Creation', 'NGN 10,000'],
    mustNotInclude: ['Business Transformation', 'business assessment', 'customer database'],
  },
  {
    name: 'Test C - Career affordability objection',
    sequence: [
      { mode: 'conversation', text: 'tell me more about AI Career Accelerator program', prospectReference: 'test-c-career-affordability' },
      { mode: 'conversation', text: "I don't have money now", prospectReference: 'test-c-career-affordability' },
    ],
    expectIntent: 'AFFORDABILITY_OBJECTION',
    mustInclude: ['NGN 10,000', 'available right now', 'worth it'],
    mustNotInclude: ['Business Transformation', 'business assessment', 'customer management', 'website', 'NGN 35,000'],
  },
  {
    name: 'Test D - Business Transformation enquiry',
    body: { mode: 'conversation', text: 'tell me more about Business Transformation program', prospectReference: 'test-d-business-enquiry' },
    mustInclude: ['Business Transformation', 'NGN 35,000', '4 weeks', 'business owners'],
    mustNotInclude: ['AI Content Creation', 'UI/UX', 'Financial Analyst'],
  },
  {
    name: 'Test E - Switch from business to career',
    sequence: [
      { mode: 'conversation', text: 'tell me more about Business Transformation program', prospectReference: 'test-e-switch' },
      { mode: 'conversation', text: 'tell me more about AI Career Accelerator program', prospectReference: 'test-e-switch' },
    ],
    mustInclude: ['Career Accelerator', 'NGN 10,000', 'AI Content Creation'],
    mustNotInclude: ['Business Transformation Programme can help', 'business assessment', 'customer database'],
  },
  {
    name: 'Test F - Switch from career to business',
    sequence: [
      { mode: 'conversation', text: 'tell me more about AI Career Accelerator program', prospectReference: 'test-f-switch' },
      { mode: 'conversation', text: 'I run a skincare business and want to know about the business programme', prospectReference: 'test-f-switch' },
    ],
    mustInclude: ['business', 'skincare', 'assessment'],
    mustNotInclude: ['AI Content Creation', 'Financial Analyst'],
  },
  {
    name: 'Test G - Ambiguous price question without session',
    body: { mode: 'conversation', text: 'how much does it cost?', prospectReference: `test-g-ambiguous-${runId}` },
    expectIntent: 'PRICE_QUERY',
    mustInclude: ['Career Accelerator', 'Business Transformation'],
    mustNotInclude: ['NGN 10,000', 'NGN 35,000'],
  },
  {
    name: 'Test H - Career price question with context',
    sequence: [
      { mode: 'conversation', text: 'tell me more about AI Career Accelerator program', prospectReference: 'test-h-career-price' },
      { mode: 'conversation', text: 'how much does it cost?', prospectReference: 'test-h-career-price' },
    ],
    expectIntent: 'PRICE_QUERY',
    mustInclude: ['NGN 10,000'],
    mustNotInclude: ['NGN 25,000'],
  },
  {
    name: 'Test I - Business price question with context',
    sequence: [
      { mode: 'conversation', text: 'tell me more about Business Transformation program', prospectReference: 'test-i-business-price' },
      { mode: 'conversation', text: 'how much does it cost?', prospectReference: 'test-i-business-price' },
    ],
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
    mustInclude: ['Career Accelerator', 'Business Transformation'],
  },
  {
    name: 'Selected track persists in session',
    sequence: [
      { mode: 'conversation', text: 'Which path should I choose?', prospectReference: 'test-session-track' },
      { mode: 'conversation', text: 'AI Content Creation', prospectReference: 'test-session-track' },
      { mode: 'conversation', text: 'How much is it?', prospectReference: 'test-session-track' },
    ],
    mustInclude: ['AI Content Creation', 'NGN 10,000'],
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
    if ('expectSelectedTrack' in test) assertCase((data.selectedTrack || '') === test.expectSelectedTrack, `Expected selectedTrack "${test.expectSelectedTrack}", got "${data.selectedTrack || ''}"`)
    for (const item of test.mustInclude || []) assertCase(output.includes(item.toLowerCase()), `Missing expected text: ${item}`)
    for (const item of test.mustNotInclude || []) assertCase(!output.includes(item.toLowerCase()), `Unexpected text present: ${item}`)
    results.push({ name: test.name, ok: true })
  } catch (error) {
    results.push({ name: test.name, ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}

console.table(results)
if (results.some((item) => !item.ok)) process.exit(1)
