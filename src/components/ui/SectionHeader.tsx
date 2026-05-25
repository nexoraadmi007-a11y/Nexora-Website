import Reveal from './Reveal'

type SectionHeaderProps = {
  label: string
  title: React.ReactNode
  copy?: string
  align?: 'left' | 'center'
}

export default function SectionHeader({ label, title, copy, align = 'center' }: SectionHeaderProps) {
  return (
    <Reveal className={align === 'center' ? 'mx-auto mb-14 max-w-3xl text-center' : 'mb-12 max-w-3xl'}>
      <span className="eyebrow mb-6">
        <span className="h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_18px_rgba(79,140,255,.9)]" />
        {label}
      </span>
      <h2 className="text-4xl font-semibold leading-[1.04] tracking-tight text-white md:text-6xl">{title}</h2>
      {copy ? <p className="mt-6 text-base leading-8 text-steel md:text-lg">{copy}</p> : null}
    </Reveal>
  )
}
