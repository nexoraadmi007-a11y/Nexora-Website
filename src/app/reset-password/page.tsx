import { PublicShell } from '@/components/shell'
import { Card, Field, Section } from '@/components/ui'

export default function ResetPasswordPage() {
  return <PublicShell><Section eyebrow="Reset Password" title="Choose a new secure password."><Card><form className="form-grid"><Field name="password" label="New Password" type="password" required /><Field name="confirmPassword" label="Confirm Password" type="password" required /><button className="btn btn-primary" type="button">Reset password</button></form></Card></Section></PublicShell>
}
