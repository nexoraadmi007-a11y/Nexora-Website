export type CareerTrack = {
  slug: string
  code: string
  title: string
  shortTitle: string
  description: string
  duration: string
  price: number
  bestFor: string
  profession: string
  skills: string[]
  opportunities: string[]
  tools: string[]
  goal: string
  overview: string
  whyCompaniesHire: string[]
  outcomes: string[]
  modules: Array<{ title: string; lessons: string[] }>
  assignments: string[]
  projects: string[]
  portfolio: string[]
  applications: string[]
  capstone: string
  certificate: string
  faqs: Array<{ question: string; answer: string }>
}

export type PricingRule = {
  name: string
  minTracks: number
  maxTracks: number
  price: number
  status: 'Active' | 'Inactive'
}

export const careerTrackBasePrice = 10000

export const careerTrackPricingRules: PricingRule[] = [
  { name: 'Single Programme', minTracks: 1, maxTracks: 1, price: 10000, status: 'Active' },
]

export const skillToIncomeModule = {
  title: 'From Skill to Income',
  lessons: [
    'Choosing a market and positioning your skill',
    'Packaging a clear service offer',
    'Portfolio, CV and LinkedIn optimisation',
    'Finding clients through Instagram, Facebook, LinkedIn, Upwork and direct outreach',
    'Writing proposals, pricing, handling objections and closing',
    'Client onboarding, delivery, testimonials, retainers and referral growth',
  ],
}

export function calculateCareerTrackPricing(selectedSlugs: string[]) {
  const selectedCount = new Set(selectedSlugs).size
  const subtotal = selectedCount * careerTrackBasePrice

  return {
    selectedCount,
    subtotal,
    total: subtotal,
    discount: 0,
    ruleName: selectedCount === 0 ? 'No Programme Selected' : selectedCount === 1 ? 'Single Programme' : 'Multiple Programmes',
  }
}

export const careerAcceleratorTracks: CareerTrack[] = [
  {
    slug: 'ai-content-creation',
    code: 'NGTP-CONTENT',
    title: 'AI Content Creation',
    shortTitle: 'Content Creation',
    description: 'Learn how to think like a content professional, plan audience-led ideas, and use AI to research, write, design, publish, and measure content.',
    duration: '4 weeks',
    price: 10000,
    bestFor: 'Aspiring creators, social media managers, brand builders, freelancers, marketing assistants, and young professionals who want practical content skills.',
    profession: 'AI Content Creator / Content Operations Specialist',
    skills: ['Audience research', 'Content strategy', 'Copywriting', 'Storytelling', 'AI writing workflow', 'Visual content planning', 'Content analytics'],
    opportunities: ['AI Content Operator', 'Content Operations Specialist', 'Social Media Strategist', 'AI Copywriter', 'Creative Marketing Assistant'],
    tools: ['ChatGPT', 'Canva', 'CapCut', 'Google Trends', 'Meta Business Suite', 'Notion AI'],
    goal: 'Produce a content creator who understands audience psychology, storytelling, platform strategy, and AI-supported production.',
    overview: 'This programme helps learners move beyond random posting. Students learn how content works as a professional communication system: audience, message, format, distribution, analytics, and improvement.',
    whyCompaniesHire: ['Businesses need consistent content that supports trust and sales.', 'Teams want people who can turn ideas into publishable assets quickly.', 'Brands need creators who understand audience pain points and platform behavior.', 'Companies want AI speed with human judgment and quality control.'],
    outcomes: ['Create a practical content strategy for a brand or creator.', 'Write stronger hooks, captions, scripts, and campaign assets.', 'Use AI to speed up research, writing, design, and repurposing.', 'Measure content performance and improve future ideas.'],
    modules: [
      { title: 'Foundations of Content and Communication', lessons: ['What content actually is', 'Audience psychology and attention', 'Personas, pain points, and awareness levels', 'Content-market fit'] },
      { title: 'Storytelling and Copywriting', lessons: ['Hooks, curiosity, and narrative tension', 'AIDA, PAS, BAB, and the 4 Us', 'Voice, tone, and brand personality', 'Editing for clarity and persuasion'] },
      { title: 'Platform and Format Strategy', lessons: ['Long-form vs short-form platforms', 'SEO basics and search intent', 'Repurposing one idea into many assets', 'Building a realistic content calendar'] },
      { title: 'AI-Powered Writing Workflow', lessons: ['Prompting with role, context, constraints, and examples', 'AI for research, ideation, outlining, and drafts', 'Maintaining brand voice', 'Fact-checking and avoiding AI hallucination'] },
      { title: 'AI Visual and Multimedia Production', lessons: ['Design basics for non-designers', 'AI images for posts and thumbnails', 'Video scripting, captions, voiceover, and editing workflows', 'Quality control before publishing'] },
      { title: 'Distribution, Analytics, and Monetisation', lessons: ['What to measure and what to ignore', 'Hook rate, retention, CTR, and engagement', 'Improving content from performance data', 'Services, sponsorships, products, and affiliates'] },
      { title: skillToIncomeModule.title, lessons: skillToIncomeModule.lessons },
    ],
    assignments: ['Build a 14-day content calendar.', 'Write 10 AI-assisted content pieces in two formats.', 'Create a simple content performance report.'],
    projects: ['Brand content strategy', 'AI-assisted campaign content pack', 'Content analytics report'],
    portfolio: ['Audience persona', 'Content strategy document', 'Published/sample content assets', 'Performance report', 'Content workflow template'],
    applications: ['Social media management', 'Personal brand building', 'Small business marketing', 'Campaign content', 'Content operations'],
    capstone: 'Build a 30-day content system for a real or simulated brand, including strategy, 10 content assets across two formats, and a performance improvement report.',
    certificate: 'Certificate is issued after assignments, portfolio assets, and the final capstone are reviewed.',
    faqs: [
      { question: 'Do I need to be a designer or video editor?', answer: 'No. You will learn practical AI-supported workflows and simple design principles for content production.' },
      { question: 'Is this only for influencers?', answer: 'No. It is useful for creators, businesses, brands, social media managers, and marketing support roles.' },
      { question: 'Will AI write everything for me?', answer: 'AI supports the workflow, but you will learn how to direct, edit, verify, and improve the output.' },
    ],
  },
  {
    slug: 'ai-business',
    code: 'NGTP-BUSINESS',
    title: 'AI Business',
    shortTitle: 'AI Business',
    description: 'Learn user-centered design, interface thinking, prototyping, and AI-assisted design workflows while building a portfolio-ready product case study.',
    duration: '4 weeks',
    price: 10000,
    bestFor: 'Aspiring UI/UX designers, product-minded creatives, frontend learners, no-code builders, and digital product founders.',
    profession: 'Certified UI/UX Designer',
    skills: ['User research', 'Information architecture', 'Wireframing', 'Interface design', 'Prototyping', 'AI design prompting', 'Design handoff'],
    opportunities: ['AI UI/UX Designer', 'Product Designer', 'UX Research Assistant', 'Interface Designer', 'AI Product Design Operator'],
    tools: ['Figma', 'FigJam', 'ChatGPT', 'Canva', 'Uizard or similar AI UI tools', 'Notion'],
    goal: 'Produce a designer who thinks in terms of users, hierarchy, flows, and interactions, then uses AI to move faster without losing design judgment.',
    overview: 'This programme teaches UI/UX as problem-solving, not decoration. Learners study users, map journeys, create wireframes, design polished interfaces, prototype flows, and present a professional case study.',
    whyCompaniesHire: ['Digital products need interfaces people can understand and use.', 'Teams need designers who can explain decisions clearly.', 'Companies want faster research, wireframing, and prototyping cycles.', 'Product teams need designers who can work with developers and stakeholders.'],
    outcomes: ['Conduct practical user research and synthesize findings.', 'Create user flows, wireframes, and product screens.', 'Use AI tools to support research, ideation, critique, and prototyping.', 'Present a complete portfolio case study.'],
    modules: [
      { title: 'What UI/UX Actually Is', lessons: ['UI vs UX in simple terms', 'Design as problem-solving', 'The designer role in a product team', 'Design ethics and user-centered thinking'] },
      { title: 'User Experience Foundations', lessons: ['Interviews, surveys, personas, and empathy maps', 'User journeys and task flows', 'Information architecture', 'Usability heuristics and accessibility basics'] },
      { title: 'Design Principles', lessons: ['Hierarchy, contrast, balance, alignment, proximity, and repetition', 'Typography, color, spacing, and grids', 'Responsive design thinking', 'Good and bad interface examples'] },
      { title: 'Interface Patterns and Systems', lessons: ['Buttons, forms, navigation, cards, and modals', 'Components and design systems', 'Mobile, web, and dashboard conventions', 'Feedback states and micro-interactions'] },
      { title: 'AI as a Design Tool', lessons: ['Prompting for wireframes and UI ideas', 'Using AI for UX critique and research synthesis', 'Generating design alternatives', 'Evaluating AI output with design principles'] },
      { title: 'Prototyping, Handoff, and Case Study', lessons: ['Clickable prototypes', 'Annotations and developer handoff', 'Presenting design decisions', 'Writing a portfolio case study'] },
      { title: skillToIncomeModule.title, lessons: skillToIncomeModule.lessons },
    ],
    assignments: ['Create a user persona and user flow.', 'Design wireframes and high-fidelity screens.', 'Build a clickable prototype and case study outline.'],
    projects: ['Mobile app redesign', 'Landing page interface', 'Clickable product prototype'],
    portfolio: ['Research summary', 'User flow', 'Wireframes', 'High-fidelity screens', 'Clickable prototype', 'Case study'],
    applications: ['Mobile app design', 'Website design', 'Product redesign', 'SaaS dashboards', 'User research support'],
    capstone: 'Complete an end-to-end product design project: research summary, user flow, wireframes, high-fidelity UI, clickable prototype, and case study write-up.',
    certificate: 'Certificate is issued after completing assignments, prototype, case study, and final capstone review.',
    faqs: [
      { question: 'Do I need Figma experience?', answer: 'No. The programme introduces Figma and design thinking from beginner level.' },
      { question: 'Is this just about making beautiful screens?', answer: 'No. You will learn research, flows, usability, interface decisions, and portfolio storytelling.' },
      { question: 'Will I have portfolio work after the programme?', answer: 'Yes. The capstone is structured as a portfolio-ready case study.' },
    ],
  },
  {
    slug: 'ai-finance',
    code: 'NGTP-FIN',
    title: 'AI Finance',
    shortTitle: 'AI Finance',
    description: 'Learn financial statement thinking, analysis, forecasting, valuation logic, and AI-assisted reporting for business and investment decisions.',
    duration: '4 weeks',
    price: 10000,
    bestFor: 'Finance students, accounting graduates, analysts, SME finance operators, business owners, consultants, and young professionals interested in finance.',
    profession: 'AI Financial Analyst',
    skills: ['Financial statements', 'Ratio analysis', 'Forecasting', 'Valuation logic', 'AI-assisted modelling', 'Financial reporting', 'Dashboarding'],
    opportunities: ['AI Financial Analyst', 'Business Analyst', 'Finance Operations Analyst', 'Investment Research Assistant', 'AI Reporting Specialist'],
    tools: ['ChatGPT', 'Microsoft Excel', 'Google Sheets', 'Power BI', 'Company reports', 'Notion AI'],
    goal: 'Produce an analyst who understands financial statements, valuation logic, and business economics, then uses AI to model, analyse, validate, and report.',
    overview: 'This programme pairs finance fundamentals with AI-supported analysis. Learners understand how businesses make money, read financial statements, build simple forecasts, validate AI output, and communicate insights.',
    whyCompaniesHire: ['Businesses need people who can explain numbers clearly.', 'Leaders need analysis for pricing, cash flow, growth, and investment decisions.', 'Finance teams want faster modelling and reporting without losing accuracy.', 'Companies need analysts who can validate AI-generated financial outputs.'],
    outcomes: ['Read and interpret financial statements.', 'Analyse business performance using ratios, trends, and benchmarks.', 'Build AI-assisted forecasts and simple financial models.', 'Write executive-ready financial reports with documented validation.'],
    modules: [
      { title: 'Foundations of Finance and Business Economics', lessons: ['Financial analysis for decisions', 'Revenue models, costs, margins, and profit', 'Time value of money', 'Risk vs return'] },
      { title: 'The Three Financial Statements', lessons: ['Income statement basics', 'Balance sheet basics', 'Cash flow statement basics', 'How the statements connect', 'Reading real company financials'] },
      { title: 'Financial Analysis Techniques', lessons: ['Liquidity, profitability, efficiency, and leverage ratios', 'Trend and variance analysis', 'Industry and competitor benchmarking', 'Break-even analysis and unit economics'] },
      { title: 'Financial Modelling and Forecasting', lessons: ['Assumptions, logic, and outputs', 'Driver-based forecasting', 'Scenario and sensitivity analysis', 'Valuation basics: DCF, multiples, and comparables'] },
      { title: 'AI-Powered Analysis Workflow', lessons: ['Using AI to read reports and statements', 'Building spreadsheet models with AI assistance', 'Extracting and cleaning data', 'Prompting for better financial questions', 'Validating AI output'] },
      { title: 'Reporting and Decision Support', lessons: ['Turning analysis into insight', 'Dashboards and visualizations', 'Investment memos and executive summaries', 'Presenting numbers to non-financial audiences', 'Accuracy, ethics, and AI limitations'] },
      { title: skillToIncomeModule.title, lessons: skillToIncomeModule.lessons },
    ],
    assignments: ['Analyse a simple income statement.', 'Build a forecast from clear assumptions.', 'Write a one-page executive finance memo.'],
    projects: ['Ratio analysis workbook', 'Forecast model', 'Financial dashboard', 'Executive report'],
    portfolio: ['Financial analysis workbook', 'Forecast model', 'Dashboard screenshots', 'Executive finance memo', 'Validation notes'],
    applications: ['Business performance review', 'Investment research', 'SME finance operations', 'Budgeting and forecasting', 'Management reporting'],
    capstone: 'Complete a financial analysis of a real or sample company, including statement review, driver-based forecast, valuation estimate, and executive report.',
    certificate: 'Certificate is issued after assignments, model review, executive report, and final capstone are completed.',
    faqs: [
      { question: 'Do I need an accounting background?', answer: 'It helps, but it is not required. The programme starts with financial statement foundations.' },
      { question: 'Will this give financial advice certification?', answer: 'No. It builds practical analysis and reporting capability, not regulated financial advisory licensing.' },
      { question: 'Can business owners take it?', answer: 'Yes. It is useful for owners who want to understand pricing, profit, cash flow, and growth decisions.' },
    ],
  },
  {
    slug: 'ai-no-code',
    code: 'NGTP-AUTO',
    title: 'AI No-Code',
    shortTitle: 'AI No-Code',
    description: 'Learn how to design simple business workflows, build no-code automations, and use AI tools to reduce manual work for teams, creators, and small businesses.',
    duration: '4 weeks',
    price: 10000,
    bestFor: 'Problem-solvers, operations-minded learners, business support staff, freelancers, and young professionals who want to build practical automation solutions.',
    profession: 'AI Automation & No-Code Solutions Operator',
    skills: ['Workflow mapping', 'No-code automation', 'AI assistants', 'Forms and databases', 'CRM workflows', 'Reporting', 'Client delivery'],
    opportunities: ['AI Automation Assistant', 'No-Code Solutions Builder', 'Operations Automation Operator', 'CRM Support Assistant', 'AI Productivity Specialist'],
    tools: ['ChatGPT', 'Airtable', 'Google Forms', 'Notion', 'Zapier or Make', 'Tally or Typeform'],
    goal: 'Produce an operator who can understand repeated manual work, map the workflow, and build simple AI/no-code systems that save time and improve follow-up.',
    overview: 'This programme helps learners turn everyday operational problems into simple systems: forms, databases, automations, dashboards, reminders, AI prompts, and client-ready workflows.',
    whyCompaniesHire: ['Businesses need people who can organise data and reduce manual work.', 'Teams want faster follow-up, reporting, and admin workflows.', 'Small businesses need lightweight systems before they can hire full technical teams.', 'Companies value operators who can connect tools and document processes clearly.'],
    outcomes: ['Map a repeated workflow and identify automation opportunities.', 'Build forms, databases, and basic CRM workflows.', 'Use AI to create repeatable prompts, responses, and documentation.', 'Deliver a simple automation project with clear documentation.'],
    modules: [
      { title: 'Automation Thinking', lessons: ['What automation is and is not', 'Identifying repeated manual work', 'Inputs, actions, decisions and outputs', 'When humans must stay in the loop'] },
      { title: 'Workflow Mapping and Data Capture', lessons: ['Mapping current processes', 'Designing forms and intake flows', 'Structuring simple databases', 'Naming, statuses and ownership'] },
      { title: 'AI Assistants and Prompt Systems', lessons: ['Reusable prompts', 'AI for summaries, replies and classification', 'Quality checks and escalation rules', 'Documenting AI workflows'] },
      { title: 'No-Code Automations', lessons: ['Triggers and actions', 'Connecting forms, sheets, CRMs and messages', 'Testing automations safely', 'Handling errors and edge cases'] },
      { title: 'Dashboards and Reporting', lessons: ['Choosing useful metrics', 'Building simple dashboards', 'Weekly reporting workflows', 'Turning data into decisions'] },
      { title: skillToIncomeModule.title, lessons: skillToIncomeModule.lessons },
    ],
    assignments: ['Map one manual workflow.', 'Build a form-to-database workflow.', 'Create one tested automation and a simple dashboard.'],
    projects: ['Lead capture workflow', 'Customer follow-up tracker', 'Simple automation dashboard'],
    portfolio: ['Workflow map', 'Automation build notes', 'Screenshots or demo link', 'Dashboard sample', 'Client handover checklist'],
    applications: ['Small business CRM', 'Follow-up automation', 'Reporting systems', 'Admin operations', 'Client onboarding workflows'],
    capstone: 'Build a complete mini operating workflow for a real or simulated business: intake form, database, automation, dashboard, and handover documentation.',
    certificate: 'Certificate is issued after assignments, automation test evidence, documentation, and final capstone review.',
    faqs: [
      { question: 'Do I need to code?', answer: 'No. The track focuses on no-code and AI-assisted systems, with clear process thinking first.' },
      { question: 'Can I use this for freelance work?', answer: 'Yes. The shared From Skill to Income module helps you package automation services responsibly.' },
      { question: 'Will I build a real workflow?', answer: 'Yes. The capstone requires a working workflow with documentation.' },
    ],
  },
]

export function getCareerTrack(slug: string) {
  return careerAcceleratorTracks.find((track) => track.slug === slug)
}
