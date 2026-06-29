import type { Metadata } from 'next'
import { Building2, CheckCircle2, ClipboardCheck } from 'lucide-react'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Corporate AI Training | Nexora Institute',
  description: 'Book corporate AI training or a complimentary AI Productivity Assessment for teams, HR leaders, CEOs, and organizations.',
}

const formats = ['AI Productivity Assessment', 'Executive AI briefing', 'Team productivity workshop', 'Department-specific AI training', 'Custom corporate program']
const industries = ['Banking', 'Fintech', 'Healthcare', 'Manufacturing', 'Consulting', 'Technology', 'Logistics', 'Professional services']

export default function CorporateTrainingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <span className="eyebrow mb-7">Corporate AI Training</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Help your team work smarter with AI.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">Nexora helps organizations turn AI curiosity into practical workplace productivity: better research, reporting, communication, analysis, and execution.</p>
            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 text-sm leading-7 text-steel">
              For complimentary AI Productivity Assessment sessions, Nexora provides facilitation at no professional fee. The host organization provides the venue and handles necessary local logistics. For engagements outside Nexora's primary operating region, reasonable travel and accommodation support may be requested where applicable.
            </div>
          </div>
          <WebsiteForm kind="corporate" title="Request corporate training" cta="Book a Free AI Productivity Assessment" />
        </div>
      </section>
      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            <PremiumCard><ClipboardCheck className="h-8 w-8 text-signal" /><h2 className="mt-8 text-2xl font-semibold text-white">Diagnose workflows</h2><p className="mt-4 text-sm leading-7 text-steel">Identify where AI can improve daily productivity, reporting, and decision support.</p></PremiumCard>
            <PremiumCard><Building2 className="h-8 w-8 text-signal" /><h2 className="mt-8 text-2xl font-semibold text-white">Train practical teams</h2><p className="mt-4 text-sm leading-7 text-steel">Run focused workshops for departments, managers, and execution teams.</p></PremiumCard>
            <PremiumCard><CheckCircle2 className="h-8 w-8 text-signal" /><h2 className="mt-8 text-2xl font-semibold text-white">Adopt responsibly</h2><p className="mt-4 text-sm leading-7 text-steel">Build safe, useful AI habits that fit your actual operations.</p></PremiumCard>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div><h3 className="text-3xl font-semibold text-white">Training formats</h3><div className="mt-5 grid gap-3">{formats.map((item) => <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-frost">{item}</p>)}</div></div>
            <div><h3 className="text-3xl font-semibold text-white">Industries served</h3><div className="mt-5 grid grid-cols-2 gap-3">{industries.map((item) => <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-frost">{item}</p>)}</div></div>
          </div>
        </div>
      </section>
    </>
  )
}

