import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, CalendarDays, ClipboardList, FolderKanban, Gauge, GraduationCap } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Member Workspace | Nexura Institute',
  description: 'A role-aware Nexura member workspace shell for learners, partners, alumni and admins.',
}

const progress: Array<{
  label: string
  title: string
  detail: string
  icon: typeof GraduationCap
}> = [
  { label: 'Programme Progress', title: 'AI Financial & Business Analysis', detail: '42% complete', icon: GraduationCap },
  { label: 'Next Live Class', title: 'Financial Statements with AI', detail: 'Thursday, 7:00 PM', icon: CalendarDays },
  { label: 'Assignments', title: '2 due', detail: 'Practical work awaiting submission', icon: ClipboardList },
  { label: 'Portfolio', title: '3 / 6 projects completed', detail: 'Keep building proof of work', icon: FolderKanban },
  { label: 'Income Readiness', title: 'Profile 60% | Portfolio 40%', detail: 'Improve your service offer', icon: Gauge },
  { label: 'Opportunities', title: 'Eligibility grows with completion', detail: 'No guaranteed placement', icon: BriefcaseBusiness },
]

export default function MemberPage() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32 md:px-8 md:pt-44">
      <div className="grid-field absolute inset-0 opacity-45" />
      <div className="relative mx-auto max-w-7xl">
        <span className="eyebrow mb-6">Member Platform Preview</span>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Good morning, Ada.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">Here&apos;s what&apos;s happening with your learning, portfolio and opportunity readiness.</p>
          </div>
          <Link href="/learn" className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
            Continue Learning <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {progress.map(({ label, title, detail, icon: Icon }) => (
            <PremiumCard key={label} className="rounded-lg">
              <Icon className="h-7 w-7 text-signal" />
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-steel">{label}</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-steel">{detail}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  )
}
