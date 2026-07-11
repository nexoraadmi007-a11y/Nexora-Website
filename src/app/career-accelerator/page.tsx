import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart3, BriefcaseBusiness, CheckCircle2, Code2, Megaphone, Palette, Sparkles, type LucideIcon } from 'lucide-react'
import CareerTrackSelector from '@/components/sections/CareerTrackSelector'
import PremiumCard from '@/components/ui/PremiumCard'
import { calculateCareerTrackPricing, careerAcceleratorTracks } from '@/lib/career-accelerator-v2'

export const metadata: Metadata = {
  title: 'Career Accelerator Tracks | NEXORA Institute',
  description: 'Choose one or more AI-powered career tracks in data analysis, digital marketing, software building, business operations, or UI/UX design.',
}

const icons: Record<string, LucideIcon> = {
  'ai-powered-data-analyst': BarChart3,
  'ai-powered-digital-marketing-specialist': Megaphone,
  'ai-powered-software-builder': Code2,
  'ai-powered-business-operations-specialist': BriefcaseBusiness,
  'ai-powered-ui-ux-designer': Palette,
}

export default function CareerAcceleratorPage() {
  const single = calculateCareerTrackPricing(['one'])
  const bundle = calculateCareerTrackPricing(['one', 'two'])

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-36 md:px-8 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">Career Accelerator V2</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">
              Choose the AI career path that fits your next move.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">
              The Career Accelerator is now a collection of five independent tracks. Start with one track, combine two at bundle price, and build a portfolio that shows real work.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#tracks" className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
                Choose Your Career Path
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#enroll" className="button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold">
                Select Track(s)
              </a>
            </div>
          </div>

          <div className="glass rounded-lg p-5 md:p-7">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-signal" />
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-frost">Pricing engine</p>
            </div>
            <div className="mt-6 grid gap-4">
              <PriceRow label="Single Track" value={`NGN ${single.total.toLocaleString()}`} note="Pick one career path" />
              <PriceRow label="Any Two Tracks" value={`NGN ${bundle.total.toLocaleString()}`} note={`Save NGN ${bundle.discount.toLocaleString()} with the bundle`} />
              <PriceRow label="More Tracks" value="Expandable" note="Built for future bundle rules" />
            </div>
          </div>
        </div>
      </section>

      <section id="tracks" className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-4xl">
            <span className="eyebrow">Choose Your Career Path</span>
            <h2 className="mt-5 text-4xl font-semibold text-white md:text-5xl">Five focused tracks. One practical career system.</h2>
            <p className="mt-5 text-base leading-8 text-steel md:text-lg">
              Each card leads to a full track page with curriculum, tools, projects, portfolio outcomes, FAQs, and enrollment.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {careerAcceleratorTracks.map((track, index) => {
              const Icon = icons[track.slug] || Sparkles
              return (
                <PremiumCard key={track.slug} delay={index * 0.03} className="flex min-h-[620px] flex-col rounded-lg">
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
                  <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2">
                    <Link href={`/career-accelerator/${track.slug}`} className="button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold">
                      Learn More
                    </Link>
                    <Link href={`/career-accelerator/${track.slug}#enroll`} className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold">
                      Select Track
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
          <span className="eyebrow">Compare Tracks</span>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold text-white md:text-5xl">See the difference before you choose.</h2>
          <div className="mt-10 overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-[1100px] w-full border-collapse bg-black/20 text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="w-44 p-4 text-xs uppercase tracking-[0.12em] text-steel">Compare</th>
                  {careerAcceleratorTracks.map((track) => <th key={track.slug} className="p-4 text-white">{track.shortTitle}</th>)}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Best For" values={careerAcceleratorTracks.map((track) => track.bestFor)} />
                <CompareRow label="Skills" values={careerAcceleratorTracks.map((track) => track.skills.slice(0, 4).join(', '))} />
                <CompareRow label="Portfolio" values={careerAcceleratorTracks.map((track) => track.portfolio.slice(0, 3).join(', '))} />
                <CompareRow label="Duration" values={careerAcceleratorTracks.map((track) => track.duration)} />
                <CompareRow label="Price" values={careerAcceleratorTracks.map((track) => `NGN ${track.price.toLocaleString()}`)} />
                <CompareRow label="Career Opportunities" values={careerAcceleratorTracks.map((track) => track.opportunities.slice(0, 3).join(', '))} />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <CareerTrackSelector />
    </>
  )
}

function PriceRow({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold text-white">{label}</p>
        <p className="text-lg font-bold text-frost">{value}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-steel">{note}</p>
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
