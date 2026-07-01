import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, Building2, CalendarDays, GraduationCap, Layers3, Users, type LucideIcon } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import { getPrograms, getResources, getTestimonials, getWebinars } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Nexora Institute | AI Skills for Careers, Businesses, and Teams',
  description: 'NEXORA Institute is one flagship AI institute with practical tracks for careers, businesses, and complete AI acceleration.',
}

function CTA({ href, children, variant = 'primary' }: { href: string; children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  return (
    <Link href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5 ${variant === 'primary' ? 'button-primary' : 'button-secondary'}`}>
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

export default async function HomePage() {
  const [programs, webinars, resources, testimonials] = await Promise.all([
    getPrograms(),
    getWebinars(),
    getResources(),
    getTestimonials(),
  ])
  const careerProgram = programs.find((program) => program.code === 'NGTP') || programs[0]
  const businessProgram = programs.find((program) => program.code === 'BATP') || programs[1] || programs[0]
  const completeProgram = programs.find((program) => program.code === 'COMPLETE') || programs[2] || programs[0]
  const tracks = [careerProgram, businessProgram, completeProgram]
  const webinar = webinars[0]
  const audiences: Array<[string, string, LucideIcon]> = [
    ['Career builders', 'NYSC members, 500-level students, graduates, and young professionals can build career-ready AI workflows.', GraduationCap],
    ['Business operators', 'SMEs, founders, entrepreneurs, and business owners can improve marketing, sales, operations, and customer follow-up.', Building2],
    ['Complete builders', 'Freelancers, consultants, agency owners, startup founders, and side-business professionals can combine both tracks.', Layers3],
  ]

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pb-28 md:pt-52">
        <div className="grid-field absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">Nexora Institute</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] text-white md:text-7xl">AI skills that create careers, transform businesses, and build high-performing teams.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">NEXORA Institute is one flagship AI institute with three practical learning tracks. Start by choosing who you are and what you want to build.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <CTA href="#tracks">Explore Tracks</CTA>
              <CTA href="/ambassadors/apply" variant="secondary">Become an Ambassador</CTA>
            </div>
          </div>
          <div className="grid gap-4">
            {tracks.map((program) => (
              <div key={program.code} className="glass rounded-[28px] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">{program.family} Track</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">{program.name}</h2>
                <p className="mt-4 text-sm leading-7 text-steel">{program.description}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-frost">
                  <span>{program.duration}</span>
                  <span>NGN {program.price.toLocaleString()}</span>
                </div>
                <div className="mt-6">
                  <CTA href={`/${program.slug}`} variant={program.code === 'NGTP' ? 'primary' : 'secondary'}>{program.cta}</CTA>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tracks" className="section border-y border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-10 max-w-3xl">
            <span className="eyebrow mb-5">Three Learning Tracks</span>
            <h2 className="text-4xl font-semibold text-white md:text-5xl">Select the track that matches your current ambition.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {audiences.map(([title, copy, Icon]) => (
              <PremiumCard key={String(title)} className="min-h-[260px]">
                <Icon className="h-8 w-8 text-signal" />
                <h3 className="mt-8 text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-2">
          <PremiumCard>
            <CalendarDays className="h-8 w-8 text-signal" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-steel">This week's webinar</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">{webinar?.title || 'Weekly AI Workplace Webinar'}</h2>
            <p className="mt-4 text-sm leading-7 text-steel">{webinar?.description || 'Join Nexora for practical AI workplace learning.'}</p>
            <div className="mt-8"><CTA href="/webinars">Register Free</CTA></div>
          </PremiumCard>
          <PremiumCard>
            <BriefcaseBusiness className="h-8 w-8 text-signal" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-steel">Business AI Transformation</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Turn AI into a business operating advantage.</h2>
            <p className="mt-4 text-sm leading-7 text-steel">For business owners and teams that want better marketing, customer follow-up, reporting, and execution.</p>
            <div className="mt-8"><CTA href="/business-ai-transformation" variant="secondary">Apply for Business Track</CTA></div>
          </PremiumCard>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <span className="eyebrow mb-5">Resources</span>
              <h2 className="text-4xl font-semibold text-white md:text-5xl">Latest AI career and business resources.</h2>
            </div>
            <CTA href="/resources" variant="secondary">View all</CTA>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {resources.slice(0, 3).map((item) => (
              <PremiumCard key={item.title}>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">{item.category}</p>
                <h3 className="mt-5 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{item.description}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">Trusted learning for students, business owners, communities, and teams.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {testimonials.slice(0, 2).map((item) => (
              <PremiumCard key={item.name}>
                <p className="text-lg leading-8 text-frost">&quot;{item.testimonial}&quot;</p>
                <p className="mt-6 text-sm font-semibold text-white">{item.name}</p>
                <p className="text-sm text-steel">{item.role} {item.organization ? `- ${item.organization}` : ''}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
