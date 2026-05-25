import Link from 'next/link'

export default function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="NEXORA home">
      <img
        src="/nexora-logo.png"
        alt="NEXORA"
        className="h-10 w-auto object-contain md:h-11"
      />
    </Link>
  )
}
