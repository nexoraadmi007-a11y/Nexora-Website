import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, GraduationCap, type LucideIcon } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import { getPrograms } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Programmes | Nexura Institute',
  description: 'Choose a Nexura Institute programme for AI skills, income readiness, opportunity preparation or business transformation.',
}

const fallbackCards: Array<{
  code: string
  name: string
  slug: string
  priceLabel: string
  duration: string
  target: string[]
  focus: string[]
  icon: LucideIcon
}> = [
  {
    code: 'NGTP',
    name: 'AI Income Accelerator',
    slug: 'learn',
    priceLabel: 'NGN 10,000 per specialisation',
    duration: '4 specialisations',
    target: ['Undergraduates', 'Final-Year Students', 'NYSC Members', 'Recent Graduates', 'Early-Career Professionals'],
    focus: ['AI content and digital marketing', 'AI UI/UX and digital design', 'AI financial and business analysis', 'AI automation and no-code solutions', 'From Skill to Income'],
    icon: GraduationCap,
  },
  {
    code: 'BATP',
    name: 'AI Business Transformation Programme',
    slug: 'business-transformation',
    priceLabel: 'Pricing confirmed after review',
    duration: '4 weeks',
    target: ['Business Owners', 'Entrepreneurs', 'SMEs', 'Startups', 'Freelancers', 'Agencies'],
    focus: ['Brand identity', 'Website and lead capture', 'Marketing engine', 'Sales system and CRM', 'Automation, dashboards, and 90-day growth plan'],
    icon: BriefcaseBusiness,
  },
]

export default async function ProgramsPage() {
  const programs = await getPrograms()
  const cards = fallbackCards.map((card) => {
    const match = programs.find((program) => program.code === card.code)
    return match ? { ...card, name: match.name, slug: match.slug } : card
  })

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-20 md:pt-40">
        <div className="grid-field absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl">
          <span className="eyebrow mb-6">Programmes</span>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">
            Choose the practical AI pathway that matches your next move.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">
            Nexura Institute helps learners and business owners move from AI awareness to real capability, proof of work and opportunity readiness.
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {cards.map((program) => {
            const Icon = program.icon
            return (
              <PremiumCard key={program.code} className="flex min-h-[520px] flex-col rounded-2xl">
                <Icon className="h-8 w-8 text-signal" />
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-steel">{program.duration}</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">{program.name}</h2>
                <p className="mt-4 text-3xl font-semibold text-white">{program.priceLabel}</p>
                <div className="mt-7">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Best for</p>
                  <div className="mt-3 grid gap-2">
                    {program.target.map((item) => <p key={item} className="text-sm text-frost">{item}</p>)}
                  </div>
                </div>
                <div className="mt-7">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Focus</p>
                  <div className="mt-3 grid gap-3">
                    {program.focus.map((item) => (
                      <p key={item} className="flex gap-3 text-sm leading-6 text-steel">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <Link href={`/${program.slug}`} className="button-primary mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
                  Apply Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </PremiumCard>
            )
          })}
        </div>
      </section>
    </>
  )
}
