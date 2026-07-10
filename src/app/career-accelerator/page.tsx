import type { Metadata } from 'next'
import WebsiteForm from '@/components/sections/WebsiteForms'
import TrackShowcase from '@/components/sections/TrackShowcase'
import { aiAcceleratorTracks } from '@/lib/course-tracks'
import { getCareerAccelerator, getCohorts } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Nexora AI Accelerator Tracks | NGN 10,000 per Track',
  description: 'Choose an AI Accelerator career track in content creation, UI/UX design, frontend development, backend development, or financial analysis.',
}

export default async function CareerAcceleratorPage() {
  const [program, cohorts] = await Promise.all([getCareerAccelerator(), getCohorts()])
  const cohort = cohorts[0]

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">AI Accelerator / Career Tracks</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Build a career-focused AI skill stack.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">
              {program.description} The programme is now modular, so learners can purchase individual tracks or combine multiple tracks into a complete AI Accelerator learning pathway.
            </p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Tracks</p><p className="mt-1 text-xl font-bold text-white">{aiAcceleratorTracks.length}</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Modules</p><p className="mt-1 text-xl font-bold text-white">6 + capstone</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Price</p><p className="mt-1 text-xl font-bold text-white">NGN 10,000</p></div>
            </div>
          </div>
          <div id="apply">
            <WebsiteForm kind="accelerator" title="Apply for an AI Accelerator Track" cta="Enroll in a Track" payAfterSubmit context={{ amount: 10000, programName: 'AI Accelerator Track', programCode: 'NGTP', cohort: cohort?.name || 'Next Cohort' }} />
          </div>
        </div>
      </section>

      <TrackShowcase
        tracks={aiAcceleratorTracks}
        programName="AI Accelerator Program"
        priceLabel="NGN 10,000 per Track"
        pathwayCopy="Start with the track that matches your career direction, then combine tracks into a broader AI Accelerator pathway as your portfolio grows."
        applyHref="#apply"
        otherTracksHref="/business-ai-transformation"
      />
    </>
  )
}
