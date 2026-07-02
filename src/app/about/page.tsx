import type { Metadata } from 'next'
import { BookOpenCheck, Globe2, GraduationCap, Target } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'About NEXORA Institute',
  description: 'NEXORA Institute equips young professionals and business owners with practical AI skills for careers, businesses, and productivity.',
}

const principles = [
  ['Practical before theoretical', 'We focus on usable AI skills that help people work, build, communicate, analyze, and execute better.'],
  ['Outcome-driven learning', 'Every program is structured around practical deliverables, not passive content consumption.'],
  ['Africa as context', 'NEXORA teaches with Nigerian and African work realities in mind while maintaining a global standard.'],
  ['Systems that support growth', 'Our CRM, payments, applications, and follow-up systems keep the learner experience organized from interest to enrollment.'],
]

const timeline = [
  ['Mission', 'Equip young professionals and business owners with practical AI skills that improve careers, businesses, and productivity.'],
  ['Vision', 'Build one of Africa\'s most trusted practical AI training institutes for work and business transformation.'],
  ['Founder Standard', 'NEXORA is designed for serious learners, business operators, and companies that want AI to become useful in real daily work.'],
]

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-20 md:pt-40">
        <div className="grid-field absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-end">
          <div>
            <span className="eyebrow mb-6">About NEXORA</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">A practical AI training institute for careers and businesses.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">
              NEXORA Institute helps students, graduates, young professionals, entrepreneurs, and business owners turn AI from abstract conversation into practical capability.
            </p>
          </div>
          <PremiumCard className="rounded-2xl">
            <GraduationCap className="h-8 w-8 text-signal" />
            <h2 className="mt-7 text-2xl font-semibold text-white">Built around usable skill.</h2>
            <p className="mt-4 text-sm leading-7 text-steel">Our programs focus on AI productivity, career assets, business systems, content, customer support, CRM, and workplace execution.</p>
          </PremiumCard>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <span className="eyebrow mb-5">Principles</span>
          <h2 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">How NEXORA thinks about AI education.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {principles.map(([title, copy]) => (
              <PremiumCard key={title} className="rounded-2xl">
                <BookOpenCheck className="h-7 w-7 text-signal" />
                <h3 className="mt-6 text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.015] px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="eyebrow mb-5">Direction</span>
            <h2 className="text-4xl font-semibold text-white md:text-5xl">One clear institute story.</h2>
          </div>
          <div className="grid gap-4">
            {timeline.map(([title, copy], index) => (
              <div key={title} className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:grid-cols-[120px_1fr] md:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">0{index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
                </div>
                <p className="text-sm leading-7 text-steel">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          <PremiumCard className="rounded-2xl"><Target className="h-8 w-8 text-signal" /><h3 className="mt-7 text-2xl font-semibold text-white">Careers</h3><p className="mt-4 text-sm leading-7 text-steel">AI skills, portfolio assets, job readiness, freelancing, and professional confidence.</p></PremiumCard>
          <PremiumCard className="rounded-2xl"><Globe2 className="h-8 w-8 text-signal" /><h3 className="mt-7 text-2xl font-semibold text-white">Businesses</h3><p className="mt-4 text-sm leading-7 text-steel">AI marketing, customer support, sales automation, CRM, content, and operations.</p></PremiumCard>
          <PremiumCard className="rounded-2xl"><GraduationCap className="h-8 w-8 text-signal" /><h3 className="mt-7 text-2xl font-semibold text-white">Companies</h3><p className="mt-4 text-sm leading-7 text-steel">Corporate AI training, employee upskilling, productivity workshops, and leadership awareness.</p></PremiumCard>
        </div>
      </section>
    </>
  )
}
