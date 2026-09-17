import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexora Institute | Building Africa\'s AI-ready workforce',
  description: 'Practical AI training for Nigerian professionals, NYSC members, graduates and organizations.',
  keywords: ['Nexora Institute', 'AI training Nigeria', 'AI training for professionals', 'corporate AI training'],
  icons: { icon: '/nexora-mark.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
