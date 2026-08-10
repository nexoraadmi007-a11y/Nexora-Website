import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

const items = ['Programme information', 'Career conversation guide', 'Business conversation guide', 'Approved partner language', 'Payment support', 'Class support']

export default function ResourcesPage() {
  return <PublicShell><Section eyebrow="Resources" title="Approved information and support paths."><div className="grid-3">{items.map((item) => <Card key={item}>{item}</Card>)}</div></Section></PublicShell>
}
