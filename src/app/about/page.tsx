import PremiumCard from '@/components/ui/PremiumCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { PageBand, PageHero } from '@/components/sections/PageShell'

const principles = [
  ['Infrastructure before aesthetics', 'NEXORA designs systems that survive real operational pressure, not surface-level novelty.'],
  ['Operational truth first', 'We diagnose before prescribing. The real workflow is always more important than the assumed workflow.'],
  ['Systems over heroics', 'Strong organizations do not depend on exceptional individuals to remember everything. They depend on reliable infrastructure.'],
  ['Africa as context', 'We build with deep local operating realities in mind, while holding a global standard for quality.'],
]

export default function AboutPage() {
  return (
    <>
      <PageHero label="About NEXORA" title={<>Operational intelligence for organizations built to <span className="gradient-text">scale with clarity.</span></>} copy="NEXORA is an Operational Intelligence and Infrastructure Company. We help organizations understand how work moves, where value leaks, and what systems must be deployed to improve execution." />
      <PageBand>
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader align="left" label="Philosophy" title="We treat operations as infrastructure." copy="Every organization has an operating system, whether designed intentionally or assembled by habit. NEXORA makes that system visible, measurable, and improvable." />
          <div className="grid gap-4 md:grid-cols-2">
            {principles.map(([title, copy], i) => (
              <PremiumCard key={title} delay={i * 0.05}>
                <h3 className="text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </PageBand>
    </>
  )
}
