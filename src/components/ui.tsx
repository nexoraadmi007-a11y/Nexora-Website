import Link from 'next/link'
import type { ReactNode } from 'react'

export function ButtonLink({ href, children, variant = 'primary' }: { href: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <Link href={href} className={`btn btn-${variant}`}>{children}</Link>
}

export function Section({ eyebrow, title, children, id }: { eyebrow?: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <section id={id} className="section">
      <div className="container">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      <p>{children}</p>
    </div>
  )
}

export function Field({ label, type = 'text', required = false, name }: { label: string; type?: string; required?: boolean; name: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} required={required} />
    </label>
  )
}
