import { notFound, redirect } from 'next/navigation'
import { findCourse } from '@/lib/accelerator-products'

export default async function LegacyTrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params
  const course = findCourse(track)
  if (!course) notFound()
  redirect(`/programmes/${course.slug}`)
}
