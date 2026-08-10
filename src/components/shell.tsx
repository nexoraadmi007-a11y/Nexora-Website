import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ButtonLink } from './ui'

const publicLinks = [
  ['Programmes', '/programmes'],
  ['For Businesses', '/business'],
  ['Opportunities', '/opportunities'],
  ['Partners', '/partners'],
  ['About', '/about'],
  ['Resources', '/resources'],
]

const appLinks = [
  ['Home', '/app'],
  ['Learning', '/app/learning'],
  ['Classes', '/app/classes'],
  ['Projects', '/app/projects'],
  ['Portfolio', '/app/portfolio'],
  ['Opportunities', '/app/opportunities'],
  ['Partner', '/app/partner'],
]

const adminLinks = [
  ['Overview', '/admin'],
  ['Programmes', '/admin/programmes'],
  ['Classes', '/admin/classes'],
  ['Partners', '/admin/partners'],
  ['Payouts', '/admin/payouts'],
  ['Analytics', '/admin/analytics'],
]

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
        <nav>
          {appLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </aside>
      <main className="workspace">
        <div className="workspace-top">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>{title}</h1>
          </div>
          <Link href="/app/notifications" className="notification-pill">Notifications</Link>
        </div>
        {children}
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
        <nav>
          {adminLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </aside>
      <main className="workspace">
        <div className="workspace-top">
          <div>
            <p className="eyebrow">Operations</p>
            <h1>{title}</h1>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
