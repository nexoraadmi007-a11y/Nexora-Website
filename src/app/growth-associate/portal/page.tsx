import type { Metadata } from 'next'
import AssociatePortalClient from './AssociatePortalClient'

export const metadata: Metadata = {
  title: 'Growth Associate Portal | NEXORA',
  description: 'Private NEXORA Growth Associate referral dashboard.',
  robots: { index: false, follow: false },
}

export default function GrowthAssociatePortalPage() {
  return <AssociatePortalClient />
}
