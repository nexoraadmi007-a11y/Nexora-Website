import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ReferralTracker } from '@/components/referral-tracker'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexora Institute | V2 Foundation',
  description: 'Nexora Institute platform V2 foundation after safe legacy product-layer reset.',
  icons: {
    icon: '/nexora-mark.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}><ReferralTracker /></Suspense>
        {children}
      </body>
    </html>
  )
}
