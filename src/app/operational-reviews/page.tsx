import { FileSearch, Layers3, Map, RefreshCw, Zap, type LucideIcon } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import Button from '@/components/ui/Button'
import SectionHeader from '@/components/ui/SectionHeader'
import { PageBand, PageHero } from '@/components/sections/PageShell'
import OperationalReviewChatbot from '@/components/sections/OperationalReviewChatbot'

const deliverables: Array<[string, string, LucideIcon]> = [
  ['Operational Diagnosis', 'A clear picture of where inefficiencies, gaps, and bottlenecks live.', FileSearch],
  ['Workflow Map', 'A structured map of how work currently moves across people, tools, and decisions.', Map],
  ['Infrastructure Design', 'A practical architecture for better coordination, communication, and execution.', Layers3],
  ['Quick Wins', 'Immediate improvements that reduce friction before deeper system deployment.', Zap],
  ['Optimization Roadmap', 'A phased plan for moving from diagnosis to measurable operational improvement.', RefreshCw],
]

export default function ReviewsPage() {
  return (
    <>
      <PageHero label="Operational Reviews" title={<>Find the hidden friction inside your <span className="gradient-text">operating system.</span></>} copy="A NEXORA Operational Review is a structured diagnostic for organizations that want clarity before investing in systems, automation, or AI-assisted operations." />
      <PageBand>
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader label="Deliverables" title="What you receive." />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {deliverables.map(([title, copy, Icon], i) => (
              <PremiumCard key={title as string} delay={i * 0.04}>
                <Icon className="mb-8 h-6 w-6 text-signal" />
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
              </PremiumCard>
            ))}
          </div>
          <div className="mt-12 text-center"><Button href="/contact">Request Operational Review</Button></div>
          <div className="mt-16">
            <OperationalReviewChatbot />
          </div>
        </div>
      </PageBand>
    </>
  )
}
