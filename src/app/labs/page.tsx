import { Boxes, GraduationCap, Landmark, Radar, type LucideIcon } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { PageBand, PageHero } from '@/components/sections/PageShell'

const products: Array<[string, string, LucideIcon]> = [
  ['Ordo', 'An operational coordination layer for tasks, workflows, handoffs, and visibility.', Boxes],
  ['Educational Workflow Systems', 'Infrastructure for admissions, parent communication, academic coordination, and administration.', GraduationCap],
  ['Payment Recovery Infrastructure', 'Intelligent systems for follow-up, reminders, escalation, and revenue coordination.', Landmark],
  ['Operational Intelligence Products', 'Tools that measure, surface, and improve operational performance across organizations.', Radar],
]

export default function LabsPage() {
  return (
    <>
      <PageHero label="NEXORA Labs" title={<>Future infrastructure for <span className="gradient-text">intelligent operations.</span></>} copy="NEXORA Labs is the product arm building operational intelligence systems for African organizations that need durable infrastructure, not temporary hacks." />
      <PageBand>
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader label="Products" title="Designed as infrastructure." />
          <div className="grid gap-4 md:grid-cols-2">
            {products.map(([title, copy, Icon], i) => (
              <PremiumCard key={title as string} delay={i * 0.05}>
                <Icon className="mb-10 h-7 w-7 text-signal" />
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-steel/60">NEXORA Labs</p>
                <h3 className="text-3xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </PageBand>
    </>
  )
}
