'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
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
  return (
    <div className="workspace-top">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="workspace-actions">
        <label className="search-box">
          <Search size={16} />
          <input aria-label="Search" placeholder="Search programmes, classes, resources..." />
        </label>
        <Link href="/app/notifications" className="icon-shell" aria-label="Notifications"><Bell size={18} /><span /></Link>
        <details className="profile-menu">
          <summary><span className="avatar">NI</span></summary>
          <div>
            <Link href="/app/profile">Profile</Link>
            <Link href="/app/settings">Settings</Link>
            <Link href="/app/billing">Billing</Link>
            <Link href="/app/partner/payment-details">Partner Settings</Link>
            <Link href="/help">Help</Link>
            <Link href="/login">Log Out</Link>
          </div>
        </details>
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
