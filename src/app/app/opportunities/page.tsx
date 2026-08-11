'use client'

import { useMemo, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

const opportunities = [
  { id: 'opp1', title: 'Portfolio-ready content brief', company: 'Nexora Practice Lab', type: 'Freelance', remote: true, status: 'Preview' },
  { id: 'opp2', title: 'AI data cleanup project', company: 'Nexora Practice Lab', type: 'AI Data Project', remote: true, status: 'Preview' },
]
const tabs = ['Recommended', 'All Opportunities', 'Applications', 'Saved']
const filters = ['Internship', 'Junior Role', 'Freelance', 'AI Data Project', 'Remote']

export default function AppOpportunitiesPage() {
  const [tab, setTab] = useState('Recommended')
  const [filter, setFilter] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const rows = useMemo(() => opportunities.filter((item) => !filter || item.type === filter || (filter === 'Remote' && item.remote)), [filter])
  const visible = tab === 'Saved' ? rows.filter((item) => saved.includes(item.id)) : rows

  return (
    <AppShell title="Opportunities">
      <div className="page-grid">
        <div className="tabs">{tabs.map((item) => <button className={tab === item ? 'active-tab' : ''} key={item} type="button" onClick={() => setTab(item)}>{item}</button>)}</div>
        <div className="tabs">{filters.map((item) => <button className={filter === item ? 'active-tab' : ''} key={item} type="button" onClick={() => setFilter(filter === item ? '' : item)}>{item}</button>)}</div>
        {tab === 'Applications' ? (
          <Card><h3>Applications</h3><DataTable headers={['Opportunity', 'Company', 'Applied', 'Status']} rows={[['No applications yet', '-', '-', 'Not submitted']]} /></Card>
        ) : visible.length ? (
          <div className="grid-2">
            {visible.map((item) => (
              <Card key={item.id}>
                <p className="eyebrow">{item.type}</p>
                <h3>{item.title}</h3>
                <p className="muted">{item.company} - {item.remote ? 'Remote' : 'On-site'} - {item.status}</p>
                <button className="btn btn-secondary" type="button" onClick={() => setSaved((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}>{saved.includes(item.id) ? 'Saved' : 'Save'}</button>
              </Card>
            ))}
          </div>
        ) : (
          <Card><h3>No {tab.toLowerCase()} yet.</h3><p className="muted">Complete your profile and portfolio to improve matching.</p><a className="btn btn-primary" href="/app/profile">Build My Profile</a></Card>
        )}
      </div>
    </AppShell>
  )
}
