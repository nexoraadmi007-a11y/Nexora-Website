export type CareerTrack = {
  slug: string
  title: string
  shortTitle: string
  description: string
  duration: string
  price: number
  bestFor: string
  skills: string[]
  opportunities: string[]
  tools: string[]
  goal: string
  overview: string
  whyCompaniesHire: string[]
  outcomes: string[]
  modules: Array<{ title: string; lessons: string[] }>
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

export const careerTrackBasePrice = 25000

export const careerTrackPricingRules: PricingRule[] = [
  { name: 'Single Track', minTracks: 1, maxTracks: 1, price: 25000, status: 'Active' },
  { name: 'Two Track Bundle', minTracks: 2, maxTracks: 2, price: 40000, status: 'Active' },
]

export function calculateCareerTrackPricing(selectedSlugs: string[]) {
  const selectedCount = new Set(selectedSlugs).size
  const activeRules = careerTrackPricingRules.filter((rule) => rule.status === 'Active')
  const exactRule = activeRules.find((rule) => selectedCount >= rule.minTracks && selectedCount <= rule.maxTracks)
  const twoTrackRule = activeRules.find((rule) => rule.minTracks === 2 && rule.maxTracks === 2)
  const subtotal = selectedCount * careerTrackBasePrice
  const total = selectedCount === 0
    ? 0
    : exactRule
      ? exactRule.price
      : twoTrackRule && selectedCount > 2
        ? twoTrackRule.price + ((selectedCount - 2) * careerTrackBasePrice)
        : subtotal

  return {
    selectedCount,
    subtotal,
    total,
    discount: Math.max(subtotal - total, 0),
    ruleName: selectedCount === 0 ? 'No Track Selected' : exactRule?.name || (twoTrackRule && selectedCount > 2 ? 'Two Track Bundle + Extra Tracks' : 'Standard Track Pricing'),
  }
}

export const careerAcceleratorTracks: CareerTrack[] = [
  {
    slug: 'ai-powered-data-analyst',
    title: 'AI-Powered Data Analyst',
    shortTitle: 'Data Analyst',
    description: 'Learn how to turn raw business data into reports, dashboards, and clear decisions using Excel, Power BI, SQL basics, and AI assistants.',
    duration: '4 weeks',
    price: 25000,
    bestFor: 'NYSC members, graduates, and young professionals who like numbers, business problems, reports, and decision-making.',
    skills: ['Excel analysis', 'Power BI dashboards', 'Data cleaning', 'SQL basics', 'AI-assisted reporting', 'Business insight writing'],
    opportunities: ['Data Analyst', 'Business Analyst', 'Reporting Assistant', 'Operations Analyst', 'AI Data Support Officer'],
    tools: ['ChatGPT', 'Microsoft Excel', 'Power BI', 'Google Sheets', 'SQL practice tools', 'Notion AI'],
    goal: 'Train students to collect, clean, analyse, visualise, and explain data in a way that helps teams make better decisions.',
    overview: 'This track is for people who want a practical data career but do not want to start with heavy mathematics or complex programming. Students learn how companies use data every day: sales reports, customer trends, operational issues, financial summaries, and performance dashboards.',
    whyCompaniesHire: ['They need people who can explain what the numbers mean.', 'They want dashboards that managers can use quickly.', 'They need analysts who can clean messy spreadsheets and reduce manual reporting.', 'They want entry-level talent that can use AI without losing accuracy.'],
    outcomes: ['Clean and structure messy datasets.', 'Build useful dashboards in Excel and Power BI.', 'Use AI to speed up analysis while checking for mistakes.', 'Write simple reports that explain business problems and recommendations.'],
    modules: [
      { title: 'Data Thinking for Business', lessons: ['What data analysts actually do at work', 'Common business questions data can answer', 'Metrics, KPIs, dimensions, and measures', 'How to ask better questions before opening a spreadsheet'] },
      { title: 'Spreadsheet Analysis', lessons: ['Cleaning rows, columns, duplicates, and missing values', 'Useful Excel formulas for analysis', 'Pivot tables and summary reports', 'Using AI to explain formulas and check logic'] },
      { title: 'Data Visualisation', lessons: ['Choosing the right chart for the message', 'Dashboard layout, filters, and readability', 'Power BI basics', 'Avoiding misleading charts'] },
      { title: 'SQL and Data Sources', lessons: ['Tables, records, and relationships', 'SELECT, WHERE, GROUP BY, and JOIN in plain English', 'Connecting data sources', 'Using AI to draft and explain queries'] },
      { title: 'AI Analysis Workflow', lessons: ['Prompting AI with clean context', 'Summarising datasets safely', 'Finding patterns and anomalies', 'Validating AI output before sharing'] },
      { title: 'Business Reporting', lessons: ['Turning findings into insight', 'Writing executive summaries', 'Presenting recommendations', 'Building a data portfolio case study'] },
    ],
    projects: ['Sales performance dashboard', 'Customer segmentation report', 'Operations KPI tracker'],
    portfolio: ['Cleaned dataset', 'Power BI dashboard', 'Insight report', 'Recorded dashboard walkthrough'],
    applications: ['Sales analysis', 'Customer reporting', 'Operations monitoring', 'Finance summaries', 'Management dashboards'],
    capstone: 'Analyse a realistic company dataset, build a dashboard, and present a short decision report with clear recommendations.',
    certificate: 'Certificate is issued after completing the modules, dashboard project, and final capstone review.',
    faqs: [
      { question: 'Do I need coding experience?', answer: 'No. You will learn SQL basics, but the track starts from practical spreadsheet and dashboard work.' },
      { question: 'Can I use this for remote jobs?', answer: 'Yes. The portfolio is designed to show reporting, dashboard, and business analysis skills.' },
      { question: 'Will AI do the analysis for me?', answer: 'AI will help you move faster, but you will learn how to verify the result and explain the business meaning.' },
    ],
  },
  {
    slug: 'ai-powered-digital-marketing-specialist',
    title: 'AI-Powered Digital Marketing Specialist',
    shortTitle: 'Digital Marketing',
    description: 'Learn how to plan campaigns, create content, write ads, understand funnels, and use AI to grow brands and businesses online.',
    duration: '4 weeks',
    price: 25000,
    bestFor: 'Creatives, NYSC members, small business promoters, content creators, and young professionals who want marketing skills.',
    skills: ['Content strategy', 'Copywriting', 'Campaign planning', 'Social media analytics', 'AI content workflows', 'Lead generation'],
    opportunities: ['Digital Marketing Specialist', 'Social Media Manager', 'Content Strategist', 'Growth Assistant', 'AI Marketing Operator'],
    tools: ['ChatGPT', 'Canva', 'Meta Business Suite', 'Google Trends', 'CapCut', 'MailerLite or Brevo'],
    goal: 'Train students to use AI to plan, create, publish, measure, and improve digital marketing campaigns for real products and services.',
    overview: 'This track teaches marketing as a business growth skill, not just posting online. Students learn how to understand customers, write better messages, create content faster, and track what is working.',
    whyCompaniesHire: ['They need consistent content and campaigns.', 'They want marketers who understand leads, conversion, and customer follow-up.', 'They need people who can use AI tools to reduce content production time.', 'They want growth support without hiring a full agency.'],
    outcomes: ['Plan campaigns around customer problems.', 'Create content calendars and ad copy with AI.', 'Set up simple lead generation flows.', 'Read basic marketing analytics and improve campaigns.'],
    modules: [
      { title: 'Marketing Foundations', lessons: ['Customer awareness levels', 'Positioning and offers', 'Funnels in simple terms', 'What makes people click, trust, and buy'] },
      { title: 'Content and Copywriting', lessons: ['Hooks, captions, and calls to action', 'AIDA, PAS, and before-after-bridge', 'Using AI for content ideas and drafts', 'Editing AI content so it sounds human'] },
      { title: 'Campaign Planning', lessons: ['Campaign goals and audiences', 'Content calendars', 'Organic vs paid channels', 'Budget and channel decisions'] },
      { title: 'Social Media Execution', lessons: ['Instagram, TikTok, LinkedIn, and WhatsApp marketing', 'Creative formats that work', 'Repurposing one idea into many posts', 'Basic community engagement'] },
      { title: 'Lead Generation and Follow-Up', lessons: ['Landing pages and forms', 'Lead magnets', 'Email and WhatsApp follow-up sequences', 'CRM thinking for marketers'] },
      { title: 'Analytics and Optimisation', lessons: ['Reach, CTR, conversion, CAC, and retention', 'Reading campaign results', 'Using AI to summarise performance', 'Improving the next campaign'] },
    ],
    projects: ['30-day content calendar', 'Campaign landing page copy', 'Lead generation follow-up sequence'],
    portfolio: ['Campaign strategy document', 'Content samples', 'Ad copy set', 'Performance report'],
    applications: ['Social media marketing', 'Product launches', 'Community growth', 'Lead generation', 'Small business marketing'],
    capstone: 'Create a complete AI-assisted marketing campaign for a real or sample business, including strategy, content, copy, and reporting plan.',
    certificate: 'Certificate is issued after campaign project submission and capstone review.',
    faqs: [
      { question: 'Must I be a designer?', answer: 'No. You will learn practical content and campaign execution, with simple design support from tools like Canva.' },
      { question: 'Is this only for social media?', answer: 'No. Social media is included, but the track also covers funnels, leads, follow-up, and reporting.' },
      { question: 'Can I use it for freelancing?', answer: 'Yes. Your portfolio can help you pitch small businesses and founders.' },
    ],
  },
  {
    slug: 'ai-powered-software-builder',
    title: 'AI-Powered Software Builder',
    shortTitle: 'Software Builder',
    description: 'Learn how to use AI coding tools, no-code platforms, and product thinking to build simple websites, apps, automations, and MVPs.',
    duration: '4 weeks',
    price: 25000,
    bestFor: 'Beginners, product-minded graduates, founders, and young professionals who want to build useful digital tools.',
    skills: ['Product thinking', 'AI coding prompts', 'Frontend basics', 'No-code workflows', 'API concepts', 'MVP building'],
    opportunities: ['AI Software Builder', 'No-Code Builder', 'Junior Product Builder', 'Automation Assistant', 'MVP Builder'],
    tools: ['ChatGPT', 'Cursor or Replit', 'Lovable or Bolt-style builders', 'Airtable', 'Supabase basics', 'GitHub'],
    goal: 'Help students move from idea to working digital product using AI-assisted building, clear requirements, and practical testing.',
    overview: 'This track is not about becoming a senior developer in one month. It is about learning how software works, how to describe what you want, how to use AI safely, and how to ship simple useful products.',
    whyCompaniesHire: ['They need people who can prototype internal tools quickly.', 'They want operators who understand product, data, and automation.', 'They need builders who can work with technical teams better.', 'They want faster MVP experiments.'],
    outcomes: ['Write clear product requirements.', 'Use AI to generate and improve simple code.', 'Build and test basic web tools.', 'Deploy a simple product and explain how it works.'],
    modules: [
      { title: 'Software Builder Mindset', lessons: ['Problems, users, and product requirements', 'What software is: frontend, backend, database, API', 'MVP thinking', 'How to break a feature into tasks'] },
      { title: 'AI Coding Workflow', lessons: ['Writing prompts for code generation', 'Reading and reviewing AI output', 'Debugging with error messages', 'Keeping projects organised'] },
      { title: 'Web App Basics', lessons: ['HTML, CSS, and JavaScript concepts', 'Components and pages', 'Forms and validation', 'Responsive UI thinking'] },
      { title: 'Data and Integrations', lessons: ['Databases in plain English', 'Airtable and Supabase concepts', 'APIs and webhooks', 'Connecting forms to data'] },
      { title: 'No-Code and Automation', lessons: ['Choosing no-code vs code', 'Building workflows', 'Automation triggers and actions', 'Human review and quality control'] },
      { title: 'Testing, Deployment, and Portfolio', lessons: ['Testing user flows', 'Fixing bugs with AI help', 'Deploying a simple app', 'Writing a case study'] },
    ],
    projects: ['Personal landing page', 'Form-to-database app', 'Simple AI-assisted business tool'],
    portfolio: ['Product requirement document', 'Working app link', 'GitHub or build notes', 'Demo video'],
    applications: ['Internal tools', 'Startup MVPs', 'Workflow automation', 'Landing pages', 'Simple customer portals'],
    capstone: 'Build and deploy a simple useful software product that solves a clear problem, with documentation and a short demo.',
    certificate: 'Certificate is issued after the deployed project and capstone demo are reviewed.',
    faqs: [
      { question: 'Do I need to know programming first?', answer: 'No. The track starts from software concepts and uses AI to help you build.' },
      { question: 'Will I become a full developer?', answer: 'You will become a practical beginner builder. You can later continue into deeper frontend or backend training.' },
      { question: 'Can I build my business idea?', answer: 'Yes. The capstone can be based on your own idea if it is realistic for the timeline.' },
    ],
  },
  {
    slug: 'ai-powered-business-operations-specialist',
    title: 'AI-Powered Business Operations Specialist',
    shortTitle: 'Business Operations',
    description: 'Learn how to document processes, improve workflows, build simple dashboards, and use AI to help businesses run better.',
    duration: '4 weeks',
    price: 25000,
    bestFor: 'Organised people, admin staff, business graduates, SME operators, and young professionals who enjoy structure and execution.',
    skills: ['Process mapping', 'SOP writing', 'Workflow automation', 'KPI tracking', 'AI operations support', 'Business reporting'],
    opportunities: ['Business Operations Specialist', 'Operations Assistant', 'Process Analyst', 'AI Automation Assistant', 'Business Support Officer'],
    tools: ['ChatGPT', 'Notion', 'Airtable', 'Google Sheets', 'Zapier or Make concepts', 'Trello or ClickUp'],
    goal: 'Train students to help businesses reduce confusion, document work, track performance, and use AI for daily operations.',
    overview: 'Many small businesses do not fail because there is no idea. They struggle because follow-up, records, tasks, and processes are scattered. This track teaches students how to bring order and visibility.',
    whyCompaniesHire: ['They need clear processes and accountability.', 'They want fewer missed tasks and better follow-up.', 'They need simple dashboards and reports.', 'They want AI automation without losing human control.'],
    outcomes: ['Map how a business currently works.', 'Write SOPs that staff can follow.', 'Build simple trackers and dashboards.', 'Recommend AI-assisted improvements.'],
    modules: [
      { title: 'Business Operations Basics', lessons: ['How work flows in a business', 'Inputs, processes, outputs, and owners', 'Common SME bottlenecks', 'The role of an operations specialist'] },
      { title: 'Process Mapping', lessons: ['Flowcharts and simple process maps', 'Finding delays and repeated work', 'Documenting responsibilities', 'Using AI to turn interviews into process notes'] },
      { title: 'SOPs and Work Systems', lessons: ['Writing clear SOPs', 'Checklists and templates', 'Task boards and calendars', 'Building an operating rhythm'] },
      { title: 'Dashboards and KPIs', lessons: ['Choosing practical KPIs', 'Building trackers in Sheets or Airtable', 'Weekly reporting', 'Using AI to summarise operations data'] },
      { title: 'Automation Thinking', lessons: ['What to automate and what not to automate', 'Triggers, actions, and approvals', 'Customer follow-up automation', 'Quality control for AI workflows'] },
      { title: 'Operations Improvement Project', lessons: ['Diagnosing a business case', 'Prioritising fixes', 'Writing recommendations', 'Presenting an operations improvement plan'] },
    ],
    projects: ['SOP pack', 'Operations dashboard', 'Customer follow-up workflow'],
    portfolio: ['Process map', 'SOP document', 'KPI dashboard', 'Improvement recommendation report'],
    applications: ['SME operations', 'Customer follow-up', 'Admin systems', 'Team coordination', 'Workflow automation'],
    capstone: 'Audit a sample business operation and create a process map, SOP, dashboard, and improvement plan.',
    certificate: 'Certificate is issued after submitting the operations toolkit and capstone report.',
    faqs: [
      { question: 'Is this for business owners only?', answer: 'No. It is also good for people who want operations, admin, or business support roles.' },
      { question: 'Do I need technical skills?', answer: 'No. You will use simple tools and learn automation concepts step by step.' },
      { question: 'Can this help me work with SMEs?', answer: 'Yes. The portfolio is built around real SME problems.' },
    ],
  },
  {
    slug: 'ai-powered-ui-ux-designer',
    title: 'AI-Powered UI/UX Designer',
    shortTitle: 'UI/UX Designer',
    description: 'Learn how to research users, design clean interfaces, prototype screens, and use AI to speed up the product design process.',
    duration: '4 weeks',
    price: 25000,
    bestFor: 'Creative beginners, product-minded students, frontend learners, and young professionals who want a design portfolio.',
    skills: ['User research', 'Wireframing', 'Interface design', 'Prototyping', 'AI design prompts', 'Portfolio case study'],
    opportunities: ['UI/UX Designer', 'Product Designer Assistant', 'UX Research Assistant', 'Interface Designer', 'AI Product Design Operator'],
    tools: ['ChatGPT', 'Figma', 'FigJam', 'Canva', 'Uizard or similar AI UI tools', 'Notion'],
    goal: 'Train students to understand users, design usable interfaces, and build a portfolio-ready product design case study with AI support.',
    overview: 'This track teaches design as problem-solving. Students learn how to understand user needs, organise screens, use design principles, prototype ideas, and present a professional case study.',
    whyCompaniesHire: ['They need better digital product experiences.', 'They want designers who can explain decisions, not just decorate screens.', 'They need faster wireframes and prototypes.', 'They want design talent that can work with developers and product teams.'],
    outcomes: ['Conduct simple user research.', 'Create user flows and wireframes.', 'Design polished screens in Figma.', 'Build a case study that explains the problem, process, and solution.'],
    modules: [
      { title: 'UI/UX Foundations', lessons: ['UI vs UX in simple terms', 'Design as problem-solving', 'User-centred thinking', 'Good and bad interface examples'] },
      { title: 'User Research and Flows', lessons: ['Personas and user stories', 'Interview questions and surveys', 'User journeys', 'Task flows and information architecture'] },
      { title: 'Design Principles', lessons: ['Hierarchy, alignment, spacing, contrast, and consistency', 'Typography and colour basics', 'Components and patterns', 'Accessibility basics'] },
      { title: 'Wireframes and Prototypes', lessons: ['Low-fidelity wireframes', 'High-fidelity screens', 'Clickable prototypes', 'Using AI for wireframe ideas and UX critique'] },
      { title: 'Figma Practice', lessons: ['Frames, auto layout, components, and variants', 'Design systems basics', 'Mobile and web layouts', 'Developer handoff basics'] },
      { title: 'Portfolio Case Study', lessons: ['Writing the design story', 'Showing research and decisions', 'Presenting screens clearly', 'Preparing for design interviews'] },
    ],
    projects: ['Mobile app redesign', 'Landing page interface', 'Clickable product prototype'],
    portfolio: ['Research notes', 'User flow', 'Wireframes', 'High-fidelity screens', 'Clickable prototype', 'Case study'],
    applications: ['Mobile app design', 'Website design', 'Product redesign', 'SaaS dashboards', 'User research support'],
    capstone: 'Design a complete product experience from research to prototype and present it as a professional UI/UX case study.',
    certificate: 'Certificate is issued after completing the prototype, case study, and final presentation.',
    faqs: [
      { question: 'Do I need to know Figma before joining?', answer: 'No. The track introduces Figma and design thinking from beginner level.' },
      { question: 'Is this only about making beautiful screens?', answer: 'No. You will learn usability, research, user flows, and design decisions.' },
      { question: 'Will I have a portfolio after the track?', answer: 'Yes. The capstone is structured as a portfolio case study.' },
    ],
  },
]

export function getCareerTrack(slug: string) {
  return careerAcceleratorTracks.find((track) => track.slug === slug)
}
