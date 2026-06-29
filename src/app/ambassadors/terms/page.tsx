import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Ambassador Terms | NEXORA' }

export default function AmbassadorTermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 pb-24 pt-36 md:px-8 md:pb-32 md:pt-44">
      <p className="text-xs font-bold uppercase text-[#8fb7f3]">Ambassador programme terms</p>
      <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Clear expectations for credible representation.</h1>
      <p className="mt-5 text-sm leading-7 text-steel">Effective 21 June 2026</p>
      <div className="mt-12 grid gap-9 border-t border-white/10 pt-10 text-sm leading-7 text-steel">
        <Term title="Approval">Submitting a registration does not create ambassador status. NEXORA reviews applications and may approve, waitlist, reject, pause, or revoke participation.</Term>
        <Term title="Representation">Ambassadors must describe NEXORA programmes accurately, protect applicant information, avoid misleading promises, and never collect unauthorized payments.</Term>
        <Term title="Verified referrals">A referral qualifies only when the referred person is uniquely attributed to the ambassador and reaches payment-confirmed enrollment. Self-referrals, duplicate claims, rejected referrals, and cancelled referrals do not qualify.</Term>
        <Term title="First-training discount">Three verified referrals unlock one 35% discount on the ambassador&apos;s first NEXORA training enrollment. The benefit cannot be stacked, transferred, paid as cash, redeemed twice, or applied retroactively after the first training is fully paid.</Term>
        <Term title="Activity status">Recent verified referral activity may be used to classify ambassadors as active or inactive. Paused and alumni statuses remain subject to NEXORA review.</Term>
        <Term title="Conduct">Fraud, harassment, spam, misuse of NEXORA branding, false attribution, or mishandling personal data may lead to immediate removal and reward revocation.</Term>
      </div>
      <Link href="/ambassadors/apply" className="button-secondary mt-12 inline-flex min-h-12 items-center rounded-lg px-6 text-sm font-semibold">Return to ambassador application</Link>
    </section>
  )
}

function Term({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-lg font-semibold text-white">{title}</h2><p className="mt-2">{children}</p></section>
}
