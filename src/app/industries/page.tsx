import { BookOpen, Sun } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'
import SectionHeader from '@/components/ui/SectionHeader'
import { PageBand, PageHero } from '@/components/sections/PageShell'

const industries = [
  {
    name: 'Schools',
    icon: BookOpen,
    copy: 'Schools operate through dense human coordination: admissions, attendance, academic reporting, parent communication, fee management, staff tasks, and compliance.',
    points: ['Parent-school communication gaps', 'Manual fee and attendance workflows', 'Fragmented academic visibility', 'Staff coordination without clear systems'],
  },
  {
    name: 'Solar Companies',
    icon: Sun,
    copy: 'Solar companies rely on precision across sales, site assessment, installation, maintenance, payment follow-up, and customer trust.',
    points: ['Weak sales and installation handoffs', 'Poor follow-up across customer journeys', 'Disconnected field and office visibility', 'Payment recovery and service coordination gaps'],
  },
]

export default function IndustriesPage() {
  return (
    <>
      <PageHero label="Industries" title={<>Operational infrastructure partner for <span className="gradient-text">schools and solar companies.</span></>} copy="NEXORA focuses where operational efficiency directly affects trust, growth, and service quality." />
      <PageBand>
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader label="Current Focus" title="Depth before breadth." copy="We prioritize industries where communication, workflows, and coordination are mission-critical." />
          <div className="grid gap-5 lg:grid-cols-2">
            {industries.map(({ name, icon: Icon, copy, points }) => (
              <PremiumCard key={name} className="min-h-[520px]">
                <Icon className="h-9 w-9 text-signal" />
                <h2 className="mt-12 text-4xl font-semibold text-white">{name}</h2>
                <p className="mt-5 text-base leading-8 text-steel">{copy}</p>
                <div className="mt-8 grid gap-3">
                  {points.map((point) => <div key={point} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-frost">{point}</div>)}
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>
      </PageBand>
    </>
  )
}
