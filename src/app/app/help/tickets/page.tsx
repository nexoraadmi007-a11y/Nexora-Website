'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable } from '@/components/product'

type Ticket = { id: string; category: string; subject: string; created: string; status: string; lastUpdate: string }

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => {
    setTickets(JSON.parse(window.localStorage.getItem('nexora_support_tickets') || '[]'))
  }, [])

  return (
    <AppShell title="Support Tickets">
      <div className="page-grid">
        <Card><h3>Your Tickets</h3><p className="muted">Track support requests submitted from the Nexora support form.</p></Card>
        <DataTable headers={['Ticket', 'Category', 'Subject', 'Created', 'Status', 'Last Update']} rows={(tickets.length ? tickets : [{ id: '-', category: '-', subject: 'No tickets submitted yet', created: '-', status: '-', lastUpdate: '-' }]).map((ticket) => [ticket.id, ticket.category, ticket.subject, ticket.created === '-' ? '-' : new Date(ticket.created).toLocaleDateString('en-NG'), ticket.status, ticket.lastUpdate])} />
      </div>
    </AppShell>
  )
}
