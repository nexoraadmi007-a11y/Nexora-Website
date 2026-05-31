'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send } from 'lucide-react'
import { motion } from 'framer-motion'

type ReviewAnswers = Record<string, string | string[]>

type ReviewQuestion = {
  key: string
  section: string
  prompt: string
  helper?: string
  kind: 'text' | 'textarea' | 'choice' | 'multi'
  options?: string[]
  optional?: boolean
  show?: (answers: ReviewAnswers) => boolean
}

const initialAnswers: ReviewAnswers = {
  communication_methods: [],
}

const questions: ReviewQuestion[] = [
  { key: 'business_name', section: 'Business identity', prompt: 'What is the business or school name?', kind: 'text', helper: 'This helps us label the operational review correctly.' },
  { key: 'industry', section: 'Business identity', prompt: 'Which industry best describes the organization?', kind: 'choice', options: ['School', 'Solar Company', 'SME/Other'] },
  { key: 'contact_person', section: 'Business identity', prompt: 'Who should NEXORA contact about this review?', kind: 'text', helper: "Enter the contact person's full name." },
  { key: 'position', section: 'Business identity', prompt: 'What is their position or role?', kind: 'text', helper: 'Founder, administrator, operations lead, principal, manager, or similar.' },
  { key: 'phone_number', section: 'Business identity', prompt: 'What WhatsApp or phone number should we use to send updates about the report?', kind: 'text', helper: 'NEXORA will use this to communicate the review outcome and next steps.' },
  { key: 'email', section: 'Business identity', prompt: 'What email address should receive the operational review report?', kind: 'text' },
  { key: 'location', section: 'Business identity', prompt: 'Where is the organization located?', kind: 'text', helper: 'City, state, and country.' },
  { key: 'team_size', section: 'Business profile', prompt: 'How large is the team?', kind: 'text', helper: 'Approximate staff or team size is fine.' },
  { key: 'customer_volume', section: 'Business profile', prompt: 'What is the current customer or student volume?', kind: 'text', helper: 'For schools, use student count. For solar companies, use active customers or monthly inquiries.' },
  { key: 'revenue_estimate', section: 'Business profile', prompt: 'What is the estimated revenue level?', kind: 'text', optional: true, helper: 'You can skip this if you prefer.' },
  { key: 'business_maturity', section: 'Business profile', prompt: 'What stage best describes the organization?', kind: 'choice', options: ['Early', 'Growing', 'Established', 'Scaling'] },
  { key: 'current_tools', section: 'Business profile', prompt: 'What tools or software are currently used to run operations?', kind: 'textarea', helper: 'Examples: WhatsApp, Excel, notebooks, accounting software, school portal, CRM, field tools.' },
  { key: 'school_type', section: 'School profile', prompt: 'What type of school is it?', kind: 'choice', options: ['Nursery', 'Primary', 'Secondary', 'Hybrid'], show: (answers) => answers.industry === 'School' },
  { key: 'student_count', section: 'School profile', prompt: 'How many students are currently enrolled?', kind: 'text', show: (answers) => answers.industry === 'School' },
  { key: 'staff_count', section: 'School profile', prompt: 'How many staff members does the school have?', kind: 'text', show: (answers) => answers.industry === 'School' },
  { key: 'campuses', section: 'School profile', prompt: 'How many campuses or branches does the school operate?', kind: 'text', show: (answers) => answers.industry === 'School' },
  { key: 'parent_communication_method', section: 'School profile', prompt: 'How does the school currently communicate with parents?', kind: 'textarea', show: (answers) => answers.industry === 'School' },
  { key: 'fee_tracking_method', section: 'School profile', prompt: 'How are school fees, balances, and payment reminders tracked?', kind: 'textarea', show: (answers) => answers.industry === 'School' },
  { key: 'admission_workflow', section: 'School profile', prompt: 'How does the admission workflow currently move from inquiry to enrollment?', kind: 'textarea', show: (answers) => answers.industry === 'School' },
  { key: 'result_attendance_management', section: 'School profile', prompt: 'How are results, attendance, and academic reports managed?', kind: 'textarea', show: (answers) => answers.industry === 'School' },
  { key: 'solar_team_size', section: 'Solar profile', prompt: 'How large is the solar operations team?', kind: 'text', show: (answers) => answers.industry === 'Solar Company' },
  { key: 'installation_volume', section: 'Solar profile', prompt: 'What is the installation volume?', kind: 'text', helper: 'Weekly or monthly installation volume is fine.', show: (answers) => answers.industry === 'Solar Company' },
  { key: 'average_installation_value', section: 'Solar profile', prompt: 'What is the average installation value?', kind: 'text', optional: true, show: (answers) => answers.industry === 'Solar Company' },
  { key: 'customer_payment_structure', section: 'Solar profile', prompt: 'How do customers usually pay?', kind: 'textarea', helper: 'Full payment, deposit, installment, pay-as-you-go, or another structure.', show: (answers) => answers.industry === 'Solar Company' },
  { key: 'installment_tracking_method', section: 'Solar profile', prompt: 'How are installments and payment milestones tracked?', kind: 'textarea', show: (answers) => answers.industry === 'Solar Company' },
  { key: 'maintenance_request_process', section: 'Solar profile', prompt: 'How are maintenance requests received and resolved?', kind: 'textarea', show: (answers) => answers.industry === 'Solar Company' },
  { key: 'field_coordination_method', section: 'Solar profile', prompt: 'How are field teams coordinated for jobs and updates?', kind: 'textarea', show: (answers) => answers.industry === 'Solar Company' },
  { key: 'customer_followup_structure', section: 'Solar profile', prompt: 'How are customer follow-ups handled after sale or installation?', kind: 'textarea', show: (answers) => answers.industry === 'Solar Company' },
  { key: 'business_type', section: 'Business profile', prompt: 'What type of business is it?', kind: 'text', show: (answers) => answers.industry === 'SME/Other' },
  { key: 'operational_scale', section: 'Business profile', prompt: 'How would you describe the current operational scale?', kind: 'textarea', helper: 'Branches, departments, locations, daily order volume, or active workflow volume.', show: (answers) => answers.industry === 'SME/Other' },
  { key: 'communication_methods', section: 'Communication system', prompt: 'Which communication channels does the organization currently use?', kind: 'multi', options: ['WhatsApp', 'Calls', 'Physical visits', 'Email', 'Social media'] },
  { key: 'main_communication_problems', section: 'Communication system', prompt: 'What are the main communication problems?', kind: 'textarea', helper: 'Think about delays, repeated questions, lost messages, missed updates, or unclear ownership.' },
  { key: 'workflow_tracking', section: 'Workflow and operations', prompt: 'How is daily work currently tracked?', kind: 'textarea', helper: 'Tools, meetings, documents, chats, notebooks, dashboards, or informal updates.' },
  { key: 'manual_processes', section: 'Workflow and operations', prompt: 'Which processes are still manual?', kind: 'textarea' },
  { key: 'repetitive_tasks', section: 'Workflow and operations', prompt: 'What tasks does the team repeat often?', kind: 'textarea' },
  { key: 'approval_processes', section: 'Workflow and operations', prompt: 'How do approvals currently work?', kind: 'textarea', helper: 'Requests, payments, admissions, installations, spending, or internal decisions.' },
  { key: 'operational_bottlenecks', section: 'Workflow and operations', prompt: 'Where are the biggest operational bottlenecks?', kind: 'textarea' },
  { key: 'payment_tracking', section: 'Payment and tracking', prompt: 'How are payments, fees, deposits, or balances tracked?', kind: 'textarea' },
  { key: 'outstanding_balances', section: 'Payment and tracking', prompt: 'Are outstanding balances or debtors a challenge?', kind: 'textarea' },
  { key: 'payment_reminder_process', section: 'Payment and tracking', prompt: 'How are payment reminders sent?', kind: 'textarea' },
  { key: 'payment_tracking_challenges', section: 'Payment and tracking', prompt: 'What makes payment tracking difficult?', kind: 'textarea' },
  { key: 'followup_handling', section: 'Follow-up system', prompt: 'How are follow-ups currently handled?', kind: 'textarea', helper: 'Customers, parents, leads, debtors, field updates, internal tasks, or pending requests.' },
  { key: 'followup_owner', section: 'Follow-up system', prompt: 'Who owns follow-up inside the organization?', kind: 'text' },
  { key: 'missed_followups', section: 'Follow-up system', prompt: 'What follow-ups are often missed?', kind: 'textarea' },
  { key: 'reminders_used', section: 'Follow-up system', prompt: 'Are reminders currently used?', kind: 'choice', options: ['Yes', 'Partly', 'No'] },
  { key: 'reports_needed', section: 'Reporting and visibility', prompt: 'What reports are needed most?', kind: 'textarea' },
  { key: 'hard_to_track_numbers', section: 'Reporting and visibility', prompt: 'What numbers are hard to track today?', kind: 'textarea' },
  { key: 'desired_dashboard', section: 'Reporting and visibility', prompt: 'What would the organization want to see in one dashboard?', kind: 'textarea' },
  { key: 'growth_break_point', section: 'Growth and readiness', prompt: 'What would break first if the business grows 2x?', kind: 'textarea' },
  { key: 'automate_first', section: 'Growth and readiness', prompt: 'What should be automated first?', kind: 'textarea' },
  { key: 'open_to_digitizing', section: 'Growth and readiness', prompt: 'Is the organization open to digitizing operations?', kind: 'choice', options: ['Yes', 'Partly', 'Not yet'] },
  { key: 'wants_followup_consultation', section: 'Growth and readiness', prompt: 'Would you like a follow-up consultation after the review?', kind: 'choice', options: ['Yes', 'No'] },
  { key: 'additional_notes', section: 'Growth and readiness', prompt: 'Anything else NEXORA should understand before reviewing the operations?', kind: 'textarea', optional: true },
]

const textInputClass =
  'min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-steel/55 focus:border-signal/60 focus:bg-white/[0.055]'

const textareaClass =
  'min-h-32 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-steel/55 focus:border-signal/60 focus:bg-white/[0.055]'

function toNumber(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function createReviewId() {
  return `web-review-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function formatAnswer(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Skipped'
  return value?.trim() || 'Skipped'
}

function splitPainPoints(values: string[]) {
  return values
    .flatMap((value) => value.split(/[,\n]/))
    .map((value) => value.trim())
    .filter(Boolean)
}

function deriveInfrastructureMaturity(answers: ReviewAnswers) {
  const text = `${answers.current_tools || ''} ${answers.workflow_tracking || ''} ${answers.open_to_digitizing || ''}`
  if (!text.trim()) return 'Needs assessment'
  if (/paper|manual|notebook|physical/i.test(text)) return 'Manual operations'
  if (/yes|open/i.test(text)) return 'Ready for structured digitization'
  return 'Tool-assisted operations'
}

function derivePaymentPotential(answers: ReviewAnswers) {
  const text = `${answers.outstanding_balances || ''} ${answers.payment_tracking_challenges || ''}`
  if (/yes|many|high|debt|outstanding|unpaid|late/i.test(text)) return 'Payment recovery opportunity'
  if (String(answers.payment_tracking || '').trim()) return 'Payment visibility opportunity'
  return 'Needs assessment'
}

function buildPayload(answers: ReviewAnswers) {
  const industry = String(answers.industry || '')
  const profileData =
    industry === 'School'
      ? {
          school_type: answers.school_type || '',
          student_count: answers.student_count || '',
          staff_count: answers.staff_count || '',
          campuses: answers.campuses || '',
          parent_communication_method: answers.parent_communication_method || '',
          fee_tracking_method: answers.fee_tracking_method || '',
          admission_workflow: answers.admission_workflow || '',
          result_attendance_management: answers.result_attendance_management || '',
        }
      : industry === 'Solar Company'
        ? {
            team_size: answers.solar_team_size || answers.team_size || '',
            installation_volume: answers.installation_volume || '',
            average_installation_value: answers.average_installation_value || '',
            customer_payment_structure: answers.customer_payment_structure || '',
            installment_tracking_method: answers.installment_tracking_method || '',
            maintenance_request_process: answers.maintenance_request_process || '',
            field_coordination_method: answers.field_coordination_method || '',
            customer_followup_structure: answers.customer_followup_structure || '',
          }
        : {
            business_type: answers.business_type || '',
            operational_scale: answers.operational_scale || '',
          }

  return {
    source: 'Website AI Operational Review',
    review_id: createReviewId(),
    business_name: answers.business_name || '',
    industry,
    contact_person: answers.contact_person || '',
    position: answers.position || '',
    phone_number: answers.phone_number || '',
    email: answers.email || '',
    location: answers.location || '',
    business_type: answers.business_type || answers.school_type || industry,
    team_size: toNumber(String(answers.team_size || answers.solar_team_size || '')),
    revenue_estimate: answers.revenue_estimate || '',
    customer_volume: answers.customer_volume || answers.student_count || answers.installation_volume || '',
    business_maturity: answers.business_maturity || '',
    operational_scale: answers.operational_scale || `${answers.team_size || answers.solar_team_size || 'Unknown team size'} / ${answers.customer_volume || answers.student_count || answers.installation_volume || 'unknown volume'}`,
    infrastructure_maturity: deriveInfrastructureMaturity(answers),
    payment_potential: derivePaymentPotential(answers),
    growth_stage: answers.business_maturity || '',
    communication_methods: Array.isArray(answers.communication_methods) ? answers.communication_methods : [],
    workflow_structure: answers.workflow_tracking || '',
    operational_pain_points: splitPainPoints([
      String(answers.main_communication_problems || ''),
      String(answers.operational_bottlenecks || ''),
      String(answers.payment_tracking_challenges || ''),
      String(answers.missed_followups || ''),
      String(answers.growth_break_point || ''),
    ]),
    responses: answers,
    profile_data: profileData,
    completed_at: new Date().toISOString(),
  }
}

function isVisible(question: ReviewQuestion, answers: ReviewAnswers) {
  return question.show ? question.show(answers) : true
}

export default function OperationalReviewChatbot() {
  const [answers, setAnswers] = useState<ReviewAnswers>(initialAnswers)
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const visibleQuestions = useMemo(() => questions.filter((question) => isVisible(question, answers)), [answers])
  const safeIndex = Math.min(index, visibleQuestions.length - 1)
  const currentQuestion = visibleQuestions[safeIndex]
  const isComplete = index >= visibleQuestions.length
  const progress = Math.round((Math.min(index + 1, visibleQuestions.length) / visibleQuestions.length) * 100)

  const updateAnswer = (key: string, value: string | string[]) => {
    setAnswers((current) => ({ ...current, [key]: value }))
    if (status === 'error') setStatus('idle')
  }

  const goNext = () => {
    setIndex((current) => Math.min(current + 1, visibleQuestions.length))
  }

  const goBack = () => {
    setIndex((current) => Math.max(current - 1, 0))
  }

  const selectedAnswer = currentQuestion ? answers[currentQuestion.key] : ''
  const canContinue = !currentQuestion || currentQuestion.optional || (Array.isArray(selectedAnswer) ? selectedAnswer.length > 0 : Boolean(String(selectedAnswer || '').trim()))

  async function submitReview() {
    setStatus('submitting')

    try {
      const endpoint = process.env.NEXT_PUBLIC_OSEC_REVIEW_WEBHOOK_URL
      if (!endpoint) throw new Error('Missing review webhook URL')

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(answers)),
      })

      if (!response.ok) throw new Error('Review submission failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const transcript = visibleQuestions.slice(Math.max(0, safeIndex - 4), safeIndex)

  if (status === 'success') {
    return (
      <motion.div id="operational-review-chatbot" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass mx-auto max-w-5xl rounded-[28px] p-6 md:p-8">
        <CheckCircle2 className="h-10 w-10 text-signal" />
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">Operational review received.</h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-steel">
          {answers.wants_followup_consultation === 'Yes'
            ? 'Your review has been submitted. NEXORA will follow up through the WhatsApp number or email you provided to schedule the next step.'
            : 'Your operational review has been submitted. NEXORA will review your workflow and send recommendations through the WhatsApp number or email you provided.'}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div id="operational-review-chatbot" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass mx-auto max-w-6xl rounded-[28px] p-5 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <span className="eyebrow">Website AI Operational Review</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">Start Your Operational Review</h2>
          <p className="mt-4 text-base leading-8 text-steel">
            Complete the guided review directly on this website. NEXORA will use your WhatsApp number or email only to send the report and next steps.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-steel lg:min-w-64">
          <div className="flex items-center justify-between text-white">
            <span>{isComplete ? 'Ready to submit' : `Question ${safeIndex + 1} of ${visibleQuestions.length}`}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-signal transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[24px] border border-white/10 bg-black/10 p-4 md:p-6">
        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          <div className="flex justify-start">
            <div className="max-w-[92%] rounded-[22px] rounded-tl-md border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-frost">
              I will guide you through the same operational discovery process NEXORA uses before preparing recommendations.
            </div>
          </div>

          {transcript.map((question) => (
            <div key={question.key} className="space-y-3">
              <div className="flex justify-start">
                <div className="max-w-[92%] rounded-[22px] rounded-tl-md border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-frost">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-steel">{question.section}</span>
                  {question.prompt}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[92%] rounded-[22px] rounded-tr-md border border-signal/30 bg-signal/15 px-4 py-3 text-sm leading-7 text-white">
                  {formatAnswer(answers[question.key])}
                </div>
              </div>
            </div>
          ))}

          {!isComplete && currentQuestion ? (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-[22px] rounded-tl-md border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-frost">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-steel">{currentQuestion.section}</span>
                {currentQuestion.prompt}
                {currentQuestion.optional ? <span className="ml-2 text-steel">(optional)</span> : null}
                {currentQuestion.helper ? <p className="mt-2 text-xs leading-6 text-steel">{currentQuestion.helper}</p> : null}
              </div>
            </div>
          ) : (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-[22px] rounded-tl-md border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-frost">
                The website review is complete. Submit it now so NEXORA can prepare your operational intelligence report.
              </div>
            </div>
          )}
        </div>

        {!isComplete && currentQuestion ? (
          <div className="mt-6">
            {currentQuestion.kind === 'text' ? (
              <input
                className={textInputClass}
                value={String(answers[currentQuestion.key] || '')}
                placeholder="Type your answer here..."
                onChange={(event) => updateAnswer(currentQuestion.key, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && canContinue) goNext()
                }}
              />
            ) : null}

            {currentQuestion.kind === 'textarea' ? (
              <textarea
                className={textareaClass}
                value={String(answers[currentQuestion.key] || '')}
                placeholder="Type your answer here..."
                onChange={(event) => updateAnswer(currentQuestion.key, event.target.value)}
              />
            ) : null}

            {currentQuestion.kind === 'choice' ? (
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options?.map((option) => {
                  const active = answers[currentQuestion.key] === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateAnswer(currentQuestion.key, option)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? 'border-signal/70 bg-signal/15 text-white shadow-[0_0_30px_rgba(79,140,255,0.15)]'
                          : 'border-white/10 bg-white/[0.035] text-steel hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            ) : null}

            {currentQuestion.kind === 'multi' ? (
              <div className="flex flex-wrap gap-2">
                {currentQuestion.options?.map((option) => {
                  const values = Array.isArray(answers[currentQuestion.key]) ? answers[currentQuestion.key] as string[] : []
                  const active = values.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateAnswer(currentQuestion.key, active ? values.filter((item) => item !== option) : [...values, option])}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        active
                          ? 'border-signal/70 bg-signal/15 text-white shadow-[0_0_30px_rgba(79,140,255,0.15)]'
                          : 'border-white/10 bg-white/[0.035] text-steel hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {status === 'error' && (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
          We could not submit the review yet. Please try again, or contact NEXORA directly.
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={safeIndex === 0 || status === 'submitting'}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-steel transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          {!isComplete && currentQuestion?.optional ? (
            <button type="button" onClick={goNext} className="button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold">
              Skip
            </button>
          ) : null}

          {!isComplete ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue}
              className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitReview}
              disabled={status === 'submitting'}
              className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {status === 'submitting' ? 'Submitting Website Review' : status === 'error' ? 'Retry Submission' : 'Submit Website Review'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
