import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Clock3,
  Layers3,
  LineChart,
  MessageCircle,
  Play,
  Presentation,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import Reveal from '@/components/ui/Reveal'
import NGTPCapture from '@/components/sections/NGTPCapture'

export const metadata: Metadata = {
  title: 'NEXORA Institute | NEXORA Graduate Training Program',
  description:
    'Apply for the NEXORA Graduate Training Program, a 12-week intensive experience for graduates and young professionals preparing for the AI-driven workplace.',
}

const applicationUrl = '/contact'
const whatsappCommunityUrl =
  'https://wa.me/2347084193822?text=Hello%20NEXORA%2C%20I%20am%20interested%20in%20the%20NEXORA%20Graduate%20Training%20Program.'

const proofPoints = [
  ['100', 'graduates selected per cohort'],
  ['12', 'weeks intensive training'],
  ['Real', 'world projects'],
  ['Industry', 'ready skills'],
  ['NEXORA', 'certification'],
]

const capabilities: Array<[string, string, LucideIcon]> = [
  ['AI Productivity', 'Use AI as a serious work partner for research, execution, analysis, and communication.', Bot],
  ['Operational Analysis', 'Understand how organizations work, where friction appears, and how systems improve outcomes.', Workflow],
  ['Data Intelligence', 'Interpret business data, identify patterns, and communicate insights decision-makers can use.', BarChart3],
  ['Automation Thinking', 'Map repetitive workflows and design practical automation opportunities for modern teams.', Layers3],
  ['Strategic Reporting', 'Create professional reports, presentations, and recommendations with executive clarity.', Presentation],
  ['Independent Execution', 'Manage projects, collaborate in teams, and deliver measurable outcomes without hand-holding.', BriefcaseBusiness],
]

const transformation = [
  ['Weeks 1-3', 'Operational Intelligence Foundations', 'Understand organizations, workflows, business friction, communication systems, and execution discipline.'],
  ['Weeks 4-6', 'AI Productivity & Data Analysis', 'Use AI responsibly, work with data, build insight habits, and improve professional output quality.'],
  ['Weeks 7-9', 'Automation Systems & Digital Operations', 'Map workflows, design automations, structure digital operations, and document repeatable systems.'],
  ['Weeks 10-12', 'Real-World Projects & Professional Execution', 'Complete missions, collaborate on business cases, build portfolio evidence, and present recommendations.'],
]

const admissions = ['Application', 'Assessment', 'Interview', 'Selection', 'Admission', 'Transformation']

const faqs = [
  ['Who can apply?', 'NYSC members, recent graduates, and young professionals who are ready to build practical capability for the modern workplace.'],
  ['Do I need a technology background?', 'No. NGTP teaches practical AI, data, automation, and operational skills from the foundation.'],
  ['Will I get a job after the program?', 'NEXORA does not guarantee employment. However, exceptional operators may receive opportunities to work on NEXORA projects and partner initiatives, and high-performing graduates may receive professional recommendations.'],
  ['How much time does the program require?', 'The weekly time requirement is editable for each cohort. Applicants should expect a serious commitment across live sessions, assignments, projects, and execution reviews.'],
  ['Is the program online?', 'The program is built around virtual sessions, with periodic physical networking and intelligence sessions where available.'],
]

function CTAButton({ children, href = applicationUrl, variant = 'primary' }: { children: React.ReactNode; href?: string; variant?: 'primary' | 'secondary' }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
        variant === 'primary' ? 'button-primary' : 'button-secondary'
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

function SectionShell({ id, children, className = '' }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`section border-t border-white/10 ${className}`}>
      <div className="mx-auto max-w-7xl px-5 md:px-8">{children}</div>
    </section>
  )
}

function SectionTitle({ label, title, copy }: { label: string; title: string; copy?: string }) {
  return (
    <Reveal className="mb-12 max-w-3xl">
      <span className="eyebrow mb-5">{label}</span>
      <h2 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">{title}</h2>
      {copy ? <p className="mt-5 text-base leading-8 text-steel md:text-lg">{copy}</p> : null}
    </Reveal>
  )
}

function HeroVisual() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[40px] border border-white/10 bg-[#07111f] shadow-panel">
      <div className="grid-field absolute inset-0 opacity-60" />
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-signal/25 blur-[100px]" />
      <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-cobalt/30 blur-[120px]" />
      <div className="absolute inset-x-8 top-8 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.035] px-5 py-3 text-xs text-steel backdrop-blur-2xl">
        <span>NEXORA Institute</span>
        <span>AI Operator Cohort</span>
      </div>
      <div className="absolute left-8 right-8 top-24 grid gap-4 md:grid-cols-3">
        {['AI Research', 'Data Insight', 'Workflow Systems'].map((item, index) => (
          <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl" style={{ marginTop: index * 24 }}>
            <div className="mb-8 h-24 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-signal/10" />
            <p className="text-sm font-semibold text-white">{item}</p>
            <p className="mt-2 text-xs leading-5 text-steel">Professional execution layer</p>
          </div>
        ))}
      </div>
      <div className="absolute bottom-8 left-8 right-8 rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-steel">Cohort Intelligence</p>
            <p className="mt-2 text-2xl font-semibold text-white">100 selected operators</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {['AI', 'Data', 'Ops'].map((item) => (
              <span key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-frost">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AcademyPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-36 md:px-8 md:pb-28 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-signal/15 blur-[100px]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
          <Reveal>
            <span className="eyebrow mb-7">NEXORA Institute / NGTP</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-tight text-white md:text-7xl">
              The Degree Got You Here. <span className="gradient-text">The Future Requires More.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">
              The workplace has changed. Organizations are no longer looking only for certificates. They are looking for professionals who can leverage AI, analyze data, automate systems, communicate insights, and solve real business problems.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-frost">
              NEXORA Graduate Training Program is a 12-week intensive experience designed to transform graduates into AI-powered operational professionals.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CTAButton>Apply for NGTP</CTAButton>
              <CTAButton href="#founder-story" variant="secondary"><Play className="h-4 w-4" />Watch Founder Story</CTAButton>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <HeroVisual />
          </Reveal>
        </div>
        <div className="relative mx-auto mt-10 grid max-w-7xl gap-3 px-0 md:grid-cols-5">
          {proofPoints.map(([value, label], index) => (
            <Reveal key={label} delay={index * 0.03} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
              <p className="text-3xl font-semibold text-white">{value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-steel">{label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <SectionShell>
        <SectionTitle label="The Reality" title="The World Changed Faster Than Education." copy="Traditional education prepared graduates for yesterday's workplace. Modern organizations now require professionals who can use AI, interpret data, automate work, improve operations, and communicate strategic insights." />
        <div className="grid gap-5 lg:grid-cols-2">
          <PremiumCard>
            <Clock3 className="mb-8 h-8 w-8 text-steel" />
            <h3 className="text-3xl font-semibold text-white">Yesterday's Professional</h3>
            <div className="mt-8 grid gap-3">
              {['Uses tools.', 'Completes tasks.', 'Follows instructions.'].map((item) => <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-steel">{item}</p>)}
            </div>
          </PremiumCard>
          <PremiumCard>
            <Sparkles className="mb-8 h-8 w-8 text-signal" />
            <h3 className="text-3xl font-semibold text-white">Tomorrow's Professional</h3>
            <div className="mt-8 grid gap-3">
              {['Uses AI intelligently.', 'Solves problems.', 'Improves systems.', 'Creates measurable value.'].map((item) => <p key={item} className="rounded-2xl border border-signal/30 bg-signal/10 px-4 py-3 text-sm text-frost">{item}</p>)}
            </div>
          </PremiumCard>
        </div>
      </SectionShell>

      <SectionShell id="founder-story" className="bg-[#020611]/40">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <Reveal className="rounded-[36px] border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-white/10 bg-black/20">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.045] text-white">
                  <Play className="h-7 w-7" />
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-steel">Founder Story Video</p>
                <p className="mt-2 text-sm text-frost">Placeholder ready for video embed.</p>
              </div>
            </div>
          </Reveal>
          <SectionTitle label="Why NEXORA Exists" title="A Problem We Experienced First-Hand." copy="While building our businesses, we requested NYSC graduates to support our operations. We expected to find graduates ready for the modern workplace. Instead, we discovered a gap." />
        </div>
        <Reveal className="mt-4 max-w-3xl text-lg leading-9 text-steel">
          Many were intelligent, ambitious, and willing to learn, but lacked exposure to the practical tools, systems, and execution skills required by today's organizations. We asked ourselves: <span className="text-white">What would happen if graduates were trained based on what businesses actually need?</span> That question became NEXORA Institute.
          <div className="mt-8">
            <CTAButton href="#founder-story" variant="secondary">Watch The NEXORA Story</CTAButton>
          </div>
        </Reveal>
      </SectionShell>

      <SectionShell>
        <SectionTitle label="Operator Identity" title="We Do Not Just Teach Skills. We Build Operators." copy="After completing NGTP, graduates should be able to analyze organizations, use AI as a productivity partner, build automation workflows, work with business data, create presentations, conduct research, and execute projects independently." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(([title, copy, Icon], index) => (
            <PremiumCard key={title} delay={index * 0.04}>
              <Icon className="mb-8 h-7 w-7 text-signal" />
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
            </PremiumCard>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="bg-[#020611]/40">
        <SectionTitle label="12-Week Transformation" title="A Structured Path From Graduate To Operator." copy="Each stage includes practical assignments, business case studies, team collaboration, portfolio development, and execution reviews." />
        <div className="grid gap-4">
          {transformation.map(([weeks, title, copy], index) => (
            <Reveal key={weeks} delay={index * 0.04} className="grid gap-5 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 md:grid-cols-[220px_1fr] md:p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-signal/30 bg-signal/10 text-sm font-bold text-white">{index + 1}</span>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-steel">{weeks}</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-steel">{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <SectionTitle label="Opportunity Pathway" title="Your Journey Does Not End at Graduation." copy="Outstanding operators may be selected to work on NEXORA projects and partner initiatives. Exceptional graduates may also receive recommendations and career support through NEXORA's professional network." />
          <Reveal className="glass rounded-[32px] p-6 md:p-8">
            <ShieldCheck className="mb-8 h-9 w-9 text-signal" />
            <h3 className="text-2xl font-semibold text-white">No unrealistic guarantees.</h3>
            <p className="mt-4 text-sm leading-7 text-steel">
              NGTP is positioned as a serious pathway for exceptional performers, not a promise of automatic employment. The goal is capability, evidence, and professional readiness.
            </p>
          </Reveal>
        </div>
      </SectionShell>

      <SectionShell className="bg-[#020611]/40">
        <SectionTitle label="The NEXORA Standard" title="Only 100 Graduates Are Selected Per Cohort." copy="Admission is competitive and based on commitment, growth potential, analytical thinking, communication, leadership, and initiative." />
        <div className="grid gap-3 md:grid-cols-6">
          {admissions.map((step, index) => (
            <Reveal key={step} delay={index * 0.03} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-signal/15 text-sm font-semibold text-white">{index + 1}</span>
              <p className="mt-4 text-sm font-semibold text-frost">{step}</p>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="apply">
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <SectionTitle label="Program Investment" title="An Investment In Your Professional Future" copy="You are not paying for videos. You are investing in becoming a modern professional equipped for the AI-driven economy." />
          <Reveal className="glass rounded-[32px] p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6">
                <p className="text-sm uppercase tracking-[0.14em] text-steel">Full Enrollment</p>
                <p className="mt-5 text-5xl font-semibold text-white">N75,000</p>
              </div>
              <div className="rounded-[28px] border border-signal/30 bg-signal/10 p-6">
                <p className="text-sm uppercase tracking-[0.14em] text-steel">Flexible Payment Plan</p>
                <p className="mt-5 text-5xl font-semibold text-white">N90,000</p>
              </div>
            </div>
            <NGTPCapture />
          </Reveal>
        </div>
      </SectionShell>

      <SectionShell>
        <SectionTitle label="Testimonials" title="Operator outcomes will live here." copy="This section is ready for stories from graduates, project mentors, business partners, and cohort leaders as NGTP cohorts progress." />
        <div className="grid gap-4 md:grid-cols-3">
          {[Users, LineChart, Award].map((Icon, index) => (
            <PremiumCard key={index}>
              <Icon className="mb-8 h-7 w-7 text-signal" />
              <h3 className="text-xl font-semibold text-white">Graduate story placeholder</h3>
              <p className="mt-4 text-sm leading-7 text-steel">Replace with cohort testimonials, project outcomes, and measurable transformation evidence.</p>
            </PremiumCard>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="bg-[#020611]/40">
        <SectionTitle label="FAQ" title="Questions Serious Applicants Ask." />
        <div className="grid gap-4">
          {faqs.map(([question, answer]) => (
            <Reveal key={question} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
              <h3 className="text-lg font-semibold text-white">{question}</h3>
              <p className="mt-3 text-sm leading-7 text-steel">{answer}</p>
            </Reveal>
          ))}
        </div>
      </SectionShell>

      <SectionShell>
        <Reveal className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#07111f] p-8 text-center md:p-14">
          <div className="grid-field absolute inset-0 opacity-50" />
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-signal/20 blur-[100px]" />
          <div className="relative">
            <span className="eyebrow mb-6">Next Cohort</span>
            <h2 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">The Future Will Reward Those Who Can Execute.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-steel">
              Thousands of graduates will enter the market with certificates. Only a few will possess the AI, analytical, automation, and operational skills that modern organizations need. Choose to become one of them.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CTAButton>Apply For The Next NGTP Cohort</CTAButton>
              <CTAButton href={whatsappCommunityUrl} variant="secondary"><MessageCircle className="h-4 w-4" />Join WhatsApp Community</CTAButton>
            </div>
            <p className="mt-5 text-sm text-steel">Limited to 100 graduates per cohort.</p>
          </div>
        </Reveal>
      </SectionShell>

      <div className="hidden" data-analytics-placeholder="NGTP landing page events: apply_click, founder_story_click, email_capture_submit, whatsapp_community_click" data-crm-placeholder="NEXOS Airtable fields: name, email, phone, cohort_interest, source_page, created_at" />
    </>
  )
}
