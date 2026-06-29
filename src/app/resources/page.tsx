import type { Metadata } from 'next'
import Link from 'next/link'
import PremiumCard from '@/components/ui/PremiumCard'
import { getResources } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'AI Resources and Blog | Nexora Institute',
  description: 'Airtable-powered AI at work, career growth, productivity, webinar replay, template, and prompt library resources.',
}

export default async function ResourcesPage() {
  const resources = await getResources()
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto max-w-7xl">
          <span className="eyebrow mb-7">Resources</span>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">Practical AI resources for work and career growth.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">Guides, templates, webinar replays, prompt libraries, and workplace AI insights powered by Airtable.</p>
        </div>
      </section>
      <section className="section border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-2 md:px-8 lg:grid-cols-3">
          {resources.map((resource) => (
            <PremiumCard key={resource.title} className="min-h-[310px]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">{resource.category}</p>
              <h2 className="mt-5 text-2xl font-semibold text-white">{resource.title}</h2>
              <p className="mt-4 text-sm leading-7 text-steel">{resource.description}</p>
              <p className="mt-6 text-xs text-steel">{resource.author} {resource.publishedDate ? `• ${new Date(resource.publishedDate).toLocaleDateString()}` : ''}</p>
              <Link href={resource.ctaLink} className="mt-6 inline-block text-sm font-semibold text-frost">{resource.ctaText}</Link>
            </PremiumCard>
          ))}
        </div>
      </section>
    </>
  )
}

