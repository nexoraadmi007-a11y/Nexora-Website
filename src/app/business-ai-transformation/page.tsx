import type { Metadata } from 'next'
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, ClipboardCheck, Globe2, LineChart, Palette, Workflow } from 'lucide-react'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'
import { batpBeforeAfter, batpDeliverables, batpFaqs, batpIndustries, batpPillars } from '@/lib/business-transformation-program'
import { getBusinessTransformation } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'AI Business Transformation Program | NEXORA Institute',
  description: 'Transform your business into an AI-powered business in 30 days with branding, website, marketing, sales, automation, dashboard, and growth systems.',
  keywords: ['AI for Small Businesses', 'Business Automation Nigeria', 'AI Business Training', 'Business Growth Programme', 'SME Digital Transformation'],
}

const pillarIcons = [Palette, Globe2, LineChart, BriefcaseBusiness, Workflow]

export default async function BusinessAITransformationPage() {
  const program = await getBusinessTransformation()

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">AI Business Transformation Program</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Build an AI-Powered Business in 30 Days</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">
              Stop running your business manually. Build the systems, branding, marketing, sales process, and automation your business needs to grow.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-frost">
              Transform your business into an AI-powered business in just 30 days.
            </p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Duration</p><p className="mt-1 text-xl font-bold text-white">4 weeks</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Pathway</p><p className="mt-1 text-xl font-bold text-white">1</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Price</p><p className="mt-1 text-xl font-bold text-white">NGN 35,000</p></div>
            </div>
            <a href="#apply" className="button-primary mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
              Apply Now
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div id="apply">
            <WebsiteForm kind="batp" title="Apply for AI Business Transformation" cta="Pay NGN 35,000" payAfterSubmit context={{ amount: 35000, programName: 'AI Business Transformation Program', programCode: 'BATP', cohort: 'Next BATP Cohort' }} />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.015] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow mb-5">Before and After</span>
          <h2 className="max-w-4xl text-4xl font-semibold text-white md:text-5xl">Move from manual business activity to an organized AI-powered business system.</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {batpBeforeAfter.map(([before, after]) => (
              <div key={before} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-2">
                <div className="rounded-xl border border-red-300/20 bg-red-400/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-200/80">Before</p>
                  <p className="mt-2 text-sm font-semibold text-frost">{before}</p>
                </div>
                <div className="rounded-xl border border-signal/30 bg-signal/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-signal">After</p>
                  <p className="mt-2 text-sm font-semibold text-white">{after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="eyebrow mb-5">Transformation Pathway</span>
            <h2 className="text-4xl font-semibold text-white md:text-5xl">One clear pathway. Five business systems built together.</h2>
            <p className="mt-5 text-base leading-8 text-steel">This is not a collection of random AI lessons. It is a guided business transformation program where each week moves your business closer to a professional operating system.</p>
          </div>
          <div className="mt-9 grid gap-5 lg:grid-cols-5">
            {batpPillars.map((pillar, index) => {
              const Icon = pillarIcons[index] || Bot
              return (
                <PremiumCard key={pillar.title} className="rounded-2xl">
                  <Icon className="h-8 w-8 text-signal" />
                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-steel">{pillar.deliverable}</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">{pillar.title}</h3>
                  <div className="mt-5 grid gap-2">
                    {pillar.items.map((item) => (
                      <p key={item} className="flex gap-2 text-sm leading-6 text-steel">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-signal" />
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </PremiumCard>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.015] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <span className="eyebrow mb-5">Industry Adaptation</span>
            <h2 className="text-4xl font-semibold text-white md:text-5xl">Built for real Nigerian businesses.</h2>
            <p className="mt-5 text-base leading-8 text-steel">The same business system is adapted to your business type, customer flow, sales process, and daily operations.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {batpIndustries.map((industry) => (
              <div key={industry} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-frost">
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow mb-5">What You Leave With</span>
          <h2 className="max-w-4xl text-4xl font-semibold text-white md:text-5xl">A practical business toolkit you can start using immediately.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {batpDeliverables.map((deliverable) => (
              <div key={deliverable} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-frost">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                <span>{deliverable}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">FAQs</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {batpFaqs.map(([question, answer]) => (
              <div key={question} className="glass rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-semibold text-white">{question}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
