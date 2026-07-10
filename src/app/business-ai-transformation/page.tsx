import type { Metadata } from 'next'
import WebsiteForm from '@/components/sections/WebsiteForms'
import TrackShowcase from '@/components/sections/TrackShowcase'
import { businessTransformationTracks } from '@/lib/course-tracks'
import { getBusinessTransformation } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Business Transformation Tracks | Nexora Institute',
  description: 'Choose a Nexora Business Transformation track in MVP building, business operating systems, or business auditing and bottleneck analysis.',
}

const faqs = [
  ['Is this only for tech businesses?', 'No. These tracks are for practical business operators across services, retail, education, health, consulting, logistics, and other sectors.'],
  ['Can I take one track only?', 'Yes. Each Business Transformation track is independent, and learners can combine multiple tracks into a full pathway.'],
  ['Will this replace my staff?', 'No. The goal is to improve execution, operations, reporting, and decision-making with AI-supported systems.'],
]

export default async function BusinessAITransformationPage() {
  const program = await getBusinessTransformation()

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <span className="eyebrow mb-7">Business Transformation / Modular Tracks</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Build AI-powered business operating capability.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">
              {program.description} Learners can complete one track or combine multiple tracks into a full Business Transformation learning pathway.
            </p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Tracks</p><p className="mt-1 text-xl font-bold text-white">{businessTransformationTracks.length}</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Modules</p><p className="mt-1 text-xl font-bold text-white">6 + capstone</p></div>
              <div className="glass rounded-2xl p-4"><p className="text-xs text-steel">Price</p><p className="mt-1 text-xl font-bold text-white">NGN 5,000</p></div>
            </div>
          </div>
          <div id="apply">
            <WebsiteForm kind="batp" title="Apply for a Business Transformation Track" cta="Enroll in a Track" payAfterSubmit context={{ amount: 5000, programName: 'Business Transformation Track', programCode: 'BATP', cohort: 'Next Business Cohort' }} />
          </div>
        </div>
      </section>

      <TrackShowcase
        tracks={businessTransformationTracks}
        programName="Business Transformation Program"
        priceLabel="NGN 5,000 per Track"
        pathwayCopy="Complete one practical track for a focused business capability, or combine multiple tracks into a broader transformation pathway."
        applyHref="#apply"
        otherTracksHref="/career-accelerator"
      />

      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">FAQs</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {faqs.map(([question, answer]) => (
              <div key={question} className="glass rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-semibold text-white">{question}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
