'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'

const notifications = [
  { id: 'n1', category: 'Learning', message: 'Complete your profile to improve learning recommendations.', href: '/app/profile', action: 'Open Profile' },
  { id: 'n2', category: 'Classes', message: 'Your first class appears after enrolment.', href: '/app/classes', action: 'Open Classes' },
  { id: 'n3', category: 'Projects', message: 'Projects become available after Module 1.', href: '/app/projects', action: 'Open Projects' },
  { id: 'n4', category: 'Partner', message: 'Activate your partner profile to receive a referral code.', href: '/app/partner/activate', action: 'Activate Partner' },
  { id: 'n5', category: 'Payments', message: 'Programme purchases and receipts appear in Billing.', href: '/app/billing', action: 'View Billing' },
  { id: 'n6', category: 'Opportunities', message: 'Improve your profile to prepare for matching.', href: '/app/opportunities', action: 'View Opportunities' },
]
const tabs = ['All', 'Learning', 'Classes', 'Projects', 'Partner', 'Payments', 'Opportunities']

export default function NotificationsPage() {
  const [tab, setTab] = useState('All')
  const [read, setRead] = useState<string[]>([])
  const rows = useMemo(() => notifications.filter((item) => tab === 'All' || item.category === tab), [tab])

  return (
    <AppShell title="Notifications">
      <div className="page-grid">
        <div className="tabs">{tabs.map((item) => <button className={tab === item ? 'active-tab' : ''} key={item} type="button" onClick={() => setTab(item)}>{item}</button>)}</div>
        <Card>
          <div className="card-actions"><button className="btn btn-secondary" type="button" onClick={() => setRead(notifications.map((item) => item.id))}>Mark All as Read</button></div>
          <div className="page-grid">
            {rows.map((item) => (
              <div className="learning-step current" key={item.id}>
                <span className={`status-pill ${read.includes(item.id) ? 'success' : 'warning'}`}>{read.includes(item.id) ? 'Read' : 'Unread'}</span>
                <span>{item.message}</span>
                <span className="card-actions"><button className="btn btn-ghost" type="button" onClick={() => setRead((current) => Array.from(new Set([...current, item.id])))}>Mark as Read</button><Link className="btn btn-secondary" href={item.href}>{item.action}</Link></span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
