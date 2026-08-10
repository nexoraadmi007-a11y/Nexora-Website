import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import ReferralTracker from '@/components/layout/ReferralTracker'

export const metadata: Metadata = {
  title: 'Nexura Institute | Skills-to-Income Infrastructure for the AI Economy',
  description: 'Nexura Institute helps young Africans learn practical AI-powered skills, build real projects, prepare income-ready portfolios, and access future work opportunities.',
  icons: {
    icon: '/nexora-mark.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <WhatsAppButton />
        <ReferralTracker />
      </body>
    </html>
  )
}
