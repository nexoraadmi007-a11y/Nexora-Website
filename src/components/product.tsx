import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, CheckCircle2, Circle, Lock, type LucideIcon } from 'lucide-react'
import { formatNaira, type Programme } from '@/config/programmes'

export function PageGrid({ children }: { children: ReactNode }) {
  return <div className="page-grid">{children}</div>
}

export function MetricCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon?: LucideIcon }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        {Icon ? <Icon size={18} /> : null}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}

export function ActionCard({ eyebrow, title, children, href, action }: { eyebrow?: string; title: string; children: ReactNode; href: string; action: string }) {
  return (
    <div className="action-card">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <p>{children}</p>
      <Link className="btn btn-primary" href={href}>{action}<ArrowRight size={16} /></Link>
    </div>
  )
}

export function ProgrammeCard({ programme, hrefPrefix = '/app/programmes' }: { programme: Programme; hrefPrefix?: string }) {
  return (
    <article className="programme-card">
      <div>
        <p className="eyebrow">{programme.duration}</p>
        <h3>{programme.name}</h3>
        <p>{programme.proposition}</p>
      </div>
      <div className="programme-meta">
        <strong>{formatNaira(programme.priceNgn)}</strong>
        <span>{programme.tracks.length ? `${programme.tracks.length} tracks` : 'Business programme'}</span>
      </div>
      {programme.tracks.length ? (
        <div className="tag-row">
          {programme.tracks.map((track) => <span key={track.code}>{track.name}</span>)}
        </div>
      ) : (
        <div className="tag-row">
          {programme.audience.slice(0, 5).map((audience) => <span key={audience}>{audience}</span>)}
        </div>
      )}
      <div className="card-actions">
        <Link className="btn btn-secondary" href={`${hrefPrefix}/${programme.slug}`}>View Programme</Link>
        <Link className="btn btn-primary" href={`/checkout?programme=${programme.slug}`}>Enrol</Link>
      </div>
    </article>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return <span className="progress-bar"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>
}

export function LearningStep({ label, state }: { label: string; state: 'done' | 'current' | 'locked' }) {
  const Icon = state === 'done' ? CheckCircle2 : state === 'locked' ? Lock : Circle
  return (
    <li className={`learning-step ${state}`}>
      <Icon size={18} />
      <span>{label}</span>
      <small>{state === 'done' ? 'Done' : state === 'current' ? 'Current' : 'Locked'}</small>
    </li>
  )
}

export function ChecklistItem({ done, children }: { done?: boolean; children: ReactNode }) {
  return (
    <li className={done ? 'checklist-done' : ''}>
      {done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
      <span>{children}</span>
    </li>
  )
}

export function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  )
}
