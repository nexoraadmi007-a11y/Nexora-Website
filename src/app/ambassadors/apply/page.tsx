import type { Metadata } from 'next'
import AmbassadorApplicationForm from './AmbassadorApplicationForm'

export const metadata: Metadata = {
  title: 'NEXORA Ambassador Network | Apply',
  description: 'Apply to represent NEXORA, grow professional communities, and earn recognition for verified impact.',
}

export default function AmbassadorApplyPage() {
  return <AmbassadorApplicationForm />
}
