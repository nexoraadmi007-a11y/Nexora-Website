import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, FileText, Palette, Wallet, type LucideIcon } from 'lucide-react'
import CareerTrackSelector from '@/components/sections/CareerTrackSelector'
import PremiumCard from '@/components/ui/PremiumCard'
import { careerAcceleratorTracks } from '@/lib/career-accelerator-v2'

export const metadata: Metadata = {
  title: 'Career Accelerator Programmes | NEXORA Institute',
  description: 'Choose one of three practical AI Career Accelerator programmes: AI Content Creation, Certified UI/UX Designer, or AI Financial Analyst.',
}

const icons: Record<string, LucideIcon> = {
  'ai-content-creation': FileText,
  'ui-ux-designer': Palette,
  'ai-financial-analyst': Wallet,
}

const philosophy = [
  ['Professional foundations', 'Learn the thinking, language, standards, and judgement behind the profession before using tools.'],
  ['AI-powered execution', 'Use AI to research, draft, analyse, design, improve, and speed up work while checking quality.'],
  ['Portfolio and certification', 'Complete assignments and a capstone project that prove practical ability.'],
]

export default function CareerAcceleratorPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-36 md:px-8 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">Career Accelerator V3</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">
              Choose one AI-powered career programme and build practical proof of skill.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">
              The Career Accelerator now focuses on three clear professional paths: content creation, UI/UX design, and financial analysis. Each programme costs NGN 10,000 and leads to a capstone portfolio.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#programmes" className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
                Choose Your Programme
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#enroll" className="button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold">
                Enrol Now
              </a>
            </div>
          </div>

          <div className="glass rounded-lg p-5 md:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-frost">Programme Snapshot</p>
            <div className="mt-6 grid gap-4">
              <Metric label="Programmes" value="3 focused options" />
              <Metric label="Price" value="NGN 10,000 each" />
              <Metric label="Structure" value="Modules, assignments, capstone, certificate" />
            </div>
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10 bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-4xl">
            <span className="eyebrow">Learn to Think Like a Professional</span>
            <h2 className="mt-5 text-4xl font-semibold text-white md:text-5xl">AI supports the work. It does not replace professional thinking.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {philosophy.map(([title, copy]) => (
              <PremiumCard key={title} className="rounded-lg">
                <h3 className="text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section id="programmes" className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-4xl">
            <span className="eyebrow">Choose Your Programme</span>
            <h2 className="mt-5 text-4xl font-semibold text-white md:text-5xl">Three practical career programmes.</h2>
            <p className="mt-5 text-base leading-8 text-steel md:text-lg">
              Each programme has a dedicated page with curriculum, assignments, capstone, portfolio outcomes, FAQs, and enrolment.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {careerAcceleratorTracks.map((track, index) => {
              const Icon = icons[track.slug] || FileText
              return (
                <PremiumCard key={track.slug} delay={index * 0.03} className="flex min-h-[610px] flex-col rounded-lg">
                  <Icon className="h-8 w-8 text-signal" />
                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-steel">{track.duration}</p>
                  <h3 className="mt-4 text-2xl font-semibold text-white">{track.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-steel">{track.description}</p>
                  <p className="mt-5 text-2xl font-semibold text-white">NGN {track.price.toLocaleString()}</p>
                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Skills learned</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {track.skills.slice(0, 5).map((skill) => <span key={skill} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-semibold text-frost">{skill}</span>)}
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Career opportunities</p>
                    <div className="mt-3 grid gap-2">
                      {track.opportunities.slice(0, 3).map((career) => (
                        <p key={career} className="flex gap-3 text-sm leading-6 text-steel">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                          <span>{career}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto grid gap-3 pt-8">
                    <Link href={`/career-accelerator/${track.slug}`} className="button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold">
                      View Programme
                    </Link>
                    <Link href={`/career-accelerator/${track.slug}#enroll`} className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold">
                      Enrol for NGN {track.price.toLocaleString()}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </PremiumCard>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10 bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <span className="eyebrow">Compare Programmes</span>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold text-white md:text-5xl">Choose the path that matches the work you want to do.</h2>
          <div className="mt-10 overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-[900px] w-full border-collapse bg-black/20 text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="w-44 p-4 text-xs uppercase tracking-[0.12em] text-steel">Compare</th>
                  {careerAcceleratorTracks.map((track) => <th key={track.slug} className="p-4 text-white">{track.shortTitle}</th>)}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Best For" values={careerAcceleratorTracks.map((track) => track.bestFor)} />
                <CompareRow label="Profession" values={careerAcceleratorTracks.map((track) => track.profession)} />
                <CompareRow label="Core Skills" values={careerAcceleratorTracks.map((track) => track.skills.slice(0, 4).join(', '))} />
                <CompareRow label="Portfolio" values={careerAcceleratorTracks.map((track) => track.portfolio.slice(0, 3).join(', '))} />
                <CompareRow label="Capstone" values={careerAcceleratorTracks.map((track) => track.capstone)} />
                <CompareRow label="Price" values={careerAcceleratorTracks.map((track) => `NGN ${track.price.toLocaleString()}`)} />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <CareerTrackSelector />
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-white/10 last:border-b-0">
      <th className="p-4 align-top text-xs uppercase tracking-[0.12em] text-steel">{label}</th>
      {values.map((value, index) => <td key={`${label}-${index}`} className="p-4 align-top leading-6 text-steel">{value}</td>)}
    </tr>
  )
}
