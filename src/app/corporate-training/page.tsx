import type { Metadata } from 'next'
import { Building2, CheckCircle2, ClipboardCheck, UsersRound, type LucideIcon } from 'lucide-react'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Corporate AI Training | NEXORA Institute',
  description: 'Request corporate AI training, employee AI upskilling, productivity workshops, leadership AI sessions, and operational AI awareness training.',
}

const formats = ['Corporate AI Training', 'Corporate AI Upskilling', 'Employee AI Productivity', 'Leadership Workshops', 'Operational AI Awareness Sessions']
const outcomes: Array<[string, string, LucideIcon]> = [
  ['Employee productivity', 'Help teams use AI for writing, research, reporting, communication, and daily execution.', ClipboardCheck],
  ['Leadership awareness', 'Give managers and leaders a clear understanding of practical AI adoption and responsible use.', Building2],
  ['Team alignment', 'Create a shared AI language across departments so adoption becomes structured, not scattered.', UsersRound],
]

export default function CorporateTrainingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-20 md:pt-40">
        <div className="grid-field absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <span className="eyebrow mb-6">Companies</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Corporate AI training for modern teams.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">
              NEXORA helps organizations train employees, managers, and teams to use AI for practical productivity, communication, reporting, and better execution.
            </p>
          </div>
          <WebsiteForm kind="corporate" title="Request corporate training" cta="Submit Company Inquiry" />
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow mb-5">Training Options</span>
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">Focused AI sessions for teams and leaders.</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {formats.map((item) => <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold leading-6 text-frost">{item}</p>)}
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {outcomes.map(([title, copy, Icon]) => (
              <PremiumCard key={title} className="rounded-2xl">
                <Icon className="h-8 w-8 text-signal" />
                <h3 className="mt-7 text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.015] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <CheckCircle2 className="mx-auto h-9 w-9 text-signal" />
          <h2 className="mt-6 text-4xl font-semibold text-white md:text-5xl">Bring practical AI literacy into your organization.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-steel">Send an inquiry and the NEXORA team will follow up with the right training format for your company.</p>
        </div>
      </section>
    </>
  )
}
