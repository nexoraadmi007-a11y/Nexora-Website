import Link from 'next/link'
import { Bell, ChevronRight, CreditCard, Lock, Shield, User } from 'lucide-react'
import { AppShell } from '@/components/shell'

const settings = [
  { href: '/app/settings/account', title: 'Account', description: 'Name, phone, location, language and timezone.', icon: User },
  { href: '/app/settings/security', title: 'Password & Security', description: 'Password update, sessions and login history.', icon: Lock },
  { href: '/app/settings/notifications', title: 'Notifications', description: 'Class, assignment, payment and partner alerts.', icon: Bell },
  { href: '/app/settings/privacy', title: 'Privacy', description: 'Portfolio, talent profile and discoverability controls.', icon: Shield },
  { href: '/app/partner/payment-details', title: 'Partner Payment Details', description: 'Bank account and payout verification.', icon: CreditCard },
]

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <div className="grid-2">
        {settings.map(({ href, title, description, icon: Icon }) => (
          <Link className="click-card" href={href} key={href}>
            <strong><span><Icon size={18} /> {title}</span><ChevronRight size={18} /></strong>
            <span className="muted">{description}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
