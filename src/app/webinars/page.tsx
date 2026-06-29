import type { Metadata } from 'next'
import { CalendarDays, Clock, UserRound } from 'lucide-react'
import WebsiteForm from '@/components/sections/WebsiteForms'
import PremiumCard from '@/components/ui/PremiumCard'
import { getWebinars } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Weekly AI Workplace Webinars | Nexora Institute',
  description: 'Register for free weekly Nexora AI workplace webinars and watch past webinar replays.',
}

export default async function WebinarsPage() {
  const webinars = await getWebinars()
  const current = webinars[0]

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-20 pt-40 md:px-8 md:pt-48">
        <div className="grid-field absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr]">
          <div>
            <span className="eyebrow mb-7">Free weekly webinar</span>
            <h1 className="max-w-5xl text-5xl font-semibold leading-[1] text-white md:text-7xl">{current?.title || 'Nexora AI Workplace Webinar'}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-steel">{current?.description || 'Join Nexora for a free practical AI session for workplace productivity and career growth.'}</p>
            <div className="mt-8 grid max-w-xl gap-3 md:grid-cols-3">
              <div className="glass rounded-2xl p-4"><CalendarDays className="mb-3 h-5 w-5 text-signal" /><p className="text-sm text-white">{current?.date ? new Date(current.date).toLocaleDateString() : 'Upcoming'}</p></div>
              <div className="glass rounded-2xl p-4"><Clock className="mb-3 h-5 w-5 text-signal" /><p className="text-sm text-white">{current?.time || 'WAT'}</p></div>
              <div className="glass rounded-2xl p-4"><UserRound className="mb-3 h-5 w-5 text-signal" /><p className="text-sm text-white">{current?.speaker || 'Nexora Faculty'}</p></div>
            </div>
          </div>
          <WebsiteForm kind="webinar" title="Register for free" cta="Join This Week's Webinar" context={{ webinarTitle: current?.title || 'Weekly AI Webinar' }} />
        </div>
      </section>
      <section className="section border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-white md:text-5xl">Upcoming and past sessions.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {webinars.map((webinar) => (
              <PremiumCard key={`${webinar.title}-${webinar.date}`} className="min-h-[300px]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-steel">{webinar.status}</p>
                <h3 className="mt-5 text-2xl font-semibold text-white">{webinar.title}</h3>
                <p className="mt-4 text-sm leading-7 text-steel">{webinar.topic}</p>
                {webinar.replayLink ? <a href={webinar.replayLink} className="mt-6 inline-block text-sm font-semibold text-frost">Watch replay</a> : null}
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

