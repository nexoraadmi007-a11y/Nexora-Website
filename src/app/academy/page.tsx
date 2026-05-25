import { BrainCircuit, GraduationCap, SearchCheck, Workflow, type LucideIcon } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { PageBand, PageHero } from '@/components/sections/PageShell'

const tracks: Array<[string, string, LucideIcon]> = [
  ['AI Operators', 'Deploy and manage AI-assisted operational systems inside real organizations.', BrainCircuit],
  ['AI Auditors', 'Assess the quality, reliability, and usefulness of intelligent operating systems.', SearchCheck],
  ['Workflow System Operators', 'Design and manage workflow infrastructure across business functions.', Workflow],
  ['Operational Intelligence Training', 'Build the judgment needed to identify inefficiencies and improve execution.', GraduationCap],
]

export default function AcademyPage() {
  return (
    <>
      <PageHero label="NEXORA Academy" title={<>Building Africa's Next <span className="gradient-text">AI Operators.</span></>} copy="NEXORA Academy develops the talent layer required for intelligent operations: operators, auditors, workflow system builders, and operational intelligence professionals." />
      <PageBand>
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader label="Training Tracks" title="Operational intelligence is a discipline." />
          <div className="grid gap-4 md:grid-cols-2">
            {tracks.map(([title, copy, Icon], i) => (
              <PremiumCard key={title as string} delay={i * 0.05}>
                <Icon className="mb-10 h-7 w-7 text-signal" />
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
