export const landingProgrammes = [
  {
    code: 'AI_ACCELERATOR',
    name: 'AI Accelerator Program',
    audience: 'Students, graduates and professionals',
    problem: 'Knowing about AI is different from using it in real work.',
    outcome: 'Build practical capability in a focused track.',
    priceNgn: 10_000,
    priceUnit: 'per track',
    tracks: [
      { code: 'AI_FINANCE', name: 'Business Analysis with AI', summary: 'Use AI and analysis methods to understand business needs and decisions.' },
      { code: 'AI_NO_CODE', name: 'AI No-Code & Vibe Coding', summary: 'Build useful websites and workflows with AI-assisted tools.' },
      { code: 'AI_CONTENT_CREATION', name: 'AI Content Creation', summary: 'Plan, create and publish content with modern AI tools.' },
    ],
  },
  {
    code: 'BUSINESS_TRANSFORMATION',
    name: 'Business Transformation Program',
    audience: 'Business owners and teams',
    problem: 'Adopting AI at work requires a clear process and the right skills.',
    outcome: 'Explore practical ways to improve everyday business work.',
    priceNgn: 25_000,
    priceUnit: 'for the program',
    tracks: [],
  },
] as const
