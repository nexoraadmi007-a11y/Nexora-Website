import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpenCheck, HelpCircle, MessageSquareText, ShieldCheck } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Resources | Nexura Institute',
  description: 'Programme guides, support routes, partner materials and approved Nexura Institute information.',
}

const resources = [
  {
    title: 'Programme Guide',
    copy: 'Understand the AI Income Accelerator tracks, projects, portfolio outcomes and income-readiness layer.',
    href: '/learn',
    icon: BookOpenCheck,
  },
  {
    title: 'Business Review',
    copy: 'Request a fit review for the AI Business Transformation Programme before scope and pricing are confirmed.',
    href: '/business',
    icon: MessageSquareText,
  },
  {
    title: 'Partner Information',
    copy: 'Learn how the optional partner network works with verified referrals, monthly review and responsible claims.',
    href: '/partners',
    icon: ShieldCheck,
  },
  {
    title: 'Support',
    copy: 'Get help with registration, payment, programme selection, partner questions or business transformation.',
    href: '/contact',
    icon: HelpCircle,
  },
]

export default function ResourcesPage() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
      <div className="grid-field absolute inset-0 opacity-45" />
      <div className="relative mx-auto max-w-7xl">
        <span className="eyebrow mb-7">Resources</span>
        <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Find the right Nexura Institute pathway.</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">
          A simple starting point for learning, business transformation, partner information and support. More guides and approved assets can be added here as the platform grows.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {resources.map((item) => {
            const Icon = item.icon
            return (
              <PremiumCard key={item.title} className="rounded-lg">
                <Icon className="h-7 w-7 text-signal" />
                <h2 className="mt-6 text-2xl font-semibold text-white">{item.title}</h2>
                <p className="mt-4 text-sm leading-7 text-steel">{item.copy}</p>
                <Link href={item.href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-frost">
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </PremiumCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
