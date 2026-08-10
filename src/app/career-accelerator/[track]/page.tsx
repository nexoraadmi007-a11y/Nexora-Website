import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Award, BriefcaseBusiness, CheckCircle2, Layers3, Lightbulb, Target, Wrench } from 'lucide-react'
import CareerTrackSelector from '@/components/sections/CareerTrackSelector'
import PremiumCard from '@/components/ui/PremiumCard'
import { careerAcceleratorTracks, getCareerTrack } from '@/lib/career-accelerator-v2'

type PageProps = {
  params: Promise<{ track: string }>
}

export function generateStaticParams() {
  return careerAcceleratorTracks.map((track) => ({ track: track.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { track: slug } = await params
  const track = getCareerTrack(slug)
  if (!track) return { title: 'Learning Track Not Found | Nexura Institute' }
  return {
    title: `${track.title} | AI Income Accelerator`,
    description: track.description,
  }
}

export default async function CareerTrackPage({ params }: PageProps) {
  const { track: slug } = await params
  const track = getCareerTrack(slug)
  if (!track) notFound()

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-32 md:px-8 md:pt-40">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/learn" className="button-secondary inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Back to AI Income Accelerator
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <span className="eyebrow mb-7">AI Income Accelerator Track</span>
              <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">{track.title}</h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">{track.description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#enroll" className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
                  Enrol in this Programme
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#curriculum" className="button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold">
                  View Curriculum
                </a>
              </div>
            </div>
            <div className="glass rounded-lg p-5 md:p-7">
              <div className="grid gap-4">
                <HeroMetric label="Duration" value={track.duration} />
                <HeroMetric label="Price" value={`NGN ${track.price.toLocaleString()}`} />
                <HeroMetric label="Certificate" value="Included after capstone review" />
                <HeroMetric label="Professional Path" value={track.profession} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <span className="eyebrow">Career Overview</span>
            <h2 className="mt-5 text-4xl font-semibold text-white md:text-5xl">What this programme prepares you to do.</h2>
            <p className="mt-5 text-base leading-8 text-steel">{track.overview}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <InfoCard icon={Target} title="Goal" items={[track.goal]} />
            <InfoCard icon={Lightbulb} title="Who This Is For" items={[track.bestFor]} />
            <InfoCard icon={Award} title="Professional Identity" items={[track.profession]} />
            <InfoCard icon={BriefcaseBusiness} title="Why companies hire this role" items={track.whyCompaniesHire} />
            <InfoCard icon={Wrench} title="AI tools used" items={track.tools} />
          </div>
        </div>
      </section>

      <section id="curriculum" className="section border-t border-white/10 bg-white/[0.012]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:px-8 lg:grid-cols-[.75fr_1.25fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow">Detailed Curriculum</span>
            <h2 className="mt-5 text-4xl font-semibold text-white md:text-5xl">Modules, assignments, capstone, and portfolio.</h2>
            <p className="mt-5 text-base leading-8 text-steel">
              The curriculum is practical and portfolio-driven. Every module helps you produce something useful, not just watch lessons.
            </p>
          </div>
          <div className="grid gap-5">
            <PremiumCard>
              <h3 className="text-2xl font-semibold text-white">Learning Outcomes</h3>
              <Checklist items={track.outcomes} />
            </PremiumCard>

            <PremiumCard>
              <div className="flex items-center gap-3">
                <Layers3 className="h-6 w-6 text-signal" />
                <h3 className="text-2xl font-semibold text-white">Modules</h3>
              </div>
              <div className="mt-6 grid gap-3">
                {track.modules.map((module, index) => (
                  <details key={module.title} className="rounded-lg border border-white/10 bg-black/20 p-4 open:border-signal/40">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-white">Module {index + 1}: {module.title}</summary>
                    <Checklist items={module.lessons} />
                  </details>
                ))}
              </div>
            </PremiumCard>

            <div className="grid gap-5 md:grid-cols-2">
              <PremiumCard>
                <h3 className="text-2xl font-semibold text-white">Assignments</h3>
                <Checklist items={track.assignments} />
              </PremiumCard>
              <PremiumCard>
                <h3 className="text-2xl font-semibold text-white">Projects</h3>
                <Checklist items={track.projects} />
              </PremiumCard>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <PremiumCard>
                <h3 className="text-2xl font-semibold text-white">Portfolio</h3>
                <Checklist items={track.portfolio} />
              </PremiumCard>
              <PremiumCard>
                <h3 className="text-2xl font-semibold text-white">Tools</h3>
                <Checklist items={track.tools} />
              </PremiumCard>
            </div>

            <PremiumCard className="border-signal/30 bg-signal/[0.045]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-frost">Capstone Project</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Final proof of skill</h3>
              <p className="mt-4 text-sm leading-7 text-steel">{track.capstone}</p>
            </PremiumCard>
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:px-8 lg:grid-cols-3">
          <InfoCard icon={BriefcaseBusiness} title="Career Opportunities" items={track.opportunities} />
          <InfoCard icon={Target} title="Real-World Applications" items={track.applications} />
          <InfoCard icon={Award} title="Certificate Information" items={[track.certificate]} />
        </div>
      </section>

      <section className="section border-t border-white/10 bg-white/[0.012]">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <span className="eyebrow">Frequently Asked Questions</span>
          <div className="mt-8 grid gap-4">
            {track.faqs.map((faq) => (
              <details key={faq.question} className="rounded-lg border border-white/10 bg-black/20 p-5 open:border-signal/40">
                <summary className="cursor-pointer list-none text-base font-semibold text-white">{faq.question}</summary>
                <p className="mt-4 text-sm leading-7 text-steel">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CareerTrackSelector defaultTrackSlug={track.slug} />
    </>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-black/20 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">{label}</p><p className="mt-2 text-lg font-semibold text-white">{value}</p></div>
}

function InfoCard({ icon: Icon, title, items }: { icon: typeof Target; title: string; items: string[] }) {
  return (
    <PremiumCard className="rounded-lg">
      <Icon className="h-6 w-6 text-signal" />
      <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
      <Checklist items={items} />
    </PremiumCard>
  )
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-steel">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
