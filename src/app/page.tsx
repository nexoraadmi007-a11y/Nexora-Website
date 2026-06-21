import { CommunitySection, FinalCTA, Hero, ProblemSection, ProgramsPreview, WhoWeServe } from '@/components/sections/HomeSections'

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <WhoWeServe />
      <ProgramsPreview />
      <CommunitySection />
      <FinalCTA />
    </>
  )
}
