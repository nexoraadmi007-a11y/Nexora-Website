import type { Metadata } from 'next'
import PaymentSuccessClient from './PaymentSuccessClient'

export const metadata: Metadata = {
  title: 'Payment Successful | NEXORA Institute',
  description: 'Confirm your Nexora programme payment and view your next onboarding step.',
}

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const params = await searchParams
  return <PaymentSuccessClient reference={params.reference || ''} />
}
