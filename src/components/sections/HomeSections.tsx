import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'

const applyHref = '/academy#apply'
const communityHref = 'https://wa.me/2347084193822?text=Hello%20NEXORA%2C%20I%20want%20to%20join%20the%20free%20AI%20community.'

const problemPoints = [
  'AI is changing every profession.',
  'Traditional education is not enough.',
  'Professionals who understand AI will have a major advantage.',
  'Nexora bridges the gap between certificates and practical capability.',
]

const audiences: Array<[string, string, LucideIcon]> = [
  ['NYSC Corps Members & Students', 'Learn practical AI skills, gain real-world experience, and prepare yourself for better career opportunities.', GraduationCap],
  ['Young Professionals', 'Learn to use AI to work faster, communicate better, conduct research, and become more valuable at work.', BriefcaseBusiness],
  ['Organizations', 'Help your teams understand and implement AI to improve productivity.', Building2],
]

const programs: Array<[string, string, string, string, string, LucideIcon]> = [
  ['AI Productivity Masterclass', '1 Month', 'N25,000', 'A practical introduction to AI tools, workplace productivity, research, communication, and execution.', 'Learn More', Bot],
  ['AI Graduate Accelerator', '3 Months', 'N50,000 one-time or N75,000 installment plan', 'A structured pathway for graduates who want AI, data, automation, and operational capability.', 'Apply Now', Sparkles],
  ['Corporate AI Training', 'Custom', 'For teams and organizations', 'Customized AI adoption workshops that help teams improve productivity and practical execution.', 'Book Training', Users],
]

const communityBenefits = ['Weekly AI sessions', 'Industry insights', 'AI resources', 'Career opportunities', 'Updates on upcoming cohorts']

function CTAButton({ href, children, variant = 'primary' }: { href: string; children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
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

function InstituteVisual() {
  return (
    <div className="glass relative hidden min-h-[540px] overflow-hidden rounded-[40px] p-6 md:block">
      <div className="grid-field absolute inset-0 opacity-60" />
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-signal/20 blur-[100px]" />
      <div className="absolute left-6 right-6 top-6 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.035] px-5 py-3 text-xs text-steel">
        <span>Nexora Institute</span>
        <span>AI-ready workforce</span>
      </div>
      <div className="relative mt-20 grid gap-4">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-steel">Learning Pathway</p>
          <div className="mt-5 grid gap-3">
            {['AI Productivity', 'Data & Research', 'Automation Systems', 'Professional Execution'].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal/15 text-xs font-bold text-white">{index + 1}</span>
                <span className="text-sm font-semibold text-frost">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['Students', 'Professionals', 'Teams'].map((item) => (
            <div key={item} className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 text-center">
              <p className="text-sm font-semibold text-white">{item}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-steel">AI future</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-5 pt-28 md:px-8">
      <div className="grid-field absolute inset-0 opacity-70" />
      <div className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-signal/20 blur-[100px] animate-drift" />
      <div className="absolute right-[-10%] top-[10%] h-[520px] w-[520px] rounded-full bg-cobalt/30 blur-[120px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-[1.02fr_.98fr]">
        <Reveal>
          <span className="eyebrow mb-7">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            Building Africa's AI-ready workforce
          </span>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-tight text-white md:text-7xl lg:text-8xl">
            Build Your Career For <span className="gradient-text">The AI Era.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-steel md:text-xl">
            Master practical AI skills, improve your productivity, and become part of Africa's next generation of AI professionals.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <CTAButton href={applyHref}>Apply for a Program</CTAButton>
            <CTAButton href={communityHref} variant="secondary">Join Free AI Community</CTAButton>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <InstituteVisual />
        </Reveal>
      </div>
    </section>
  )
}

export function ProblemSection() {
  return (
    <section className="section">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          label="The Shift"
          title={<>The Future of Work Is Changing. <span className="gradient-text">Are You Ready?</span></>}
          copy="AI is no longer a future topic. It is already changing how people work, research, communicate, report, automate, and make decisions."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {problemPoints.map((point, index) => (
            <PremiumCard key={point} delay={index * 0.04}>
              <Lightbulb className="mb-8 h-7 w-7 text-signal" />
              <p className="text-lg font-semibold leading-8 text-white">{point}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function WhoWeServe() {
  return (
    <section className="section border-y border-white/10 bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader label="Who We Serve" title={<>AI readiness for people and <span className="gradient-text">organizations.</span></>} />
        <div className="grid gap-5 md:grid-cols-3">
          {audiences.map(([title, copy, Icon], index) => (
            <PremiumCard key={title} delay={index * 0.05} className="min-h-[320px]">
              <Icon className="h-8 w-8 text-signal" />
              <h3 className="mt-12 text-2xl font-semibold text-white">{title}</h3>
              <p className="mt-5 text-sm leading-7 text-steel">{copy}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProgramsPreview() {
  return (
    <section id="programs" className="section">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader label="Programs" title={<>Practical programs for the <span className="gradient-text">AI-powered workplace.</span></>} />
        <div className="grid gap-5 lg:grid-cols-3">
          {programs.map(([title, duration, price, copy, cta, Icon], index) => (
            <PremiumCard key={title} delay={index * 0.05} className="min-h-[440px]">
              <Icon className="h-8 w-8 text-signal" />
              <p className="mt-10 text-xs font-bold uppercase tracking-[0.16em] text-steel">{duration}</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">{title}</h3>
              <p className="mt-4 text-lg font-semibold text-frost">{price}</p>
              <p className="mt-5 text-sm leading-7 text-steel">{copy}</p>
              <Link href={title === 'Corporate AI Training' ? '/contact' : '/academy#apply'} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-frost">
                {cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CommunitySection() {
  return (
    <section id="community" className="section overflow-hidden bg-[#040b17]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <Reveal>
          <span className="eyebrow mb-7">Free AI Community</span>
          <h2 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl">
            Do Not Learn <span className="gradient-text">AI Alone.</span>
          </h2>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">
            Join a community built for serious learners, graduates, professionals, and teams who want practical guidance for the AI era.
          </p>
          <div className="mt-8">
            <CTAButton href={communityHref} variant="secondary">Join Free Community</CTAButton>
          </div>
        </Reveal>
        <div className="grid gap-3 md:grid-cols-2">
          {communityBenefits.map((benefit, index) => (
            <Reveal key={benefit} delay={index * 0.04} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
              <MessageCircle className="mb-6 h-6 w-6 text-signal" />
              <p className="text-lg font-semibold text-white">{benefit}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-5 py-28 md:px-8 md:py-36">
      <div className="absolute inset-0 grid-field opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/10 blur-[120px]" />
      <Reveal className="relative mx-auto max-w-4xl text-center">
        <span className="eyebrow mb-7">AI-ready future</span>
        <h2 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl">
          The AI Revolution Is Here. <span className="gradient-text">Do Not Be Left Behind.</span>
        </h2>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-steel">
          Nexora is not selling information. Nexora is building the next generation of AI-powered professional operators.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <CTAButton href={applyHref}>Apply Now</CTAButton>
          <CTAButton href={communityHref} variant="secondary">Join Community</CTAButton>
        </div>
      </Reveal>
    </section>
  )
}
