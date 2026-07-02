import type { Metadata } from 'next'
import AmbassadorApplicationForm from '@/app/ambassadors/apply/AmbassadorApplicationForm'

export const metadata: Metadata = {
  title: 'Growth Associate Recruitment | NEXORA',
  description: 'Private NEXORA Growth Associate recruitment application.',
}

export default function GrowthAssociateRecruitmentPage() {
  return <AmbassadorApplicationForm />
}
