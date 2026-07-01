import type { Metadata } from 'next'
import { BriefcaseBusiness, CheckCircle2, GraduationCap, Layers3, type LucideIcon } from 'lucide-react'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'
import { getCompleteAccelerator } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Complete AI Accelerator | Nexora Institute',
  description: 'The complete NEXORA track for people who want both career acceleration and business transformation capability.',
}

const bestFor = ['Freelancers', 'Consultants', 'Agency owners', 'Startup founders', 'Professionals building side businesses']

const outcomes: Array<[string, string, LucideIcon]> = [
  ['Career capability', 'Build practical AI productivity, Excel, Power BI, content, portfolio, CV, LinkedIn, and job-readiness assets.', GraduationCap],
  ['Business capability', 'Build AI-supported marketing, customer support, website, brand, CRM, sales, proposal, and operations workflows.', BriefcaseBusiness],
  ['Integrated proof of work', 'Leave with a combined portfolio and implementation plan that supports employment, freelancing, consulting, or business growth.', Layers3],
]

export default async function CompleteAIAcceleratorPage() {
  const program = await getCompleteAccelerator()
  const modules = program.curriculum.split('\n').filter(Boolean)

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">Complete Track</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">{program.name}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">{program.description}</p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Duration</p><p className="mt-1 text-xl font-bold text-white">{program.duration}</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Includes</p><p className="mt-1 text-xl font-bold text-white">2 tracks</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Investment</p><p className="mt-1 text-xl font-bold text-white">NGN {program.price.toLocaleString()}</p></div>
            </div>
          </div>
          <WebsiteForm kind="complete" title="Apply for Complete AI Accelerator" cta={`Apply - NGN ${program.price.toLocaleString()}`} payAfterSubmit context={{ amount: program.price, programName: program.name, programCode: 'COMPLETE', cohort: 'Next Complete AI Cohort' }} />
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">Best for people building both capability and income.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {bestFor.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-frost">{item}</span>)}
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {outcomes.map(([title, copy, Icon]) => (
              <PremiumCard key={title} className="min-h-[260px]">
                <Icon className="h-8 w-8 text-signal" />
                <h3 className="mt-8 text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">What the complete track includes.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {modules.map((module, index) => (
              <PremiumCard key={module} className="min-h-[220px]">
                <CheckCircle2 className="h-6 w-6 text-signal" />
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-steel">Module {index + 1}</p>
                <h3 className="mt-4 text-xl font-semibold text-white">{module.replace(/^Week \d+:\s*/, '')}</h3>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
