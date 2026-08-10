import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="foundation">
      <section className="panel">
        <p className="eyebrow">Temporary Access</p>
        <h1>Login will be rebuilt in V2.</h1>
        <p className="lead">
          Existing user identity, referral IDs, payment records and operational data are preserved. The old login interface has been removed so authentication can be redesigned cleanly.
        </p>
        <div className="actions">
          <Link href="/">Back to foundation</Link>
          <Link href="/api/system/health">Check integrations</Link>
        </div>
      </section>
    </main>
  )
}
