import Reveal from '@/components/ui/Reveal'

export function PageHero({ label, title, copy }: { label: string; title: React.ReactNode; copy: string }) {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-40 md:px-8 md:pt-48">
      <div className="grid-field absolute inset-0 opacity-55" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-signal/15 blur-[100px]" />
      <Reveal className="relative mx-auto max-w-7xl">
        <span className="eyebrow mb-7">{label}</span>
        <h1 className="max-w-5xl text-5xl font-semibold leading-[1] tracking-tight text-white md:text-7xl">{title}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">{copy}</p>
      </Reveal>
    </section>
  )
}

export function PageBand({ children }: { children: React.ReactNode }) {
  return <section className="section border-t border-white/10">{children}</section>
}
