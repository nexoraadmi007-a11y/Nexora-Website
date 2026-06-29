import type { Metadata } from 'next'
import { BarChart3, Bot, CheckCircle2, Megaphone, Users, type LucideIcon } from 'lucide-react'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'
import { getBusinessTransformation } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Business AI Transformation Program | Nexora Institute',
  description: 'BATP helps business owners, SMEs, startups, entrepreneurs, and corporate teams use AI for marketing, operations, customer follow-up, and productivity.',
}

const outcomes: Array<[string, string, LucideIcon]> = [
  ['Marketing engine', 'Use AI to plan campaigns, offers, captions, content, and follow-up assets.', Megaphone],
  ['Customer follow-up', 'Build repeatable response, lead nurturing, and client communication workflows.', Users],
  ['Operations dashboard', 'Improve reporting, task tracking, decision support, and business visibility.', BarChart3],
  ['Automation roadmap', 'Identify the workflows that should be automated first and how to implement them responsibly.', Bot],
]

const faqs = [
  ['Is BATP only for tech businesses?', 'No. BATP is for practical business operators across services, retail, education, health, consulting, logistics, and other sectors.'],
  ['Do I need an existing team?', 'No. Solo founders and small teams can join, but the program also works for corporate teams that need shared AI adoption habits.'],
  ['Will this replace my staff?', 'No. The goal is to help people work smarter with AI, improve execution, and reduce repetitive manual work.'],
]

export default async function BusinessAITransformationPage() {
  const program = await getBusinessTransformation()
  const weeks = program.curriculum.split('\n').filter(Boolean)

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">Business Path / BATP</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">{program.name}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">{program.description}</p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Duration</p><p className="mt-1 text-xl font-bold text-white">{program.duration}</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Audience</p><p className="mt-1 text-xl font-bold text-white">Business</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Investment</p><p className="mt-1 text-xl font-bold text-white">NGN {program.price.toLocaleString()}</p></div>
            </div>
          </div>
          <WebsiteForm kind="batp" title="Apply for BATP" cta={`Apply - NGN ${program.price.toLocaleString()}`} payAfterSubmit context={{ amount: program.price, programName: program.name, programCode: 'BATP', cohort: 'Next BATP Cohort' }} />
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">Built for practical business transformation.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="text-4xl font-semibold text-white md:text-5xl">BATP curriculum.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {weeks.map((week, index) => (
              <PremiumCard key={week} className="min-h-[220px]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">Module {index + 1}</p>
                <h3 className="mt-5 text-2xl font-semibold text-white">{week.replace(/^Week \d+:\s*/, '')}</h3>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">FAQs</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {faqs.map(([question, answer]) => (
              <PremiumCard key={question}>
                <CheckCircle2 className="h-6 w-6 text-signal" />
                <h3 className="mt-5 text-xl font-semibold text-white">{question}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{answer}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
