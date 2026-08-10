import Link from 'next/link'

const preserved = [
  'Deployment configuration',
  'Airtable, Paystack, Telegram and email integration adapters',
  'Production data and historical records',
  'Brand assets and private HR assets',
]

export default function HomePage() {
  return (
    <main className="foundation">
      <section className="panel">
        <p className="eyebrow">Nexura Institute</p>
        <h1>Platform V2 is being prepared.</h1>
        <p className="lead">
          The legacy product layer has been reset. Infrastructure, integrations, production data and restore points are preserved while the next architecture is designed properly.
        </p>
        <div className="actions">
          <Link href="/login">Temporary login</Link>
          <Link href="/api/system/health">Integration health</Link>
        </div>
        <div className="grid">
          {preserved.map((item) => (
            <div key={item} className="card">{item}</div>
          ))}
        </div>
      </section>
    </main>
  )
}
