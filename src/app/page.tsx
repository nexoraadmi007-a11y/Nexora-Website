import InstituteHome from './institute-home'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ interest?: string; programme?: string }> }) {
  const { interest, programme } = await searchParams
  return <InstituteHome interest={interest} programme={programme} />
}
