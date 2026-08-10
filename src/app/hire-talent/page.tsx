import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ClipboardCheck, GraduationCap, UsersRound } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Hire Nexura Talent | Nexura Institute',
  description: 'Companies can speak with Nexura Institute about assessed learners, internship sourcing, project teams and emerging AI-ready talent.',
}

const offers = [
  ['Skills assessment', 'Review learner capability using programme completion, project evidence and feedback.'],
  ['Talent shortlisting', 'Identify eligible learners for internships, entry-level roles, project work and support teams.'],
  ['Project teams', 'Build small teams for content, research, analysis, automation or AI data support where available.'],
]

export default function HireTalentPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-20 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="relative mx-auto max-w-7xl">
          <span className="eyebrow mb-6">For Employers</span>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Hire emerging AI-ready talent with proof of work.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">
            Nexura Institute helps companies discover learners who have completed practical training, built portfolio evidence, and shown readiness for internships, early roles, project teams and AI-supported work.
          </p>
          <Link href="/contact" className="button-primary mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
            Talk to the Talent Team <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-3 md:px-8">
          {offers.map(([title, copy], index) => {
            const icons = [ClipboardCheck, GraduationCap, UsersRound]
            const Icon = icons[index]
            return (
              <PremiumCard key={title} className="rounded-lg">
                <Icon className="h-8 w-8 text-signal" />
                <h2 className="mt-7 text-2xl font-semibold text-white">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            )
          })}
        </div>
      </section>
    </>
  )
}
