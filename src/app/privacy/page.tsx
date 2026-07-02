import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Notice | NEXORA' }

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 pb-24 pt-36 md:px-8 md:pb-32 md:pt-44">
      <p className="text-xs font-bold uppercase text-[#8fb7f3]">Privacy notice</p>
      <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">How NEXORA handles application data.</h1>
      <p className="mt-5 text-sm leading-7 text-steel">Effective 21 June 2026</p>
      <div className="mt-12 grid gap-9 border-t border-white/10 pt-10 text-sm leading-7 text-steel">
        <Policy title="Information collected">We collect identity, contact, professional, programme-interest, growth associate, referral, payment, and engagement information submitted through NEXORA channels.</Policy>
        <Policy title="How it is used">Information is used to review applications, manage programmes and communities, attribute referrals, communicate operational updates, and maintain accurate CRM records.</Policy>
        <Policy title="Storage and access">Information is stored in NEXORA&apos;s controlled CRM and is available only to authorized operators who need it for programme delivery, admissions, payments, or community management.</Policy>
        <Policy title="Sharing">NEXORA does not sell personal data. Information may be processed by service providers used for hosting, communications, forms, payments, and CRM operations.</Policy>
        <Policy title="Your choices">You may request access, correction, or deletion by emailing nexoraadmi007@gmail.com. Legal, payment, fraud-prevention, and programme records may be retained where required.</Policy>
      </div>
      <Link href="/contact" className="button-secondary mt-12 inline-flex min-h-12 items-center rounded-lg px-6 text-sm font-semibold">Contact NEXORA</Link>
    </section>
  )
}

function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-lg font-semibold text-white">{title}</h2><p className="mt-2">{children}</p></section>
}
