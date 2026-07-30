export type CourseTrack = {
  slug: string
  name: string
  goal: string
  overview: string
  skills: string[]
  objectives: string[]
  modules: Array<{ title: string; lessons: string[] }>
  capstone: string
  whoFor: string[]
  outcomes: string[]
  careers: string[]
  price: number
}

export const aiAcceleratorTracks: CourseTrack[] = [
  {
    slug: 'ai-content-creation',
    name: 'AI Content Creation',
    goal: 'Produce a content creator who understands audience psychology, storytelling, and platform strategy, and uses AI to research, write, design, and produce content at professional speed.',
    overview: 'A professional content operations track for learners who want to build AI-assisted content engines across writing, visuals, multimedia, distribution, analytics, and monetisation.',
    skills: ['Audience psychology', 'Storytelling', 'Copywriting', 'Platform strategy', 'AI writing workflows', 'AI visual production', 'Analytics and monetisation'],
    objectives: ['Design content around audience awareness and pain points.', 'Use copywriting frameworks to create persuasive assets.', 'Build AI-assisted writing, design, and multimedia workflows.', 'Measure performance and improve content using data.'],
    modules: [
      { title: 'Foundations of Content & Communication', lessons: ['What content actually is: value exchange between creator and audience', 'The psychology of attention: hooks, curiosity gaps, pattern interrupts', 'Audience theory: personas, pain points, awareness levels', 'The content-market fit concept'] },
      { title: 'Storytelling & Copywriting Principles', lessons: ['Narrative structure: setup, tension, resolution', 'Classic copywriting frameworks: AIDA, PAS, BAB, the 4 Us', 'Voice and tone: how brands sound different on purpose', 'Persuasion principles: social proof, authority, scarcity, reciprocity', 'Clarity over cleverness: readability, rhythm, and editing'] },
      { title: 'Platform & Format Strategy', lessons: ['How long-form and short-form platforms think', 'SEO fundamentals: search intent, keywords, on-page structure', 'Content repurposing: one idea into ten assets', 'Content calendars and consistency systems'] },
      { title: 'AI-Powered Writing & Ideation', lessons: ['Prompt engineering for content: role, context, constraints, examples', 'Using AI for research, angle generation, and outlining', 'Drafting with AI and editing with human judgment', 'Maintaining brand voice with style guides and custom instructions', 'Fact-checking and avoiding AI hallucination in published work'] },
      { title: 'AI Visual & Multimedia Production', lessons: ['AI image generation for thumbnails, graphics, and social posts', 'AI video tools: script-to-video, avatars, voiceovers, subtitles', 'AI audio: voice cloning, podcast editing, music', 'Design basics for non-designers: hierarchy, contrast, whitespace'] },
      { title: 'Distribution, Analytics & Monetisation', lessons: ['Reading analytics: what to measure and what to ignore', 'Iterating content based on hook rates, retention, and CTR', 'Monetisation models: services, sponsorships, products, affiliates', 'Building an AI-powered content engine end to end'] },
    ],
    capstone: 'Build a 30-day content system for a real or simulated brand: strategy document, 10 published pieces across 2 formats, and a performance report.',
    whoFor: ['Aspiring content creators', 'Social media managers', 'Brand builders', 'Freelancers', 'Marketing assistants'],
    outcomes: ['Plan a platform-aware content strategy.', 'Create copy and multimedia assets with AI.', 'Build a repeatable 30-day content system.', 'Report performance and monetisation opportunities.'],
    careers: ['AI Content Operator', 'Content Operations Specialist', 'Social Media Strategist', 'AI Copywriter', 'Creative Marketing Assistant'],
    price: 25000,
  },
  {
    slug: 'ui-ux-designer',
    name: 'Certified UI/UX Designer (AI-Powered)',
    goal: 'Produce a designer who thinks in terms of users, hierarchy, and interaction, and uses AI to research, wireframe, design, and prototype.',
    overview: 'A design track that teaches user-centred thinking first, then uses AI tools to accelerate research, wireframing, high-fidelity UI, prototyping, testing, and case-study development.',
    skills: ['User research', 'Information architecture', 'Design principles', 'Interface patterns', 'AI design prompting', 'Prototyping', 'Design handoff'],
    objectives: ['Explain UI, UX, and the role of design in product teams.', 'Research users and translate findings into flows and interfaces.', 'Use design principles to evaluate AI-generated UI.', 'Create a portfolio-ready product design case study.'],
    modules: [
      { title: 'What UI/UX Actually Is', lessons: ['UI vs UX: the interface vs the experience', 'Design as problem-solving, not decoration', 'The role of the designer in a product team', 'Evolution from print to web, mobile, and AI-native design'] },
      { title: 'User Experience Foundations', lessons: ['User-centred design thinking', 'User research methods: interviews, surveys, personas, empathy maps', 'User journeys and task flows', 'Information architecture: sitemaps, navigation, mental models', 'Usability heuristics and WCAG accessibility basics'] },
      { title: 'Principles & Elements of Design', lessons: ['Elements: line, shape, colour, texture, space, form, typography', 'Principles: hierarchy, contrast, balance, alignment, proximity, repetition, whitespace', 'Colour theory and palette building', 'Typography, scale, readability, and line height', 'Grids, responsive thinking, and Gestalt principles'] },
      { title: 'Interface Design Patterns', lessons: ['Buttons, forms, cards, navigation, and modals', 'Design systems: tokens, components, consistency', 'Mobile, web, and desktop conventions', 'Micro-interactions and feedback states', 'Dark patterns and ethical design'] },
      { title: 'AI as Your Design Tool', lessons: ['Prompt-to-UI tools, AI wireframing, and AI image generation', 'Writing design prompts with hierarchy, spacing, colour, and mood', 'Generating wireframes and high-fidelity screens with AI', 'Critiquing and refining designs conversationally', 'AI-assisted user research, synthesis, and usability evaluation'] },
      { title: 'Prototyping, Handoff & the Design Process', lessons: ['Clickable prototypes with AI tools', 'Design documentation: specs, annotations, edge cases', 'Working with developers and design-to-code with AI', 'Presenting and defending design decisions'] },
    ],
    capstone: 'Complete an end-to-end product design: research summary, personas, user flows, wireframes, high-fidelity UI, clickable prototype, and case study write-up.',
    whoFor: ['Aspiring UI/UX designers', 'Product-minded creatives', 'Frontend learners', 'No-code builders', 'Digital product founders'],
    outcomes: ['Conduct practical user research.', 'Design usable AI-assisted product interfaces.', 'Build prototypes and handoff documentation.', 'Present a professional design case study.'],
    careers: ['AI UI/UX Designer', 'Product Designer', 'UX Research Assistant', 'Interface Designer', 'AI Product Design Operator'],
    price: 25000,
  },
  {
    slug: 'ai-financial-analyst',
    name: 'AI Financial Analyst',
    goal: 'Produce an analyst who understands financial statements, valuation, and business economics, and uses AI to model, analyse, and report.',
    overview: 'A finance analysis track that pairs financial fundamentals with AI-assisted modelling, data extraction, dashboarding, market research, memo writing, and executive reporting.',
    skills: ['Financial statements', 'Ratio analysis', 'Forecasting', 'Valuation logic', 'AI model assistance', 'Financial reporting', 'Dashboarding'],
    objectives: ['Understand how businesses make money and how financial statements connect.', 'Analyse company performance using ratios, trends, and benchmarks.', 'Use AI to assist modelling, extraction, research, and reporting.', 'Validate numbers and produce decision-ready executive reports.'],
    modules: [
      { title: 'Foundations of Finance & Business Economics', lessons: ['Financial analysis for decisions, not spreadsheets', 'Revenue models, costs, margins', 'Time value of money, interest, and discounting', 'Risk vs return'] },
      { title: 'The Three Financial Statements', lessons: ['Income statement: revenue, COGS, expenses, profit layers', 'Balance sheet: assets, liabilities, equity', 'Cash flow statement: why profit is not cash', 'How the statements link together', 'Reading real company financials'] },
      { title: 'Financial Analysis Techniques', lessons: ['Liquidity, profitability, efficiency, and leverage ratios', 'Trend and variance analysis', 'Industry and competitor benchmarking', 'Break-even analysis and unit economics', 'Working capital and cash management'] },
      { title: 'Financial Modelling & Forecasting Principles', lessons: ['Assumptions to logic to outputs', 'Three-statement model structure', 'Top-down, bottom-up, and driver-based forecasting', 'Scenario and sensitivity analysis', 'Valuation fundamentals: DCF, multiples, comparables'] },
      { title: 'AI-Powered Analysis Workflow', lessons: ['Using AI to read statements, filings, and reports', 'Building models and spreadsheets with AI assistance', 'Data cleaning and extraction from reports', 'Prompting for the right financial questions', 'Validating AI output and catching flawed logic', 'AI for market research and competitor analysis'] },
      { title: 'Reporting, Communication & Decision Support', lessons: ['Turning analysis into insight', 'Dashboards and visualisations with AI', 'Investment memos, board reports, and executive summaries', 'Presenting numbers to non-financial audiences', 'Ethics, accuracy, and the limits of AI in financial advice'] },
    ],
    capstone: 'Complete a full financial analysis of a real company: statement analysis, driver-based forecast model, valuation estimate, and executive report with documented validation steps.',
    whoFor: ['Finance students', 'Analysts', 'SME finance operators', 'Business owners', 'Consultants'],
    outcomes: ['Analyse financial statements and business economics.', 'Build AI-assisted models and forecasts.', 'Validate AI-generated financial outputs.', 'Create executive-ready finance reports.'],
    careers: ['AI Financial Analyst', 'Business Analyst', 'Finance Operations Analyst', 'Investment Research Assistant', 'AI Reporting Specialist'],
    price: 25000,
  },
]

export const businessTransformationTracks: CourseTrack[] = [
  {
    slug: 'idea-to-mvp-certification',
    name: 'Idea to MVP Certification Program (ICP)',
    goal: 'Take a learner from raw idea to a validated, launched MVP using AI for research, design, building, and launch instead of large teams and budgets.',
    overview: 'A founder and product-builder pathway for validating ideas, scoping MVPs, building with AI, launching publicly, and interpreting early traction.',
    skills: ['Entrepreneurial thinking', 'Customer discovery', 'AI market research', 'MVP scoping', 'AI product building', 'Launch strategy', 'Traction analysis'],
    objectives: ['Separate problems from ideas and validate before building.', 'Use AI for market research, positioning, and product specs.', 'Build a functional MVP using AI-first tools.', 'Launch, measure, and report traction or learning.'],
    modules: [
      { title: 'Foundations of Entrepreneurial Thinking', lessons: ['Problems vs ideas: why solutions come second', 'Jobs-to-be-done', 'Market sizing: TAM, SAM, SOM', 'Lean startup: build-measure-learn'] },
      { title: 'Idea Validation Before Building', lessons: ['Customer discovery and The Mom Test principles', 'AI market research, competitor mapping, and demand signals', 'Value proposition and positioning', 'Validation experiments: landing pages, waitlists, pre-sales, smoke tests', 'Kill criteria for pivoting or stopping'] },
      { title: 'MVP Strategy & Scoping', lessons: ['What minimum viable really means', 'Concierge, Wizard of Oz, single-feature, no-code, and landing-page MVPs', 'User stories, MoSCoW, and one-metric-that-matters', 'Writing a product spec AI can build from'] },
      { title: 'Building the MVP with AI', lessons: ['AI coding, no-code, and design tools', 'Designing the product with AI', 'Building functional prototypes and apps', 'Setting up payments, auth, and data', 'Testing before users touch the MVP'] },
      { title: 'Launch & Early Traction', lessons: ['Soft launch, communities, and launch platforms', 'AI-powered content, copy, ads, and outreach', 'Analytics and feedback loops', 'Talking to early users and iterating fast'] },
      { title: 'From MVP to Business', lessons: ['Retention, activation, and willingness to pay', 'Pricing fundamentals and early monetisation', 'Pivot/persevere decision framework', 'Pitching narrative, deck structure, and AI-assisted pitch creation'] },
    ],
    capstone: 'Take one idea through the full pipeline: validation evidence, product spec, working MVP built with AI, public launch, and traction/learning report. Certification requires a live, testable product.',
    whoFor: ['Founders', 'Business owners', 'Startup teams', 'Product builders', 'No-code and AI builders'],
    outcomes: ['Validate an idea before investing heavily.', 'Write a build-ready product specification.', 'Launch a live MVP with AI assistance.', 'Measure early traction and decide next steps.'],
    careers: ['Startup Founder', 'AI Product Builder', 'No-Code MVP Specialist', 'Product Operations Associate', 'Innovation Associate'],
    price: 5000,
  },
  {
    slug: 'business-operations-systems',
    name: 'Business Operations Systems (BOS)',
    goal: 'Teach learners to think in systems and processes, then design, document, and automate business operations using AI.',
    overview: 'An operations intelligence track for mapping value chains, documenting SOPs, designing KPIs, building dashboards, automating workflows, and managing operating systems.',
    skills: ['Systems thinking', 'Process mapping', 'SOP documentation', 'KPI design', 'Operational intelligence', 'AI workflow automation', 'Change management'],
    objectives: ['Diagnose business operations as systems.', 'Document processes and responsibilities clearly.', 'Design metrics and dashboards for weekly management.', 'Build AI automations with human quality control.'],
    modules: [
      { title: 'Systems Thinking for Business', lessons: ['Inputs, processes, outputs, and feedback loops', 'People-dependent vs process-dependent operations', 'Value chain mapping', 'Bottlenecks, constraints, and flow'] },
      { title: 'Process Design & Documentation', lessons: ['Flowcharts, swimlanes, and SIPOC', 'SOPs that people actually follow', 'RACI roles and responsibilities', 'Standardisation vs flexibility', 'Using AI to document and map processes from interviews or recordings'] },
      { title: 'Core Business Operating Functions', lessons: ['Sales and customer acquisition operations', 'Fulfilment and service delivery operations', 'Finance and admin operations', 'People operations', 'Management operating rhythm: meetings, dashboards, reviews'] },
      { title: 'Metrics & Operational Intelligence', lessons: ['Leading vs lagging indicators', 'Designing KPIs for each function', 'Dashboards and scorecards for weekly leadership visibility', 'Using AI to analyse operational data and surface insights'] },
      { title: 'AI Automation of Operations', lessons: ['Eliminate, simplify, automate', 'Mapping what AI or automation should own vs humans', 'Automation platforms, AI agents, and tool integrations', 'Automating communication, support, follow-ups, and scheduling', 'Automating reports, proposals, data entry, and CRM updates', 'Human-in-the-loop quality control'] },
      { title: 'Implementing & Managing the Operating System', lessons: ['Change management and adoption', 'Piloting, iterating, and safe rollout', 'Maintaining systems through audits, updates, and ownership', 'Building the business operating manual'] },
    ],
    capstone: 'Design a complete operating system for a real or case-study business: value chain map, SOPs for 3+ core functions, KPI dashboard, and at least 3 working AI automations compiled into an operating manual.',
    whoFor: ['Business owners', 'Operations managers', 'SME teams', 'Consultants', 'Process improvement learners'],
    outcomes: ['Map a business value chain and operating rhythm.', 'Document SOPs and responsibilities.', 'Build KPI dashboards and scorecards.', 'Implement AI automations safely.'],
    careers: ['Business Operations Analyst', 'Operations Manager', 'AI Automation Consultant', 'Process Improvement Specialist', 'Business Systems Designer'],
    price: 5000,
  },
  {
    slug: 'business-auditing-bottleneck-analysis',
    name: 'Business Auditing & Bottleneck Analysis (BABA)',
    goal: 'Produce a consultant-grade analyst who can diagnose any business, find money, time, and opportunity leaks, and use AI to accelerate audits and prescribe fixes.',
    overview: 'A consulting-grade track for business diagnosis, audit scoping, data gathering, functional deep-dives, AI-accelerated analysis, bottleneck discovery, and client-ready reporting.',
    skills: ['Business diagnosis', 'Root-cause analysis', 'Audit scoping', 'Functional audits', 'AI analysis', 'Bottleneck analysis', 'Consulting reports'],
    objectives: ['Think like an auditor using evidence over opinion.', 'Apply diagnostic frameworks to find bottlenecks.', 'Use AI to analyse data, interviews, and processes faster.', 'Deliver a professional 90-day improvement roadmap.'],
    modules: [
      { title: 'Foundations of Business Diagnosis', lessons: ['Auditor and consultant mindset: evidence over opinion', 'How value flows through a business and where it leaks', 'Financial, operational, marketing, sales, process, and digital audits', 'First-principles questioning and root-cause thinking'] },
      { title: 'Frameworks for Analysis', lessons: ['Theory of Constraints', '5 Whys and fishbone diagrams', 'SWOT, gap analysis, and maturity models', '80/20 principle in diagnosis', 'Unit economics as a diagnostic lens'] },
      { title: 'The Audit Process', lessons: ['Scoping objectives, stakeholders, and boundaries', 'Data gathering through documents, interviews, observation, and systems', 'Interviewing techniques that surface real problems', 'Evidence standards: symptoms, causes, anecdotes', 'Structuring findings: issue, evidence, impact, recommendation'] },
      { title: 'Functional Deep-Dive Audits', lessons: ['Financial audit basics: margin leaks, cost structure, cash flow', 'Sales and marketing audit: funnel, conversion, CAC/LTV', 'Operations audit: efficiency, capacity, quality, delivery', 'People and organisation audit', 'Technology and data audit'] },
      { title: 'AI-Accelerated Auditing', lessons: ['AI analysis of financials, spreadsheets, and operational data', 'Transcription, theming, and insight extraction from interviews', 'Process mining with AI', 'Benchmarking with AI research', 'Building and validating bottleneck hypotheses', 'Guarding against AI errors in audits'] },
      { title: 'Recommendations, Reporting & Consulting Engagement', lessons: ['Prioritising fixes by impact and effort', 'Audit report: executive summary, findings, roadmap', 'Presenting to owners and executives with evidence', 'Designing a 90-day improvement roadmap', 'Pricing and packaging audit services'] },
    ],
    capstone: 'Conduct a full audit of a real or case-study business: scoped engagement, data collection, bottleneck analysis, and a professional audit report with a prioritised 90-day improvement roadmap delivered as a client-ready presentation.',
    whoFor: ['Consultants', 'Business analysts', 'Operations leaders', 'SME advisors', 'Growth and strategy operators'],
    outcomes: ['Scope and run a structured business audit.', 'Identify bottlenecks and root causes.', 'Use AI to accelerate analysis while validating evidence.', 'Present a client-ready improvement roadmap.'],
    careers: ['Business Transformation Consultant', 'Business Auditor', 'Bottleneck Analyst', 'Process Improvement Consultant', 'Operations Strategy Analyst'],
    price: 5000,
  },
]
