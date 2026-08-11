'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  CreditCard,
  FolderKanban,
  GraduationCap,
  HandCoins,
  Home,
  LayoutDashboard,
  Library,
  LineChart,
  Megaphone,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { ButtonLink } from './ui'
import { aiIncomeTracks, programmes } from '@/config/programmes'

const publicLinks = [
  ['Programmes', '/programmes'],
  ['For Businesses', '/business'],
  ['Opportunities', '/opportunities'],
  ['Partners', '/partners'],
  ['About', '/about'],
  ['Resources', '/resources'],
]

type NavItem = { label: string; href: string; icon: LucideIcon }
type NavGroup = { title?: string; items: NavItem[] }

const appGroups: NavGroup[] = [
  { items: [{ label: 'Home', href: '/app', icon: Home }, { label: 'Programmes', href: '/app/programmes', icon: Sparkles }] },
  {
    title: 'Learning',
    items: [
      { label: 'Learning', href: '/app/learning', icon: BookOpen },
      { label: 'Live Classes', href: '/app/classes', icon: CalendarDays },
      { label: 'Projects', href: '/app/projects', icon: FolderKanban },
      { label: 'Portfolio', href: '/app/portfolio', icon: BriefcaseBusiness },
    ],
  },
  { title: 'Career', items: [{ label: 'Opportunities', href: '/app/opportunities', icon: Megaphone }, { label: 'Resources', href: '/app/resources', icon: Library }] },
  {
    title: 'Partner',
    items: [
      { label: 'Overview', href: '/app/partner', icon: HandCoins },
      { label: 'Referrals', href: '/app/partner/referrals', icon: Users },
      { label: 'Earnings', href: '/app/partner/earnings', icon: WalletCards },
      { label: 'Partner Resources', href: '/app/partner/resources', icon: Library },
      { label: 'Growth Copilot', href: '/app/partner/copilot', icon: Sparkles },
    ],
  },
  { title: 'Account', items: [{ label: 'Help', href: '/help', icon: CircleHelp }, { label: 'Settings', href: '/app/settings', icon: Settings }] },
]

const adminGroups: NavGroup[] = [
  { items: [{ label: 'Overview', href: '/admin', icon: LayoutDashboard }, { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 }] },
  {
    title: 'Platform',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Programmes', href: '/admin/programmes', icon: GraduationCap },
      { label: 'Promos', href: '/admin/promos', icon: Megaphone },
      { label: 'Classes', href: '/admin/classes', icon: CalendarDays },
      { label: 'Projects', href: '/admin/opportunities', icon: FolderKanban },
    ],
  },
  {
    title: 'Growth',
    items: [
      { label: 'Partners', href: '/admin/partners', icon: HandCoins },
      { label: 'Referrals', href: '/admin/referrals', icon: LineChart },
      { label: 'Commissions', href: '/admin/commissions', icon: WalletCards },
      { label: 'Payouts', href: '/admin/payouts', icon: CreditCard },
    ],
  },
  { title: 'System', items: [{ label: 'Settings', href: '/admin/settings', icon: Settings }] },
]

function NavGroups({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname()
  return (
    <nav className="side-nav">
      {groups.map((group, groupIndex) => (
        <div className="nav-group" key={group.title || groupIndex}>
          {group.title ? <p>{group.title}</p> : null}
          {group.items.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/app' && href !== '/admin' && pathname.startsWith(`${href}/`))
            return <Link key={href} className={active ? 'active' : ''} href={href}><Icon size={17} /> <span>{label}</span></Link>
          })}
        </div>
      ))}
    </nav>
  )
}

function WorkspaceHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [logoutOpen, setLogoutOpen] = useState(false)
  const searchItems = useMemo(() => [
    ...programmes.map((programme) => ({ title: programme.name, type: 'Programme', href: `/app/programmes/${programme.slug}` })),
    ...aiIncomeTracks.map((track) => ({ title: track.name, type: 'Track', href: `/programmes/ai-income-accelerator/${track.slug}` })),
    { title: 'Live Classes', type: 'Class', href: '/app/classes' },
    { title: 'Projects', type: 'Project', href: '/app/projects' },
    { title: 'Career Resources', type: 'Resource', href: '/app/resources/career' },
    { title: 'Income Resources', type: 'Resource', href: '/app/resources/income' },
    { title: 'Opportunities', type: 'Opportunity', href: '/app/opportunities' },
    { title: 'Support', type: 'Help', href: '/help' },
  ], [])
  const results = query.trim()
    ? searchItems.filter((item) => `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase())).slice(0, 7)
    : []

  function confirmLogout() {
    try { window.localStorage.removeItem('nexora_v2_session') } catch {}
    setLogoutOpen(false)
    router.push('/login')
  }

  return (
    <div className="workspace-top">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="workspace-actions">
        <label className="search-box">
          <Search size={16} />
          <input
            aria-label="Search"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('')
              if (event.key === 'Enter' && results[0]) router.push(results[0].href)
            }}
            placeholder="Search programmes, classes, resources..."
            value={query}
          />
        </label>
        {query ? (
          <div className="search-panel">
            <p>Search Nexora</p>
            {results.length ? results.map((item) => <Link key={item.href} href={item.href} onClick={() => setQuery('')}><strong>{item.title}</strong><span>{item.type}</span></Link>) : <div className="search-empty">No results for "{query}". Try another term or browse programmes.</div>}
          </div>
        ) : null}
        <Link href="/app/notifications" className="icon-shell" aria-label="Notifications"><Bell size={18} /><span /></Link>
        <details className="profile-menu">
          <summary><span className="avatar">NI</span></summary>
          <div>
            <Link href="/app/profile">Profile</Link>
            <Link href="/app/settings">Settings</Link>
            <Link href="/app/billing">Billing</Link>
            <Link href="/app/partner/payment-details">Partner Settings</Link>
            <Link href="/help">Help</Link>
            <button type="button" onClick={() => setLogoutOpen(true)}>Log Out</button>
          </div>
        </details>
        {logoutOpen ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <div className="modal-card">
              <h3 id="logout-title">Log out?</h3>
              <p className="muted">Are you sure you want to end your Nexora session?</p>
              <div className="card-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setLogoutOpen(false)}>Cancel</button>
                <button className="btn btn-primary" type="button" onClick={confirmLogout}>Log Out</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <Image src="/nexora-mark.png" alt="" width={34} height={34} />
          <span>Nexora Institute</span>
        </Link>
        <nav className="nav-links">
          {publicLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="nav-actions">
          <Link href="/login">Log In</Link>
          <ButtonLink href="/signup">Get Started</ButtonLink>
        </div>
      </header>
      {children}
      <footer className="footer">
        <p>Nexora Institute</p>
        <p>Learn. Build. Earn. Work.</p>
      </footer>
    </>
  )
}

export function AppShell({ children, title = 'Member Platform' }: { children: ReactNode; title?: string }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/app" className="brand compact">
          <Image src="/nexora-mark.png" alt="" width={30} height={30} />
          <span>Nexora Institute</span>
        </Link>
        <NavGroups groups={appGroups} />
      </aside>
      <main className="workspace">
        <WorkspaceHeader eyebrow="Workspace" title={title} />
        <div className="workspace-body">{children}</div>
      </main>
    </div>
  )
}

export function AdminShell({ children, title = 'Admin Operating System' }: { children: ReactNode; title?: string }) {
  return (
    <div className="app-shell admin">
      <aside className="sidebar">
        <Link href="/admin" className="brand compact">
          <Image src="/nexora-mark.png" alt="" width={30} height={30} />
          <span>Admin</span>
        </Link>
        <NavGroups groups={adminGroups} />
      </aside>
      <main className="workspace">
        <WorkspaceHeader eyebrow="Operations" title={title} />
        <div className="workspace-body">{children}</div>
      </main>
    </div>
  )
}
