import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, CheckCircle2, GraduationCap, type LucideIcon } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import { getPrograms } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Programs | NEXORA Institute',
  description: 'Choose a NEXORA Institute AI training program for career growth or business transformation.',
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
    name: 'AI Career Accelerator',
    slug: 'career-accelerator',
    priceLabel: 'NGN 10,000 per track',
    duration: '5 career tracks',
    target: ['NYSC Members', 'Final-Year Students', 'Graduates', 'Young Professionals'],
    focus: ['AI productivity', 'Excel and Power BI', 'ChatGPT', 'Portfolio, CV, LinkedIn, and job readiness'],
    icon: GraduationCap,
  },
  {
    code: 'BATP',
    name: 'AI Business Transformation Accelerator',
    slug: 'business-ai-transformation',
    priceLabel: 'NGN 5,000 per track',
    duration: '3 business tracks',
    target: ['Business Owners', 'Entrepreneurs', 'SMEs'],
    focus: ['AI marketing', 'AI customer support', 'Website and brand assets', 'Sales automation, CRM, and operations'],
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
          <span className="eyebrow mb-6">Programs</span>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">
            Choose the practical AI program that matches your next move.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">
            NEXORA Institute helps career builders and business owners learn AI through structured, outcome-driven programs.
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
