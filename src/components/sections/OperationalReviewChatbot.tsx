'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send } from 'lucide-react'
import { motion } from 'framer-motion'

type ReviewAnswers = Record<string, string | string[]>

const stepLabels = ['Identity', 'Profile', 'Industry', 'Communication', 'Workflow', 'Payments', 'Visibility', 'Readiness']

const initialAnswers: ReviewAnswers = {
  business_name: '',
  industry: '',
  contact_person: '',
  position: '',
  phone_number: '',
  email: '',
  location: '',
  team_size: '',
  customer_volume: '',
  revenue_estimate: '',
  business_maturity: '',
  current_tools: '',
  school_type: '',
  student_count: '',
  staff_count: '',
  campuses: '',
  parent_communication_method: '',
  fee_tracking_method: '',
  admission_workflow: '',
  result_attendance_management: '',
  solar_team_size: '',
  installation_volume: '',
  average_installation_value: '',
  customer_payment_structure: '',
  installment_tracking_method: '',
  maintenance_request_process: '',
  field_coordination_method: '',
  customer_followup_structure: '',
  business_type: '',
  operational_scale: '',
  communication_methods: [],
  main_communication_problems: '',
  workflow_tracking: '',
  manual_processes: '',
  repetitive_tasks: '',
  approval_processes: '',
  operational_bottlenecks: '',
  payment_tracking: '',
  outstanding_balances: '',
  payment_reminder_process: '',
  payment_tracking_challenges: '',
  followup_handling: '',
  followup_owner: '',
  missed_followups: '',
  reminders_used: '',
  reports_needed: '',
  hard_to_track_numbers: '',
  desired_dashboard: '',
  growth_break_point: '',
  automate_first: '',
  open_to_digitizing: '',
  wants_followup_consultation: '',
  additional_notes: '',
}

const textInputClass =
  'min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-steel/55 focus:border-signal/60 focus:bg-white/[0.055]'

const textareaClass =
  'min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-steel/55 focus:border-signal/60 focus:bg-white/[0.055]'

function toNumber(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function createReviewId() {
  return `web-review-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function splitPainPoints(values: string[]) {
  return values
    .flatMap((value) => value.split(/[,\n]/))
    .map((value) => value.trim())
    .filter(Boolean)
}

function deriveInfrastructureMaturity(answers: ReviewAnswers) {
  const tools = String(answers.current_tools || '').trim()
  const workflow = String(answers.workflow_tracking || '').trim()
  const digitizing = String(answers.open_to_digitizing || '').trim()

  if (!tools && !workflow) return 'Needs assessment'
  if (/paper|manual|notebook|physical/i.test(`${tools} ${workflow}`)) return 'Manual operations'
  if (/yes|open/i.test(digitizing)) return 'Ready for structured digitization'
  return 'Tool-assisted operations'
}

function derivePaymentPotential(answers: ReviewAnswers) {
  const paymentText = `${answers.outstanding_balances || ''} ${answers.payment_tracking_challenges || ''}`
  if (/yes|many|high|debt|outstanding|unpaid|late/i.test(paymentText)) return 'Payment recovery opportunity'
  if (String(answers.payment_tracking || '').trim()) return 'Payment visibility opportunity'
  return 'Needs assessment'
}

function buildPayload(answers: ReviewAnswers) {
  const industry = String(answers.industry || '')
  const profileData =
    industry === 'School'
      ? {
          school_type: answers.school_type,
          student_count: answers.student_count,
          staff_count: answers.staff_count,
          campuses: answers.campuses,
          parent_communication_method: answers.parent_communication_method,
          fee_tracking_method: answers.fee_tracking_method,
          admission_workflow: answers.admission_workflow,
          result_attendance_management: answers.result_attendance_management,
        }
      : industry === 'Solar Company'
        ? {
            team_size: answers.solar_team_size || answers.team_size,
            installation_volume: answers.installation_volume,
            average_installation_value: answers.average_installation_value,
            customer_payment_structure: answers.customer_payment_structure,
            installment_tracking_method: answers.installment_tracking_method,
            maintenance_request_process: answers.maintenance_request_process,
            field_coordination_method: answers.field_coordination_method,
            customer_followup_structure: answers.customer_followup_structure,
          }
        : {
            business_type: answers.business_type,
            operational_scale: answers.operational_scale,
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

function Field({ label, name, value, onChange, placeholder, optional = false }: {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  placeholder?: string
  optional?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">
        {label}{optional ? ' / Optional' : ''}
      </span>
      <input
        className={textInputClass}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  )
}

function TextArea({ label, name, value, onChange, placeholder, optional = false }: {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  placeholder?: string
  optional?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">
        {label}{optional ? ' / Optional' : ''}
      </span>
      <textarea
        className={textareaClass}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  )
}

function ChoiceGroup({ label, name, value, options, onChange }: {
  label: string
  name: string
  value: string
  options: string[]
  onChange: (name: string, value: string) => void
}) {
  return (
    <div>
      <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(name, option)}
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
    </div>
  )
}

function CheckboxGroup({ label, name, value, options, onChange }: {
  label: string
  name: string
  value: string[]
  options: string[]
  onChange: (name: string, value: string[]) => void
}) {
  return (
    <div>
      <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(name, active ? value.filter((item) => item !== option) : [...value, option])}
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
    </div>
  )
}

export default function OperationalReviewChatbot() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<ReviewAnswers>(initialAnswers)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const progress = useMemo(() => ((step + 1) / stepLabels.length) * 100, [step])
  const industry = String(answers.industry || '')

  const answer = (name: string) => String(answers[name] || '')
  const answerArray = (name: string) => (Array.isArray(answers[name]) ? answers[name] as string[] : [])

  const updateAnswer = (name: string, value: string) => {
    setAnswers((current) => ({ ...current, [name]: value }))
    if (status === 'error') setStatus('idle')
  }

  const updateArrayAnswer = (name: string, value: string[]) => {
    setAnswers((current) => ({ ...current, [name]: value }))
    if (status === 'error') setStatus('idle')
  }

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

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Business or school name" name="business_name" value={answer('business_name')} onChange={updateAnswer} placeholder="NEXORA Model School" />
          <ChoiceGroup label="Industry" name="industry" value={industry} options={['School', 'Solar Company', 'SME/Other']} onChange={updateAnswer} />
          <Field label="Contact person" name="contact_person" value={answer('contact_person')} onChange={updateAnswer} placeholder="Full name" />
          <Field label="Position or role" name="position" value={answer('position')} onChange={updateAnswer} placeholder="Founder, administrator, operations lead" />
          <Field label="Phone number" name="phone_number" value={answer('phone_number')} onChange={updateAnswer} placeholder="0701002613" />
          <Field label="Email" name="email" value={answer('email')} onChange={updateAnswer} placeholder="name@example.com" />
          <div className="md:col-span-2">
            <Field label="Location" name="location" value={answer('location')} onChange={updateAnswer} placeholder="City, state, country" />
          </div>
        </div>
      )
    }

    if (step === 1) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Team size" name="team_size" value={answer('team_size')} onChange={updateAnswer} placeholder="Number of staff/team members" />
          <Field label="Customer or student volume" name="customer_volume" value={answer('customer_volume')} onChange={updateAnswer} placeholder="Approximate active volume" />
          <Field label="Revenue estimate" name="revenue_estimate" value={answer('revenue_estimate')} onChange={updateAnswer} placeholder="Monthly or annual estimate" optional />
          <ChoiceGroup label="Business maturity" name="business_maturity" value={answer('business_maturity')} options={['Early', 'Growing', 'Established', 'Scaling']} onChange={updateAnswer} />
          <div className="md:col-span-2">
            <TextArea label="Current tools or software used" name="current_tools" value={answer('current_tools')} onChange={updateAnswer} placeholder="WhatsApp, Excel, notebooks, accounting tools, school portals, CRM, field tools..." />
          </div>
        </div>
      )
    }

    if (step === 2 && industry === 'School') {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <ChoiceGroup label="School type" name="school_type" value={answer('school_type')} options={['Nursery', 'Primary', 'Secondary', 'Hybrid']} onChange={updateAnswer} />
          <Field label="Student count" name="student_count" value={answer('student_count')} onChange={updateAnswer} placeholder="Approximate number" />
          <Field label="Staff count" name="staff_count" value={answer('staff_count')} onChange={updateAnswer} placeholder="Teaching and non-teaching staff" />
          <Field label="Number of campuses" name="campuses" value={answer('campuses')} onChange={updateAnswer} placeholder="1, 2, 3..." />
          <TextArea label="Parent communication method" name="parent_communication_method" value={answer('parent_communication_method')} onChange={updateAnswer} placeholder="How parents currently receive updates and make requests" />
          <TextArea label="School fee tracking method" name="fee_tracking_method" value={answer('fee_tracking_method')} onChange={updateAnswer} placeholder="How payments, balances, and reminders are handled" />
          <TextArea label="Admission workflow" name="admission_workflow" value={answer('admission_workflow')} onChange={updateAnswer} placeholder="How inquiries become admitted students" />
          <TextArea label="Results, attendance, and reports" name="result_attendance_management" value={answer('result_attendance_management')} onChange={updateAnswer} placeholder="How academic records and attendance are managed" />
        </div>
      )
    }

    if (step === 2 && industry === 'Solar Company') {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Solar team size" name="solar_team_size" value={answer('solar_team_size')} onChange={updateAnswer} placeholder="Sales, admin, engineers, field team" />
          <Field label="Installation volume" name="installation_volume" value={answer('installation_volume')} onChange={updateAnswer} placeholder="Weekly or monthly installations" />
          <Field label="Average installation value" name="average_installation_value" value={answer('average_installation_value')} onChange={updateAnswer} placeholder="Approximate project value" optional />
          <TextArea label="Customer payment structure" name="customer_payment_structure" value={answer('customer_payment_structure')} onChange={updateAnswer} placeholder="Full payment, deposit, installments, pay-as-you-go..." />
          <TextArea label="Installment/payment tracking" name="installment_tracking_method" value={answer('installment_tracking_method')} onChange={updateAnswer} placeholder="How payment milestones are tracked" />
          <TextArea label="Maintenance request process" name="maintenance_request_process" value={answer('maintenance_request_process')} onChange={updateAnswer} placeholder="How customers report issues after installation" />
          <TextArea label="Field coordination method" name="field_coordination_method" value={answer('field_coordination_method')} onChange={updateAnswer} placeholder="How technicians receive jobs and updates" />
          <TextArea label="Customer follow-up structure" name="customer_followup_structure" value={answer('customer_followup_structure')} onChange={updateAnswer} placeholder="How post-sale and maintenance follow-ups happen" />
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Business type" name="business_type" value={answer('business_type')} onChange={updateAnswer} placeholder="Retail, services, logistics, professional services..." />
          <Field label="Operational scale" name="operational_scale" value={answer('operational_scale')} onChange={updateAnswer} placeholder="Branches, departments, locations, daily volume" />
          <div className="md:col-span-2">
            <TextArea label="Current operating structure" name="workflow_tracking" value={answer('workflow_tracking')} onChange={updateAnswer} placeholder="Briefly describe how work moves across the business today" />
          </div>
        </div>
      )
    }

    if (step === 3) {
      return (
        <div className="grid gap-5">
          <CheckboxGroup label="Current communication methods" name="communication_methods" value={answerArray('communication_methods')} options={['WhatsApp', 'Calls', 'Physical visits', 'Email', 'Social media']} onChange={updateArrayAnswer} />
          <TextArea label="Main communication problems" name="main_communication_problems" value={answer('main_communication_problems')} onChange={updateAnswer} placeholder="Where information gets lost, delayed, repeated, or misunderstood" />
        </div>
      )
    }

    if (step === 4) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <TextArea label="How daily work is tracked" name="workflow_tracking" value={answer('workflow_tracking')} onChange={updateAnswer} placeholder="Tools, documents, meetings, chats, notebooks, dashboards..." />
          <TextArea label="Manual processes" name="manual_processes" value={answer('manual_processes')} onChange={updateAnswer} placeholder="Work that still depends on paper, calls, manual typing, or repeated checking" />
          <TextArea label="Repetitive tasks" name="repetitive_tasks" value={answer('repetitive_tasks')} onChange={updateAnswer} placeholder="Tasks the team repeats every day or week" />
          <TextArea label="Approval processes" name="approval_processes" value={answer('approval_processes')} onChange={updateAnswer} placeholder="Who approves work, money, requests, admissions, installations, or decisions" />
          <div className="md:col-span-2">
            <TextArea label="Operational bottlenecks" name="operational_bottlenecks" value={answer('operational_bottlenecks')} onChange={updateAnswer} placeholder="What slows the business down most often" />
          </div>
        </div>
      )
    }

    if (step === 5) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <TextArea label="Payment or fee tracking" name="payment_tracking" value={answer('payment_tracking')} onChange={updateAnswer} placeholder="How paid, unpaid, deposits, balances, and receipts are tracked" />
          <TextArea label="Outstanding balances or debtors" name="outstanding_balances" value={answer('outstanding_balances')} onChange={updateAnswer} placeholder="Whether unpaid balances are common, and how they are monitored" />
          <TextArea label="Payment reminder process" name="payment_reminder_process" value={answer('payment_reminder_process')} onChange={updateAnswer} placeholder="How reminders are sent and who sends them" />
          <TextArea label="Payment tracking challenges" name="payment_tracking_challenges" value={answer('payment_tracking_challenges')} onChange={updateAnswer} placeholder="What is hard to confirm, reconcile, or follow up" />
        </div>
      )
    }

    if (step === 6) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <TextArea label="How follow-ups are handled" name="followup_handling" value={answer('followup_handling')} onChange={updateAnswer} placeholder="Parents, leads, customers, debtors, field updates, internal tasks..." />
          <Field label="Who owns follow-up" name="followup_owner" value={answer('followup_owner')} onChange={updateAnswer} placeholder="Role or team responsible" />
          <TextArea label="Follow-ups often missed" name="missed_followups" value={answer('missed_followups')} onChange={updateAnswer} placeholder="What usually falls through the cracks" />
          <ChoiceGroup label="Are reminders currently used?" name="reminders_used" value={answer('reminders_used')} options={['Yes', 'Partly', 'No']} onChange={updateAnswer} />
          <TextArea label="Reports needed" name="reports_needed" value={answer('reports_needed')} onChange={updateAnswer} placeholder="Daily, weekly, fee/payment, customer, admission, installation, staff, performance reports..." />
          <TextArea label="Numbers that are hard to track" name="hard_to_track_numbers" value={answer('hard_to_track_numbers')} onChange={updateAnswer} placeholder="Metrics leadership cannot see quickly today" />
          <div className="md:col-span-2">
            <TextArea label="What should appear in one dashboard?" name="desired_dashboard" value={answer('desired_dashboard')} onChange={updateAnswer} placeholder="The numbers, alerts, and activities you want visible at a glance" />
          </div>
        </div>
      )
    }

    return (
      <div className="grid gap-5 md:grid-cols-2">
        <TextArea label="What would break if the business grows 2x?" name="growth_break_point" value={answer('growth_break_point')} onChange={updateAnswer} placeholder="Communication, payments, customer support, reporting, staff coordination..." />
        <TextArea label="What should be automated first?" name="automate_first" value={answer('automate_first')} onChange={updateAnswer} placeholder="The first workflow NEXORA should examine for automation" />
        <ChoiceGroup label="Open to digitizing operations?" name="open_to_digitizing" value={answer('open_to_digitizing')} options={['Yes', 'Partly', 'Not yet']} onChange={updateAnswer} />
        <ChoiceGroup label="Want a follow-up consultation?" name="wants_followup_consultation" value={answer('wants_followup_consultation')} options={['Yes', 'No']} onChange={updateAnswer} />
        <div className="md:col-span-2">
          <TextArea label="Additional notes" name="additional_notes" value={answer('additional_notes')} onChange={updateAnswer} placeholder="Anything else NEXORA should understand before reviewing your operations" optional />
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass mx-auto max-w-5xl rounded-[28px] p-6 md:p-8">
        <CheckCircle2 className="h-10 w-10 text-signal" />
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">Operational review received.</h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-steel">
          {answer('wants_followup_consultation') === 'Yes'
            ? 'Your review has been submitted. Our team will follow up to schedule the next step.'
            : 'Your operational review has been submitted. NEXORA will review your workflow and follow up with recommendations.'}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass mx-auto max-w-6xl rounded-[28px] p-5 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <span className="eyebrow">Website AI Operational Review</span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">Start Your Operational Review</h2>
          <p className="mt-4 text-base leading-8 text-steel">
            Answer a few guided questions so NEXORA can understand your workflow, bottlenecks, and improvement opportunities.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-steel lg:min-w-64">
          <div className="flex items-center justify-between text-white">
            <span>Step {step + 1} of {stepLabels.length}</span>
            <span>{stepLabels[step]}</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-signal transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[24px] border border-white/10 bg-black/10 p-4 md:p-6">
        {renderStep()}
      </div>

      {status === 'error' && (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
          We could not submit the review yet. Please try again, or contact NEXORA directly.
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || status === 'submitting'}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-steel transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          {step < stepLabels.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(stepLabels.length - 1, current + 1))}
              className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-300 hover:-translate-y-0.5"
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
              {status === 'submitting' ? 'Submitting Review' : status === 'error' ? 'Retry Submission' : 'Submit Operational Review'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
