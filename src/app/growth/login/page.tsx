import Link from 'next/link'
import { Card } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function GrowthLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams
  const error = params?.error || ''
  const message = params?.message || ''

  return (
    <main className="associate-login auth-standalone">
      <Card>
        <Link className="brand" href="/">Nexora Institute</Link>
        <p className="eyebrow">Growth Associate Portal</p>
        <h1>Sign in to your associate account</h1>
        <p className="muted">Use the WhatsApp number and password created during associate registration.</p>
        <form className="form-grid" method="post" action="/api/growth/login">
          <label className="field">
            <span>WhatsApp Number</span>
            <input name="whatsapp" required inputMode="tel" autoComplete="tel" placeholder="08012345678" />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          {error ? <p className="form-message error" aria-live="polite">{error}</p> : null}
          {message ? <p className="form-message success" aria-live="polite">{message}</p> : null}
          <button className="btn btn-primary" type="submit">Sign in</button>
        </form>
        <p>New Growth Associate? <Link href="/growth/register">Create an account</Link></p>
        <p className="muted">Password recovery will be available when verified WhatsApp messaging is enabled.</p>
      </Card>
    </main>
  )
}
