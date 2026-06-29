import type { Metadata } from 'next'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Contact Nexora Institute',
  description: 'Contact Nexora Institute for Career Accelerator, weekly webinar, corporate training, partnership, community, or general inquiries.',
}

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1fr]">
          <div>
            <span className="eyebrow mb-7">Contact</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Tell us where you want to start.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">Your message is routed into the Nexora Airtable operating system so the right team can follow up.</p>
            <div className="mt-8 grid gap-4">
              <PremiumCard className="p-5 md:p-5"><p className="text-sm font-semibold text-white">Email</p><p className="mt-1 text-sm text-steel">nexoraadmi007@gmail.com</p></PremiumCard>
              <PremiumCard className="p-5 md:p-5"><p className="text-sm font-semibold text-white">Phone / WhatsApp</p><p className="mt-1 text-sm text-steel">0701002613 | 08103200200</p></PremiumCard>
            </div>
          </div>
          <WebsiteForm kind="contact" title="Send an inquiry" cta="Submit Inquiry" />
        </div>
      </section>
    </>
  )
}

