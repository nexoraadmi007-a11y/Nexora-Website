import { BarChart3, BriefcaseBusiness, FolderKanban, GraduationCap, Target } from 'lucide-react'
import { AppShell } from '@/components/shell'
import { ActionCard, ChecklistItem, LearningStep, MetricCard, ProgressBar } from '@/components/product'
import { Card } from '@/components/ui'

export default function AppHomePage() {
  return (
    <AppShell title="Good morning. Here's your next best move.">
      <div className="page-grid">
        <div className="dashboard-grid">
          <ActionCard eyebrow="Start Your Nexora Journey" title="Choose a skill path and begin building toward income." href="/app/programmes" action="Explore Programmes">
            Pick one AI-powered programme, understand the track outcomes, then move into enrolment when you are ready.
          </ActionCard>
          <Card>
            <h3>Onboarding Checklist</h3>
            <p className="muted">Complete the essentials so your workspace can personalise learning, projects and opportunities.</p>
            <ul className="checklist">
              <ChecklistItem done>Account created</ChecklistItem>
              <ChecklistItem>Complete profile</ChecklistItem>
              <ChecklistItem>Choose programme</ChecklistItem>
              <ChecklistItem>Complete payment</ChecklistItem>
              <ChecklistItem>View first class</ChecklistItem>
            </ul>
          </Card>
        </div>

        <div className="metric-grid">
          <MetricCard icon={GraduationCap} label="Programme Progress" value="-" note="Starts after enrolment." />
          <MetricCard icon={FolderKanban} label="Projects Completed" value="0" note="Your first project unlocks after Module 1." />
          <MetricCard icon={BriefcaseBusiness} label="Portfolio Progress" value="15%" note="Profile created; projects are next." />
          <MetricCard icon={Target} label="Income Readiness" value="20%" note="Choose a track to improve readiness." />
          <MetricCard icon={BarChart3} label="Opportunity Readiness" value="-" note="Calculated from profile, projects and portfolio." />
        </div>

        <div className="dashboard-grid">
          <Card>
            <h3>Your Learning Path</h3>
            <p className="muted">This is the default path for every Nexora learner. Your exact modules appear after programme selection.</p>
            <ul className="learning-path">
              <LearningStep label="01 Foundations" state="current" />
              <LearningStep label="02 Core Skills" state="locked" />
              <LearningStep label="03 Applied Project" state="locked" />
              <LearningStep label="04 Portfolio" state="locked" />
              <LearningStep label="05 From Skill to Income" state="locked" />
            </ul>
          </Card>
          <Card>
            <h3>Income Readiness</h3>
            <p className="price">20%</p>
            <ProgressBar value={20} />
            <ul className="checklist">
              <ChecklistItem done>Profile started</ChecklistItem>
              <ChecklistItem>Skill selected</ChecklistItem>
              <ChecklistItem>Complete first project</ChecklistItem>
              <ChecklistItem>Define your service</ChecklistItem>
              <ChecklistItem>Build portfolio</ChecklistItem>
            </ul>
          </Card>
        </div>

        <div className="dashboard-grid">
          <Card>
            <p className="eyebrow">Next Live Class</p>
            <h3>No class scheduled yet.</h3>
            <p className="muted">Your programme manager will publish the next class here after your enrolment and track are confirmed.</p>
            <div className="card-actions">
              <a className="btn btn-secondary" href="/app/programmes">View Programme</a>
              <a className="btn btn-ghost" href="/app/classes">Open Classes</a>
            </div>
          </Card>
          <Card>
            <h3>Recent Activity</h3>
            <ul className="timeline-list">
              <li><span>Profile</span><strong>Account workspace created</strong><small>Today</small></li>
              <li><span>Programmes</span><strong>AI Income Accelerator is available</strong><small>Now</small></li>
              <li><span>Partner</span><strong>Partner activation is ready when you are</strong><small>Now</small></li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
