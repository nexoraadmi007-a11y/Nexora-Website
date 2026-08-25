import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'
import { finalizeSuccessfulPaystackPayment } from '@/lib/paystack-fulfillment'

export const dynamic = 'force-dynamic'

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const reference = String((await searchParams).reference || '').trim().slice(0, 160)
  if (!reference) return <PublicShell><Section eyebrow="Payment" title="Payment reference missing"><Card><p className="muted">Return to checkout or contact Nexora support.</p></Card></Section></PublicShell>
  try {
    const result = await finalizeSuccessfulPaystackPayment(reference)
    if (!result.ok) return <PublicShell><Section eyebrow="Payment pending" title="We are still confirming your payment"><Card><p className="muted">Your reference is {reference}. Refresh this page shortly; you will not be charged twice.</p></Card></Section></PublicShell>
    return <PublicShell><Section eyebrow="You're In" title="Payment confirmed and enrolment completed"><Card><p><strong>{result.programme.name}</strong></p><p className="muted">Reference: {result.reference}</p>{result.referral.attributionStatus === 'APPROVED' ? <p className="form-message success">Referral recorded successfully: {result.referral.referralCode}</p> : null}<ButtonLink href="/app" variant="primary">Go to My Dashboard</ButtonLink></Card></Section></PublicShell>
  } catch (error) {
    console.error('Payment return verification failed', error instanceof Error ? error.message : error)
    return <PublicShell><Section eyebrow="Payment received" title="Verification needs another moment"><Card><p className="muted">Keep this reference: {reference}. Refresh this page shortly or contact support; the signed Paystack webhook will continue processing safely.</p></Card></Section></PublicShell>
  }
}
