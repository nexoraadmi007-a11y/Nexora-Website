import { AcademyLabs, FinalCTA, Hero, IndustriesPreview, ProblemSection, ProcessSection, WhatWeDo } from '@/components/sections/HomeSections'

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <IndustriesPreview />
      <WhatWeDo />
      <ProcessSection />
      <AcademyLabs />
      <FinalCTA />
    </>
  )
}
