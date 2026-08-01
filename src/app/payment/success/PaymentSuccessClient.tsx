'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2, MessageCircle, ShieldCheck } from 'lucide-react'

type PaymentResult = {
  reference: string
  amount: number
  paidAt: string
  programme: {
    code: string
    name: string
    selectedTracks: string[]
  }
  customer: {
    firstName: string
    fullName: string
    email: string
  }
  group: {
    status: 'AVAILABLE' | 'MISSING'
    groupName: string
    groupUrl: string
  }
}

export default function PaymentSuccessClient({ reference }: { reference: string }) {
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [payment, setPayment] = useState<PaymentResult | null>(null)

  useEffect(() => {
    let mounted = true
    async function verify() {
      if (!reference) {
        setState('error')
        setMessage('Payment reference is missing.')
        return
      }
      try {
        const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`, { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.message || 'Payment could not be verified.')
        if (!mounted) return
        setPayment(data.payment)
        setState('success')
      } catch (error) {
        if (!mounted) return
        setState('error')
        setMessage(error instanceof Error ? error.message : 'Payment could not be verified.')
      }
    }
    verify()
    return () => {
      mounted = false
    }
  }, [reference])

  if (state === 'loading') {
    return (
      <section className="relative overflow-hidden px-5 pb-20 pt-36 md:px-8 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="glass relative mx-auto max-w-3xl rounded-lg p-7 md:p-10">
          <Loader2 className="h-8 w-8 animate-spin text-signal" />
          <h1 className="mt-6 text-4xl font-semibold text-white md:text-5xl">Confirming your payment.</h1>
          <p className="mt-4 text-base leading-8 text-steel">Please wait while Nexora verifies your Paystack transaction and prepares your next step.</p>
        </div>
      </section>
    )
  }

  if (state === 'error' || !payment) {
    return (
      <section className="relative overflow-hidden px-5 pb-20 pt-36 md:px-8 md:pt-44">
        <div className="grid-field absolute inset-0 opacity-45" />
        <div className="glass relative mx-auto max-w-3xl rounded-lg p-7 md:p-10">
          <ShieldCheck className="h-8 w-8 text-red-300" />
          <h1 className="mt-6 text-4xl font-semibold text-white md:text-5xl">Payment verification pending.</h1>
          <p className="mt-4 text-base leading-8 text-steel">{message || 'We could not verify this payment yet.'}</p>
          <p className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-frost">Reference: {reference || 'Not available'}</p>
          <Link href="/contact" className="button-secondary mt-7 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold">
            Contact support
          </Link>
        </div>
      </section>
    )
  }

  const isBusiness = payment.programme.code === 'BATP'
  const selected = payment.programme.selectedTracks.length ? payment.programme.selectedTracks.join(', ') : payment.programme.name

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-36 md:px-8 md:pt-44">
      <div className="grid-field absolute inset-0 opacity-45" />
      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_.78fr] lg:items-start">
        <div className="glass rounded-lg p-7 md:p-10">
          <CheckCircle2 className="h-10 w-10 text-signal" />
          <h1 className="mt-7 text-4xl font-semibold leading-tight text-white md:text-6xl">Payment successful.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-steel">
            Congratulations, {payment.customer.firstName}. Your {isBusiness ? 'place in the AI Business Transformation Programme' : `registration for ${selected}`} has been confirmed.
          </p>

          <div className="mt-8 grid gap-3 rounded-lg border border-white/10 bg-black/20 p-5 text-sm">
            <Line label="Programme" value={selected} />
            <Line label="Amount Paid" value={`NGN ${payment.amount.toLocaleString()}`} />
            <Line label="Payment Reference" value={payment.reference} />
          </div>

          {payment.group.status === 'AVAILABLE' && payment.group.groupUrl ? (
            <a href={payment.group.groupUrl} target="_blank" rel="noreferrer" className="button-primary mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold">
              <MessageCircle className="h-4 w-4" />
              Join Your Class Group
            </a>
          ) : (
            <div className="mt-8 rounded-lg border border-signal/30 bg-signal/10 p-5">
              <p className="text-base font-semibold text-white">Your registration is confirmed.</p>
              <p className="mt-2 text-sm leading-7 text-frost">
                Your class group link is awaiting final admin configuration. Nexora will send your onboarding link shortly, and your payment reference is already saved.
              </p>
            </div>
          )}
        </div>

        <div className="glass rounded-lg p-6 md:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-frost">What to do next</p>
          <div className="mt-6 grid gap-4">
            {[
              'Join your class WhatsApp group once the official link is available.',
              'Save your payment reference for support and onboarding checks.',
              'Watch for class schedule and onboarding instructions from Nexora.',
              'Prepare to complete any remaining profile details before classes begin.',
            ].map((item) => (
              <p key={item} className="flex gap-3 text-sm leading-7 text-steel">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-signal" />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-steel">{label}</span>
      <span className="max-w-[62%] break-words text-right font-semibold text-white">{value}</span>
    </div>
  )
}
