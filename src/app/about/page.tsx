import { PublicShell } from '@/components/shell'
import { Card, Section } from '@/components/ui'

export default function AboutPage() {
  return (
    <PublicShell>
      <Section eyebrow="About Nexora Institute" title="A bridge between AI skills and economic opportunity.">
        <Card><p className="muted">Africa is entering a labour market being reshaped by AI. Nexora Institute exists to help people build relevant skills, prove those skills through real projects and connect that capability to responsible income and work pathways.</p></Card>
      </Section>
    </PublicShell>
  )
}
