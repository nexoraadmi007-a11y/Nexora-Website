import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'
import { getCareerAccelerator, getCohorts } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Nexora AI Career Accelerator | 4 weeks, NGN 25,000',
  description: 'Enroll in the Nexora Career Accelerator for NYSC members, 500-level students, graduates, and young professionals building practical AI career assets.',
}

const outcomes = ['AI productivity workflows', 'Excel dashboard', 'Power BI report', 'ChatGPT prompt library', 'Content creation assets', 'Professional CV', 'LinkedIn profile', 'Portfolio project', 'Freelance offer', 'Job readiness plan']

export default async function CareerAcceleratorPage() {
  const [program, cohorts] = await Promise.all([getCareerAccelerator(), getCohorts()])
  const weeks = program.curriculum.split('\n').filter(Boolean)
  const cohort = cohorts[0]

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">Track 1 / Career Accelerator</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">{program.name}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">{program.description}</p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Duration</p><p className="mt-1 text-xl font-bold text-white">{program.duration}</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Classes</p><p className="mt-1 text-xl font-bold text-white">8 live</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Price</p><p className="mt-1 text-xl font-bold text-white">NGN {program.price.toLocaleString()}</p></div>
            </div>
          </div>
          <WebsiteForm kind="accelerator" title="Apply for Career Accelerator" cta={`Apply - NGN ${program.price.toLocaleString()}`} payAfterSubmit context={{ amount: program.price, programName: program.name, programCode: 'NGTP', cohort: cohort?.name || 'Next Cohort' }} />
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">Built for NYSC members, 500-level students, graduates, and young professionals.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {outcomes.map((outcome) => (
              <PremiumCard key={outcome} className="p-5 md:p-5">
                <CheckCircle2 className="mb-5 h-5 w-5 text-signal" />
                <p className="text-sm font-semibold text-white">{outcome}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">4-week curriculum.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {weeks.map((week, index) => (
              <PremiumCard key={week} className="min-h-[220px]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">Week {index + 1}</p>
                <h3 className="mt-5 text-2xl font-semibold text-white">{week.replace(/^Week \d+:\s*/, '')}</h3>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
