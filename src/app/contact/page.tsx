'use client'

import { useState } from 'react'
import { Clock, Mail, MapPin, MessageCircle, Phone, Send, type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import PremiumCard from '@/components/ui/PremiumCard'
import Reveal from '@/components/ui/Reveal'
import { PageHero } from '@/components/sections/PageShell'

const number = '2347084193822'
const contactDetails: Array<[LucideIcon, string, string]> = [
  [Mail, 'Email', 'nexoraadmi007@gmail.com'],
  [Phone, 'Phone', '0701002613 | 08103200200'],
  [MapPin, 'Office', 'Opposite Egba High School, Asero, Abeokuta, Ogun State, Nigeria.'],
  [Clock, 'Hours', 'Monday to Friday, 8am to 6pm WAT'],
]

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setLoading(false)
    setSent(true)
  }

  return (
    <>
      <PageHero label="Contact" title={<>Start a conversation about <span className="gradient-text">operational clarity.</span></>} copy="Reach NEXORA for operational reviews, infrastructure conversations, partnerships, and intelligent workflow systems." />
      <section className="section border-t border-white/10">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 md:px-8 lg:grid-cols-[1.1fr_.9fr]">
          <Reveal>
            <div className="glass rounded-[32px] p-5 md:p-8">
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[520px] flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-signal/30 bg-signal/10"><Send className="text-signal" /></div>
                  <h2 className="text-3xl font-semibold text-white">Message received.</h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-steel">This frontend placeholder is ready for email/API integration. For immediate response, start a WhatsApp conversation.</p>
                  <Button href={`https://wa.me/${number}?text=${encodeURIComponent("Hello NEXORA, I'd like to start an Operational Review.")}`} className="mt-8">Talk on WhatsApp</Button>
                </motion.div>
              ) : (
                <form onSubmit={submit} className="grid gap-5">
                  <div>
                    <h2 className="text-3xl font-semibold text-white">Request an Operational Review</h2>
                    <p className="mt-3 text-sm leading-7 text-steel">Tell us what kind of organization you run and where operations currently feel unclear.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Full name" name="name" required />
                    <Field label="Email" name="email" type="email" required />
                  </div>
                  <Field label="Organization" name="organization" />
                  <label className="grid gap-2 text-sm text-steel">
                    Reason
                    <select name="reason" className="h-[52px] rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-white outline-none">
                      <option>Request Operational Review</option>
                      <option>Discuss NEXORA services</option>
                      <option>NEXORA Academy inquiry</option>
                      <option>NEXORA Labs inquiry</option>
                      <option>Partnership</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-steel">
                    Message
                    <textarea required name="message" rows={6} className="resize-none rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-white outline-none placeholder:text-steel/45" placeholder="Describe the operational friction, workflow gaps, or systems you want to improve." />
                  </label>
                  <button disabled={loading} className="button-primary rounded-full px-6 py-4 text-sm font-bold disabled:opacity-60">{loading ? 'Sending...' : 'Send Message'}</button>
                </form>
              )}
            </div>
          </Reveal>
          <div className="grid gap-4">
            <PremiumCard>
              <MessageCircle className="h-7 w-7 text-signal" />
              <h3 className="mt-8 text-2xl font-semibold text-white">WhatsApp first response</h3>
              <p className="mt-4 text-sm leading-7 text-steel">The WhatsApp flow is structured for the future NEXORA Customer Intelligence Bot and ready for immediate conversations today.</p>
              <Button href={`https://wa.me/${number}?text=${encodeURIComponent("Hello NEXORA, I'd like to speak with your team.")}`} className="mt-7">Chat With Our Team</Button>
            </PremiumCard>
            {contactDetails.map(([Icon, label, value]) => (
              <PremiumCard key={label} className="p-5 md:p-5">
                <div className="flex gap-4">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-signal" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-steel/60">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-frost">{value}</p>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function Field({ label, name, type = 'text', required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm text-steel">
      {label}
      <input required={required} name={name} type={type} className="h-[52px] rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-white outline-none placeholder:text-steel/45" />
    </label>
  )
}
