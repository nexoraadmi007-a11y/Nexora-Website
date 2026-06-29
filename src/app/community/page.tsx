import type { Metadata } from 'next'
import { MessageCircle, Network, Sparkles } from 'lucide-react'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'

export const metadata: Metadata = {
  title: 'Nexora AI Workplace Community',
  description: 'Join the Nexora AI Workplace Community for webinars, AI tips, resources, challenges, and professional networking.',
}

const benefits = ['Weekly AI webinars', 'Daily AI tips', 'Career resources', 'Practical challenges', 'Professional networking', 'Community rules that keep learning focused']

export default function CommunityPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <span className="eyebrow mb-7">Nexora Community</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Do not learn AI alone.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">Join a practical AI workplace community for NYSC members, young professionals, students, and people who want useful guidance for the AI era.</p>
          </div>
          <WebsiteForm kind="community" title="Join the community" cta="Join Nexora AI Workplace Community" />
        </div>
      </section>
      <section className="section border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-3 md:px-8">
          {benefits.map((benefit, index) => {
            const Icon = index % 3 === 0 ? MessageCircle : index % 3 === 1 ? Sparkles : Network
            return (
              <PremiumCard key={benefit} className="min-h-[220px]">
                <Icon className="h-8 w-8 text-signal" />
                <h2 className="mt-8 text-2xl font-semibold text-white">{benefit}</h2>
              </PremiumCard>
            )
          })}
        </div>
      </section>
    </>
  )
}

