import Link from 'next/link'
import { AppShell } from '@/components/shell'
import { Card } from '@/components/ui'
import { studentDashboard } from '@/lib/student-learning'

export const dynamic = 'force-dynamic'
const money = (value: number) => `₦${Number(value || 0).toLocaleString('en-NG')}`
const date = (value: string) => value ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date'

export default async function AppHomePage() {
  const dashboard = await studentDashboard()
  return <AppShell title={`Welcome back, ${dashboard.name}`}><div className="page-grid student-dashboard">
    <section><div className="section-heading"><div><p className="eyebrow">My Courses</p><h2>Your learning</h2></div><Link className="btn btn-secondary" href="/app/programmes">Browse courses</Link></div>
      {dashboard.enrolments.length ? <div className="grid-3">{dashboard.enrolments.map((enrolment: any) => <Card key={enrolment.id}><h3>{enrolment.programmes?.name}</h3><p className="muted">{enrolment.programmes?.short_description || 'Continue your course lessons, classes and assignments.'}</p><p className="course-price">{money(enrolment.programmes?.price_ngn)}</p><Link className="btn btn-primary" href={`/app/programmes/${enrolment.programmes?.slug}`}>Continue Learning</Link></Card>)}</div> : <Card><h3>No active courses yet</h3><p className="muted">Choose your first course to begin learning.</p><Link className="btn btn-primary" href="/checkout">Choose courses</Link></Card>}
    </section>
    <div className="dashboard-grid"><Card><p className="eyebrow">Upcoming Class</p>{dashboard.upcoming ? <><h3>{dashboard.upcoming.title}</h3><p>{date(dashboard.upcoming.session_date)} · {dashboard.upcoming.start_time || 'Time to be announced'}</p><p className="muted">{dashboard.upcoming.class?.programmes?.name || dashboard.upcoming.class?.name}</p>{dashboard.upcoming.meeting_url ? <a className="btn btn-primary" href={dashboard.upcoming.meeting_url} target="_blank" rel="noreferrer">Join Class</a> : <span className="status-pill warning">Meeting link pending</span>}</> : <><h3>No class scheduled</h3><p className="muted">Your next published class will appear here.</p><Link className="btn btn-secondary" href="/app/classes">View classes</Link></>}</Card>
      <Card><div className="section-heading"><div><p className="eyebrow">Recent Assignments</p><h3>Keep up with your work</h3></div><Link href="/app/assignments">View all</Link></div>{dashboard.assignments.length ? <ul className="compact-list">{dashboard.assignments.map((assignment: any) => <li key={assignment.id}><div><strong>{assignment.title}</strong><span>{assignment.classes?.programmes?.name || assignment.classes?.name}</span></div><div><small>{date(assignment.due_at)}</small><span className={`status-pill ${assignment.submission ? 'success' : 'warning'}`}>{assignment.submission ? assignment.submission.status : 'Pending'}</span></div></li>)}</ul> : <p className="muted">No assignments have been published yet.</p>}</Card>
    </div>
    {dashboard.recordings.length ? <section><p className="eyebrow">Recent Class Recordings</p><div className="grid-2">{dashboard.recordings.map((recording: any) => <Card key={recording.id}><h3>{recording.title}</h3><p className="muted">{recording.class?.programmes?.name || recording.class?.name}</p>{recording.external_url ? <a className="btn btn-secondary" href={recording.external_url} target="_blank" rel="noreferrer">Watch Recording</a> : null}</Card>)}</div></section> : null}
  </div></AppShell>
}
