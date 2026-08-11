import { notFound } from 'next/navigation'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { DataTable, ProgressBar } from '@/components/product'
import { findProgramme, formatNaira, skillToIncomeModule } from '@/config/programmes'

type Props = { params: Promise<{ slug: string }> }

export default async function AppProgrammeDetailPage({ params }: Props) {
  const { slug } = await params
  const programme = findProgramme(slug)
  if (!programme) notFound()

  const isCareer = programme.code === 'AI_INCOME_ACCELERATOR'

  return (
    <AppShell title={programme.name}>
      <div className="page-grid">
        <div className="dashboard-grid">
          <Card>
            <p className="eyebrow">Overview</p>
            <h3>{programme.proposition}</h3>
            <p className="muted">Duration: {programme.duration}</p>
            <div className="tag-row">{programme.audience.map((item) => <span key={item}>{item}</span>)}</div>
          </Card>
          <Card>
            <p className="eyebrow">Price</p>
            <p className="price">{formatNaira(programme.priceNgn)}</p>
            <p className="muted">This is the current approved programme fee.</p>
            <a className="btn btn-primary" href={`/checkout?programme=${programme.slug}`}>Enrol for {formatNaira(programme.priceNgn)}</a>
          </Card>
        </div>

        {isCareer ? (
          <Card>
            <h3>Tracks</h3>
            <div className="grid-2">
              {programme.tracks.map((track) => (
                <div className="programme-card" key={track.code}>
                  <h3>{track.name}</h3>
                  <p>{track.summary}</p>
                  <div className="tag-row">{track.learn.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div>
                  <a className="btn btn-secondary" href={`/programmes/ai-income-accelerator/${track.slug}`}>View track</a>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <h3>Transformation Areas</h3>
            <div className="tag-row">{['Brand', 'Digital Presence', 'Customer Management', 'Marketing', 'Sales', 'Automation', 'Reporting'].map((area) => <span key={area}>{area}</span>)}</div>
          </Card>
        )}

        <div className="grid-2">
          <Card>
            <h3>What You Will Learn</h3>
            <ul className="list">{programme.outcomes.map((item) => <li key={item}>{item}</li>)}</ul>
          </Card>
          <Card>
            <h3>{skillToIncomeModule.title}</h3>
            <ul className="list">{skillToIncomeModule.topics.slice(0, 5).map((topic) => <li key={topic}>{topic}</li>)}</ul>
          </Card>
        </div>

        <Card>
          <h3>Programme Structure</h3>
          <ProgressBar value={0} />
          <DataTable
            headers={['Stage', 'Focus', 'Output']}
            rows={[
              ['01', 'Foundations', 'Baseline profile and learning plan'],
              ['02', 'Core Skills', 'Guided lessons and live practice'],
              ['03', 'Applied Project', 'Portfolio-ready proof of work'],
              ['04', 'Review', 'Feedback, improvement and certification check'],
              ['05', 'Income Pathway', 'Service offer, portfolio and outreach readiness'],
            ]}
          />
        </Card>
      </div>
    </AppShell>
  )
}
