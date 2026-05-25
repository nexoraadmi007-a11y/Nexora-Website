import { ArrowUpRight, BookOpen, BrainCircuit, GraduationCap, Layers3, MessageSquare, Network, RadioTower, Sun, Workflow, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import PremiumCard from '@/components/ui/PremiumCard'
import Reveal from '@/components/ui/Reveal'
import SectionHeader from '@/components/ui/SectionHeader'

const problems: Array<[string, string, LucideIcon]> = [
  ['Communication gaps', 'Critical information gets lost between leadership, teams, customers, and field operations.', MessageSquare],
  ['Fragmented workflows', 'Work moves through informal handoffs, duplicated effort, and unclear ownership.', Workflow],
  ['Manual operations', 'High-value teams spend too much time repeating tasks that should become systems.', Zap],
  ['Poor follow-ups', 'Leads, parents, customers, and internal actions slip when follow-through is not engineered.', RadioTower],
  ['Disconnected systems', 'Tools exist, but they do not produce a clear operational command layer.', Network],
  ['Operational bottlenecks', 'Single points of failure quietly reduce output, quality, and speed.', Layers3],
]

const services = [
  ['Operational Reviews', 'Structured diagnosis of workflows, communication flows, friction points, and operational leakage.'],
  ['Workflow Intelligence', 'Mapping how work actually moves, then redesigning it for speed, clarity, and control.'],
  ['Communication Infrastructure', 'Systems that help the right information reach the right people at the right time.'],
  ['Internal Coordination Systems', 'Operating rhythms, ownership models, and execution frameworks for teams.'],
  ['AI-Assisted Operations', 'Practical intelligence embedded into workflows where it improves real execution.'],
  ['Intelligent Business Infrastructure', 'A cohesive layer connecting people, processes, tools, and performance visibility.'],
]

const process = ['Operational Review', 'Workflow Discovery', 'Infrastructure Design', 'System Deployment', 'Continuous Optimization']

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-5 pt-28 md:px-8">
      <div className="grid-field absolute inset-0 opacity-70" />
      <div className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-signal/20 blur-[100px] animate-drift" />
      <div className="absolute right-[-10%] top-[10%] h-[520px] w-[520px] rounded-full bg-cobalt/30 blur-[120px]" />
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-signal/40 to-transparent animate-scan" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-[1.02fr_.98fr]">
        <Reveal>
          <span className="eyebrow mb-7"><span className="h-1.5 w-1.5 rounded-full bg-signal" />Operational Intelligence Infrastructure</span>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-tight text-white md:text-7xl lg:text-8xl">
            Operational Intelligence for <span className="gradient-text">Modern Organizations</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-steel md:text-xl">NEXORA helps organizations identify inefficiencies, optimize workflows, and deploy intelligent operational infrastructure.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href="/contact">Request Operational Review</Button>
            <Button href="/about" variant="secondary">Explore NEXORA</Button>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="relative hidden md:block">
          <div className="glass relative aspect-square rounded-[40px] p-8">
            <div className="absolute inset-8 rounded-[32px] border border-white/10" />
            <div className="grid h-full grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.035]" />)}
            </div>
            <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 rounded-3xl border border-signal/30 bg-[#07111f]/90 p-5 shadow-glow">
              <p className="text-xs uppercase tracking-[0.2em] text-steel">Operational command layer</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {['Review', 'Map', 'Deploy'].map((item) => <div key={item} className="rounded-2xl bg-white/[0.05] p-3 text-center text-xs text-frost">{item}</div>)}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function ProblemSection() {
  return (
    <section className="section">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader label="The Operational Gap" title={<>Most organizations operate below <span className="gradient-text">their true capacity.</span></>} copy="Not because they lack ambition. Because operational friction compounds quietly inside communication, workflows, handoffs, and decision systems." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {problems.map(([title, copy, Icon], i) => (
            <PremiumCard key={title as string} delay={i * 0.04}>
              <Icon className="mb-6 h-6 w-6 text-signal" />
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-steel">{copy}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function IndustriesPreview() {
  const items: Array<[string, string, LucideIcon]> = [
    ['Schools', 'Educational institutions need reliable systems for admissions, parent communication, fee coordination, staff workflows, and academic visibility.', BookOpen],
    ['Solar Companies', 'Energy operators need stronger sales follow-up, installation coordination, maintenance workflows, and customer communication.', Sun],
  ]
  return (
    <section className="section border-y border-white/10 bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader label="Current Industries" title={<>Deep focus where operations <span className="gradient-text">shape growth.</span></>} copy="NEXORA currently works with educational and energy organizations where operational efficiency directly impacts growth, communication, and customer experience." />
        <div className="grid gap-5 md:grid-cols-2">
          {items.map(([title, copy, Icon], i) => (
            <PremiumCard key={title as string} delay={i * 0.08} className="min-h-[320px]">
              <Icon className="h-8 w-8 text-signal" />
              <h3 className="mt-12 text-3xl font-semibold text-white">{title}</h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-steel">{copy}</p>
              <Link href="/industries" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-frost">Explore industry systems <ArrowUpRight size={16} /></Link>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function WhatWeDo() {
  return (
    <section className="section">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader label="What NEXORA Does" title={<>We improve how organizations <span className="gradient-text">operate.</span></>} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map(([title, copy], i) => (
            <PremiumCard key={title} delay={i * 0.04}>
              <p className="mb-8 text-xs font-bold uppercase tracking-[0.18em] text-signal/80">0{i + 1}</p>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-steel">{copy}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProcessSection() {
  return (
    <section className="section overflow-hidden bg-[#040b17]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader label="Process" title={<>From operational truth to <span className="gradient-text">deployed infrastructure.</span></>} />
        <div className="relative grid gap-4 lg:grid-cols-5">
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-signal/30 to-transparent lg:block" />
          {process.map((step, i) => (
            <Reveal key={step} delay={i * 0.08} className="relative">
              <div className="glass min-h-[210px] rounded-[28px] p-6">
                <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-full border border-signal/35 bg-signal/10 text-sm font-bold text-white">0{i + 1}</div>
                <h3 className="text-lg font-semibold text-white">{step}</h3>
                <p className="mt-3 text-sm leading-7 text-steel">A disciplined layer in the journey from diagnosis to measurable operational improvement.</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AcademyLabs() {
  return (
    <section className="section">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 md:px-8 lg:grid-cols-2">
        <PremiumCard className="min-h-[420px]">
          <GraduationCap className="h-8 w-8 text-signal" />
          <h2 className="mt-12 text-4xl font-semibold tracking-tight text-white">Building Africa's Next AI Operators</h2>
          <p className="mt-6 text-base leading-8 text-steel">NEXORA Academy trains AI operators, AI auditors, workflow system operators, and operational intelligence professionals for real organizational environments.</p>
          <Button href="/academy" variant="secondary" className="mt-8">Explore Academy</Button>
        </PremiumCard>
        <PremiumCard className="min-h-[420px]">
          <BrainCircuit className="h-8 w-8 text-signal" />
          <h2 className="mt-12 text-4xl font-semibold tracking-tight text-white">Infrastructure products for operational intelligence.</h2>
          <p className="mt-6 text-base leading-8 text-steel">NEXORA Labs develops Ordo, educational workflow systems, payment recovery infrastructure, and operational intelligence products.</p>
          <Button href="/labs" variant="secondary" className="mt-8">Explore Labs</Button>
        </PremiumCard>
      </div>
    </section>
  )
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-5 py-28 md:px-8 md:py-36">
      <div className="absolute inset-0 grid-field opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/10 blur-[120px]" />
      <Reveal className="relative mx-auto max-w-4xl text-center">
        <span className="eyebrow mb-7">Get Started</span>
        <h2 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl">Transform Operational Complexity Into <span className="gradient-text">Intelligent Infrastructure.</span></h2>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-steel">The gap between where your organization is and where it could be is operational. Let's close it with clarity.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/contact">Request Operational Review</Button>
          <Button href="/contact" variant="secondary">Contact NEXORA</Button>
        </div>
      </Reveal>
    </section>
  )
}
