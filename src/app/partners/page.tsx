import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Link2, ShieldCheck } from 'lucide-react'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Partner Network | Nexura Institute',
  description: 'Nexura partners help more people discover practical AI programmes and earn verified commissions on successful referrals.',
}

export default function PartnersPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:px-8 md:pb-20 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="relative mx-auto max-w-7xl">
          <span className="eyebrow mb-6">Partner Network</span>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Help more people discover Nexura programmes.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-steel md:text-lg">
            The Nexura Partner Network is a distribution channel for responsible referrals. Partners share approved programme information and earn verified commissions on genuine successful sales.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-steel">No earnings guarantees. No misleading claims. No fake urgency. Commissions are based on verified, non-refunded payments.</p>
          <Link href="/ambassadors/apply" className="button-primary mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
            Apply as Partner <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-3 md:px-8">
          <PremiumCard className="rounded-lg"><Link2 className="h-8 w-8 text-signal" /><h2 className="mt-7 text-2xl font-semibold text-white">Direct referrals</h2><p className="mt-4 text-sm leading-7 text-steel">Partners receive a referral link and can track clicks, registrations, paid registrations and qualified sales.</p></PremiumCard>
          <PremiumCard className="rounded-lg"><BadgeCheck className="h-8 w-8 text-signal" /><h2 className="mt-7 text-2xl font-semibold text-white">Verified commissions</h2><p className="mt-4 text-sm leading-7 text-steel">Earnings depend on successful, verified, legitimate, non-refunded payments and monthly finance review.</p></PremiumCard>
          <PremiumCard className="rounded-lg"><ShieldCheck className="h-8 w-8 text-signal" /><h2 className="mt-7 text-2xl font-semibold text-white">Responsible representation</h2><p className="mt-4 text-sm leading-7 text-steel">Partners must use accurate Nexura messaging and avoid income or job guarantees.</p></PremiumCard>
        </div>
      </section>
    </>
  )
}
