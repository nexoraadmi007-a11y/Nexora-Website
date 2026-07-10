import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart3, Bot, BriefcaseBusiness, CheckCircle2, GraduationCap, Sparkles, type LucideIcon } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import { getPrograms, getTestimonials } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'NEXORA Institute | Practical AI Training for Careers and Businesses',
  description: 'NEXORA Institute equips young professionals and business owners with practical AI skills that improve careers, businesses, and productivity.',
}

function CTA({ href, children, variant = 'primary' }: { href: string; children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  return (
    <Link href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5 ${variant === 'primary' ? 'button-primary' : 'button-secondary'}`}>
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

const outcomes: Array<[string, string, LucideIcon]> = [
  ['Work faster with AI', 'Use ChatGPT and AI tools for research, writing, analysis, planning, and daily execution.', Bot],
  ['Build stronger career assets', 'Create practical proof of work, portfolios, dashboards, CVs, and LinkedIn assets.', GraduationCap],
  ['Grow business productivity', 'Improve marketing, customer support, content, CRM, proposals, and operations.', BriefcaseBusiness],
]

const why = [
  'Practical classes built around real work, not theory.',
  'Clear program structure, deliverables, and application flow.',
  'Airtable-powered CRM keeps applications, payments, referrals, and follow-up organized.',
  'Designed for Nigerian students, young professionals, and business owners.',
]

const steps = [
  ['Choose a program', 'Select the Career Accelerator or Business Transformation Accelerator.'],
  ['Apply and confirm payment', 'Submit your details and complete enrollment securely.'],
  ['Learn by building', 'Attend sessions, complete practical tasks, and create usable assets.'],
  ['Use the skills', 'Apply AI to your career, business, workplace, or client work.'],
]

const faqs = [
  ['Do I need a tech background?', 'No. The programs are built for practical users who want to apply AI at work or in business.'],
  ['How long are the programs?', 'Each track contains 6 modules plus a final capstone project. Learners can take one track or combine multiple tracks.'],
  ['Can companies train their teams?', 'Yes. Companies can request corporate AI training, leadership workshops, and employee productivity sessions.'],
]

function trackLabel(code: string) {
  return code === 'BATP' ? '3 business tracks - NGN 5,000 each' : '5 career tracks - NGN 10,000 each'
}

export default async function HomePage() {
  const [programs, testimonials] = await Promise.all([getPrograms(), getTestimonials()])
  const cards = [
    { code: 'NGTP', icon: GraduationCap, href: '/career-accelerator' },
    { code: 'BATP', icon: BriefcaseBusiness, href: '/business-ai-transformation' },
  ].map((card) => ({ ...card, program: programs.find((program) => program.code === card.code) }))

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-20 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <span className="eyebrow mb-6">NEXORA Institute</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] text-white md:text-7xl">
              Learn practical AI skills that advance your career or grow your business.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">
              NEXORA Institute equips young professionals and business owners with practical AI skills that improve careers, businesses, and productivity.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CTA href="/programs">View Programs</CTA>
              <CTA href="/corporate-training" variant="secondary">For Companies</CTA>
            </div>
          </div>
          <div className="glass rounded-2xl p-5 md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">Program Snapshot</p>
            <div className="mt-5 grid gap-3">
              {cards.map(({ code, href, program, icon: Icon }) => (
                <Link key={code} href={href} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="flex items-start gap-4">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-signal" />
                    <div>
                      <h2 className="text-base font-semibold text-white">{program?.name || code}</h2>
                      <p className="mt-1 text-sm text-steel">{trackLabel(code)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.015] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="eyebrow mb-5">Programs</span>
              <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">One institute. Practical AI programs for work and business.</h2>
            </div>
            <CTA href="/programs" variant="secondary">Compare Programs</CTA>
          </div>
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
            {cards.map(({ code, href, program, icon: Icon }) => (
              <PremiumCard key={code} className="min-h-[330px] rounded-2xl">
                <Icon className="h-8 w-8 text-signal" />
                <h3 className="mt-7 text-2xl font-semibold text-white">{program?.name || code}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{program?.description}</p>
                <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-frost">
                  <span>{code === 'BATP' ? '3 business tracks' : '5 career tracks'}</span>
                  <span>{code === 'BATP' ? 'NGN 5,000 per track' : 'NGN 10,000 per track'}</span>
                </div>
                <CTA href={href} variant={code === 'NGTP' ? 'primary' : 'secondary'}>Apply Now</CTA>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow mb-5">Outcomes</span>
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">Learn skills you can use immediately.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {outcomes.map(([title, copy, Icon]) => (
              <PremiumCard key={title} className="min-h-[260px] rounded-2xl">
                <Icon className="h-8 w-8 text-signal" />
                <h3 className="mt-7 text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.015] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <span className="eyebrow mb-5">Why NEXORA</span>
            <h2 className="text-4xl font-semibold text-white md:text-5xl">Built for practical adoption, not AI hype.</h2>
          </div>
          <div className="grid gap-3">
            {why.map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-frost">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-signal" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow mb-5">How It Works</span>
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">A simple path from interest to practical capability.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {steps.map(([title, copy], index) => (
              <PremiumCard key={title} className="min-h-[230px] rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">Step {index + 1}</p>
                <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.015] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow mb-5">Student Success</span>
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">Outcome stories will live here as cohorts progress.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {(testimonials.length ? testimonials.slice(0, 2) : [
              { name: 'NEXORA Learner', role: 'Career Accelerator', organization: '', testimonial: 'NEXORA made AI feel practical and usable for real work, not just theory.' },
              { name: 'Business Participant', role: 'Business Accelerator', organization: '', testimonial: 'The program helped us see immediate productivity use cases for AI in daily operations.' },
            ]).map((item) => (
              <PremiumCard key={item.name} className="rounded-2xl">
                <Sparkles className="h-6 w-6 text-signal" />
                <p className="mt-5 text-lg leading-8 text-frost">&quot;{item.testimonial}&quot;</p>
                <p className="mt-6 text-sm font-semibold text-white">{item.name}</p>
                <p className="text-sm text-steel">{item.role} {item.organization ? `- ${item.organization}` : ''}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <span className="eyebrow mb-5">FAQs</span>
            <h2 className="text-4xl font-semibold text-white md:text-5xl">Quick answers before you apply.</h2>
          </div>
          <div className="grid gap-4">
            {faqs.map(([question, answer]) => (
              <PremiumCard key={question} className="rounded-2xl p-5 md:p-6">
                <h3 className="text-lg font-semibold text-white">{question}</h3>
                <p className="mt-3 text-sm leading-7 text-steel">{answer}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <BarChart3 className="mx-auto h-9 w-9 text-signal" />
          <h2 className="mt-6 text-4xl font-semibold text-white md:text-5xl">Start with the program that fits your next move.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-steel">Whether you are preparing for work, growing a business, or training a team, NEXORA gives you a practical path into AI.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <CTA href="/programs">View Programs</CTA>
            <CTA href="/contact" variant="secondary">Talk to NEXORA</CTA>
          </div>
        </div>
      </section>
    </>
  )
}
