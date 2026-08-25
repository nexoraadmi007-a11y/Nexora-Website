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
  FileText,
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
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ButtonLink } from './ui'
import { programmes } from '@/config/programmes'

const publicLinks = [
  ['Courses', '/programmes'],
  ['About', '/about'],
  ['Help', '/help'],
]

type NavItem = { label: string; href: string; icon: LucideIcon }
type NavGroup = { title?: string; items: NavItem[] }

const appGroups: NavGroup[] = [
  { items: [
    { label: 'Dashboard', href: '/app', icon: Home },
    { label: 'My Courses', href: '/app/programmes', icon: BookOpen },
    { label: 'Classes', href: '/app/classes', icon: CalendarDays },
    { label: 'Assignments', href: '/app/assignments', icon: FileText },
    { label: 'Profile', href: '/app/profile', icon: User },
  ] },
]

const adminGroups: NavGroup[] = [
  { title: 'Overview', items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }] },
  {
    title: 'Students',
    items: [
      { label: 'Students', href: '/admin/students', icon: Users },
      { label: 'Enrollments', href: '/admin/enrollments', icon: GraduationCap },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Learning',
    items: [
      { label: 'Courses', href: '/admin/programmes', icon: GraduationCap },
      { label: 'Classes', href: '/admin/classes', icon: CalendarDays },
      { label: 'Assignments', href: '/admin/assignments', icon: FileText },
    ],
  },
  {
    title: 'Growth',
    items: [
      { label: 'Growth Associates', href: '/admin/growth-associates', icon: HandCoins },
      { label: 'Referrals', href: '/admin/referrals', icon: LineChart },
      { label: 'Leaderboard', href: '/admin/leaderboard', icon: BarChart3 },
    ],
  },
  { title: 'Finance', items: [{ label: 'Commissions', href: '/admin/commissions', icon: WalletCards }, { label: 'Payouts', href: '/admin/payouts', icon: CreditCard }] },
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

function WorkspaceHeader({ eyebrow, title, admin = false, onMenu }: { eyebrow: string; title: string; admin?: boolean; onMenu?: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [logoutOpen, setLogoutOpen] = useState(false)
  const searchItems = useMemo(() => [
    ...programmes.map((programme) => ({ title: programme.name, type: 'Course', href: `/app/programmes/${programme.slug}` })),
    { title: 'Classes', type: 'Class', href: '/app/classes' },
    { title: 'Assignments', type: 'Assignment', href: '/app/assignments' },
    { title: 'Support', type: 'Help', href: '/help' },
  ], [])
  const results = query.trim()
    ? searchItems.filter((item) => `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase())).slice(0, 7)
    : []

  async function confirmLogout() {
    try { window.localStorage.removeItem('nexora_v2_session') } catch {}
    await fetch(admin ? '/api/admin/auth/logout' : '/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    setLogoutOpen(false)
    router.replace(admin ? '/admin/login' : '/login')
    router.refresh()
  }

  return (
    <div className="workspace-top">
      <div>
        {onMenu ? <button className="mobile-menu-button" type="button" aria-label="Open navigation" onClick={onMenu}><Menu size={20} /></button> : null}
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
            placeholder="Search courses and classes..."
            value={query}
          />
        </label>
        {query ? (
          <div className="search-panel">
            <p>Search Nexora</p>
            {results.length ? results.map((item) => <Link key={item.href} href={item.href} onClick={() => setQuery('')}><strong>{item.title}</strong><span>{item.type}</span></Link>) : <div className="search-empty">No results for "{query}". Try another term or browse courses.</div>}
          </div>
        ) : null}
        <Link href={admin ? '/admin/notifications' : '/app/notifications'} className="icon-shell" aria-label="Notifications"><Bell size={18} /><span /></Link>
        <details className="profile-menu">
          <summary><span className="avatar">NI</span></summary>
          <div>
            <Link href={admin ? '/admin/profile' : '/app/profile'}>{admin ? 'Admin Profile' : 'Profile'}</Link>
            <Link href={admin ? '/admin/settings' : '/app/settings'}>{admin ? 'Admin Settings' : 'Settings'}</Link>
            {admin ? <Link href="/admin/settings#security">Security</Link> : <Link href="/app/billing">Billing</Link>}
            {admin ? <Link href="/admin/audit">Audit Log</Link> : null}
            <Link href="/help">Help</Link>
            <button type="button" onClick={() => setLogoutOpen(true)}>Log Out</button>
          </div>
        </details>
        {logoutOpen ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <div className="modal-card">
              <h3 id="logout-title">{admin ? 'Log out of Admin?' : 'Log out?'}</h3>
              <p className="muted">{admin ? 'Are you sure you want to end this administration session?' : 'Are you sure you want to end your Nexora session?'}</p>
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
        <p>Learn. Attend. Complete.</p>
      </footer>
    </>
  )
}

export function AppShell({ children, title = 'Member Platform' }: { children: ReactNode; title?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="app-shell">
      {menuOpen ? <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} /> : null}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <button className="sidebar-close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        <Link href="/app" className="brand compact">
          <Image src="/nexora-mark.png" alt="" width={30} height={30} />
          <span>Nexora Institute</span>
        </Link>
        <NavGroups groups={appGroups} />
      </aside>
      <main className="workspace">
        <WorkspaceHeader eyebrow="Student Portal" title={title} onMenu={() => setMenuOpen(true)} />
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
        <WorkspaceHeader eyebrow="Operations" title={title} admin />
        <div className="workspace-body">{children}</div>
      </main>
    </div>
  )
}
