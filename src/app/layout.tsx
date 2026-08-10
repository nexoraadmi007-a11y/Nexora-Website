import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexura Institute | V2 Foundation',
  description: 'Nexura Institute platform V2 foundation after safe legacy product-layer reset.',
  icons: {
    icon: '/nexora-mark.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
