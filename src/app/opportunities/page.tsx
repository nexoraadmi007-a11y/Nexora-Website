import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Network, Sparkles } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Opportunities | Nexura Institute',
  description: 'Learn how Nexura Institute is building an opportunity network for high-performing learners and alumni.',
}

const pathways = [
  'Internships and entry-level roles',
  'Freelance and client projects',
  'AI data projects where available',
  'Remote work and project teams',
  'Employer shortlisting for eligible graduates',
]

const readiness = [
  'Programme completion',
  'Projects completed',
  'Portfolio quality',
  'Professional profile',
  'Assessment and feedback history',
]

export default function OpportunitiesPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-20 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="relative mx-auto max-w-7xl">
          <span className="eyebrow mb-6">Opportunity Network</span>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">High-performing learners should become visible to real opportunities.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">
            Nexura Institute is developing a talent network that helps eligible graduates become considered for internships, early roles, freelance work, project teams, AI data work, and employer connections.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-steel">Opportunities are not guaranteed. Readiness is built through completion, project evidence, professionalism, and fit.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/learn" className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
              Build Readiness <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/hire-talent" className="button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold">
              Hire Nexura Talent
            </Link>
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-3 md:px-8">
          <PremiumCard className="rounded-lg md:col-span-2">
            <Network className="h-8 w-8 text-signal" />
            <h2 className="mt-7 text-3xl font-semibold text-white md:text-4xl">What the network can open.</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {pathways.map((item) => (
                <p key={item} className="flex gap-3 text-sm leading-7 text-steel">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-signal" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </PremiumCard>
          <PremiumCard className="rounded-lg">
            <Sparkles className="h-8 w-8 text-signal" />
            <h2 className="mt-7 text-2xl font-semibold text-white">Opportunity Readiness</h2>
            <div className="mt-6 grid gap-3">
              {readiness.map((item) => <p key={item} className="text-sm text-steel">{item}</p>)}
            </div>
          </PremiumCard>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.015] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-signal" />
          <h2 className="mt-6 text-4xl font-semibold text-white md:text-5xl">The better the proof, the stronger the opportunity conversation.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-steel">Nexura focuses on practical evidence: projects, portfolios, reviewed assignments, communication quality, and readiness for real work.</p>
        </div>
      </section>
    </>
  )
}
