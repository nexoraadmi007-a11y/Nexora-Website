import Link from 'next/link'
import { ArrowRight, Award, BriefcaseBusiness, CheckCircle2, Layers3, Target } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import type { CourseTrack } from '@/lib/course-tracks'

type TrackShowcaseProps = {
  tracks: CourseTrack[]
  programName: string
  priceLabel: string
  pathwayCopy: string
  applyHref: string
  otherTracksHref: string
}

export default function TrackShowcase({ tracks, programName, priceLabel, pathwayCopy, applyHref, otherTracksHref }: TrackShowcaseProps) {
  return (
    <>
      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-4xl">
            <span className="eyebrow">Modular learning tracks</span>
            <h2 className="mt-5 text-4xl font-semibold text-white md:text-5xl">{programName}</h2>
            <p className="mt-5 text-base leading-8 text-steel md:text-lg">{pathwayCopy}</p>
            <p className="mt-5 text-2xl font-semibold text-white">{priceLabel}</p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {tracks.map((track, index) => (
              <PremiumCard key={track.slug} delay={index * 0.03} className="flex min-h-[560px] flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">Track {index + 1}</p>
                    <h3 className="mt-4 text-2xl font-semibold text-white">{track.name}</h3>
                  </div>
                  <div className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-bold uppercase text-frost">Capstone</div>
                </div>
                <p className="mt-5 text-sm leading-7 text-steel">{track.goal}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Metric label="Modules" value={String(track.modules.length)} />
                  <Metric label="Project" value="Final" />
                  <Metric label="Price" value={`NGN ${track.price.toLocaleString()}`} />
                </div>
                <div className="mt-7">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">Skills acquired</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {track.skills.slice(0, 7).map((skill) => (
                      <span key={skill} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-semibold text-frost">{skill}</span>
                    ))}
                  </div>
                </div>
                <a href={`#${track.slug}`} className="button-secondary mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
                  View Track Details
                  <ArrowRight className="h-4 w-4" />
                </a>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.015]">
        {tracks.map((track, index) => (
          <article key={track.slug} id={track.slug} className="section border-b border-white/10 last:border-b-0">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">Track {index + 1}</p>
                <h2 className="mt-4 text-4xl font-semibold text-white md:text-5xl">{track.name}</h2>
                <p className="mt-5 text-base leading-8 text-steel">{track.overview}</p>
                <div className="mt-6 grid gap-3">
                  <InfoLine icon={Target} label="Goal" body={track.goal} />
                  <InfoLine icon={Layers3} label="Structure" body={`${track.modules.length} modules plus final capstone project`} />
                  <InfoLine icon={Award} label="Price" body={`NGN ${track.price.toLocaleString()} per programme`} />
                </div>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a href={applyHref} className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
                    Enroll in this Track
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link href={otherTracksHref} className="button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold">
                    View Other Tracks
                  </Link>
                </div>
              </div>

              <div className="grid gap-5">
                <PremiumCard>
                  <h3 className="text-2xl font-semibold text-white">Learning Objectives</h3>
                  <Checklist items={track.objectives} />
                </PremiumCard>

                <PremiumCard>
                  <h3 className="text-2xl font-semibold text-white">Complete Module Breakdown</h3>
                  <div className="mt-6 grid gap-3">
                    {track.modules.map((module, moduleIndex) => (
                      <details key={module.title} className="rounded-2xl border border-white/10 bg-black/20 p-4 open:border-signal/40">
                        <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                          Module {moduleIndex + 1}: {module.title}
                        </summary>
                        <ul className="mt-4 grid gap-3">
                          {module.lessons.map((lesson) => (
                            <li key={lesson} className="flex gap-3 text-sm leading-6 text-steel">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                              <span>{lesson}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                </PremiumCard>

                <PremiumCard className="border-signal/30 bg-signal/[0.045]">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-frost">Final Capstone Project</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">Certification project</h3>
                  <p className="mt-4 text-sm leading-7 text-steel">{track.capstone}</p>
                  <p className="mt-4 text-sm leading-7 text-frost">Certification depends on completing all modules, passing assessments, and successfully submitting the final capstone project.</p>
                </PremiumCard>

                <div className="grid gap-5 md:grid-cols-2">
                  <PremiumCard>
                    <h3 className="text-2xl font-semibold text-white">Who This Track Is For</h3>
                    <Checklist items={track.whoFor} />
                  </PremiumCard>
                  <PremiumCard>
                    <h3 className="text-2xl font-semibold text-white">Skills You Will Gain</h3>
                    <Checklist items={track.skills} />
                  </PremiumCard>
                </div>

                <PremiumCard>
                  <h3 className="text-2xl font-semibold text-white">After Completing This Track</h3>
                  <Checklist items={track.outcomes} />
                </PremiumCard>

                <PremiumCard>
                  <div className="flex items-center gap-3">
                    <BriefcaseBusiness className="h-6 w-6 text-signal" />
                    <h3 className="text-2xl font-semibold text-white">Where This Track Can Take You</h3>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {track.careers.map((career) => (
                      <span key={career} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-sm font-semibold text-frost">{career}</span>
                    ))}
                  </div>
                </PremiumCard>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-steel">{label}</p><p className="mt-1 text-lg font-bold text-white">{value}</p></div>
}

function InfoLine({ icon: Icon, label, body }: { icon: typeof Target; label: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">{label}</p>
        <p className="mt-1 text-sm leading-6 text-frost">{body}</p>
      </div>
    </div>
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
