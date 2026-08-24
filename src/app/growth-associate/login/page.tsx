'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function GrowthAssociateLogin() {
  const router = useRouter()
  const [message,setMessage] = useState('')
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('Signing in…')
    const form = new FormData(event.currentTarget)
    const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email: String(form.get('email')||'').trim().toLowerCase(), password: String(form.get('password')||'') })
    if (error) { setMessage(error.message); return }
    router.replace('/growth-associate'); router.refresh()
  }
  return <main className="associate-login"><Card><Link className="brand" href="/">Nexora Institute</Link><p className="eyebrow">Growth Associate Portal</p><h1>Sign in</h1><p className="muted">Use the Supabase account matching your approved associate biodata.</p><form className="form-grid" onSubmit={login}><label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email"/></label><label className="field"><span>Password</span><input name="password" type="password" required autoComplete="current-password"/></label>{message?<p className="form-message">{message}</p>:null}<button className="btn btn-primary">Sign in</button></form><Link href="/forgot-password">Forgot password?</Link></Card></main>
}
