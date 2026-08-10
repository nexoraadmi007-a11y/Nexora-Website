import { AppShell } from '@/components/shell'
import { Card, Field } from '@/components/ui'

export default function ProfilePage() {
  return <AppShell title="Profile"><Card><form className="form-grid"><div className="grid-2"><Field name="name" label="Name" /><Field name="phone" label="Phone" /><Field name="location" label="Location" /><Field name="linkedin" label="LinkedIn" /></div><button className="btn btn-primary" type="button">Save profile</button></form></Card></AppShell>
}
