'use client'

import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mic, MicOff, Send } from 'lucide-react'
import { motion } from 'framer-motion'

type ReviewAnswers = Record<string, string | string[]>

type AuditQuestion = {
  key: string
  section: string
  prompt: string
  helper?: string
  placeholder: string
}

type SpeechRecognitionConstructor = new () => {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

const starterDefaults: ReviewAnswers = {
  business_name: '',
  industry: '',
  phone_number: '',
  email: '',
  student_count: '',
  staff_count: '',
  team_size: '',
  installation_volume: '',
}

const auditQuestions: AuditQuestion[] = [
  {
    key: 'operational_bottlenecks',
    section: 'Operational Friction',
    prompt: 'What are the biggest things slowing the organization down right now?',
    helper: 'Mention delays, confusion, repeated work, poor handoffs, or anything that affects daily execution.',
    placeholder: 'Example: Parents call repeatedly for fee balances, follow-ups are missed, staff updates happen across many WhatsApp groups...',
  },
  {
    key: 'communication_followups',
    section: 'Communication',
    prompt: 'How do communication and follow-ups currently happen, and what usually gets missed?',
    helper: 'This can include customers, parents, leads, debtors, field teams, staff, or management updates.',
    placeholder: 'Describe the communication channels, who follows up, and where messages or reminders are often lost.',
  },
  {
    key: 'workflow_tracking',
    section: 'Workflow',
    prompt: 'How is work tracked from start to finish?',
    helper: 'Include the tools used and the manual or repetitive tasks the team still handles.',
    placeholder: 'Example: WhatsApp, Excel, notebooks, calls, manual approvals, repeated data entry...',
  },
  {
    key: 'payment_tracking',
    section: 'Payments',
    prompt: 'How are payments, fees, deposits, balances, or debtors tracked?',
    helper: 'For schools, focus on fees and parent reminders. For solar companies, focus on deposits, installments, and payment milestones.',
    placeholder: 'Explain how payment records, reminders, receipts, and outstanding balances are handled.',
  },
  {
    key: 'reporting_visibility',
    section: 'Visibility',
    prompt: 'What numbers or reports are hard to see clearly today?',
    helper: 'Think about the dashboard leadership wishes they had.',
    placeholder: 'Example: unpaid balances, admission pipeline, installation status, customer issues, staff activity, daily revenue...',
  },
  {
    key: 'growth_readiness',
    section: 'Growth',
    prompt: 'If the organization grows 2x, what would break first?',
    helper: 'This helps NEXORA understand where infrastructure is needed before growth creates pressure.',
    placeholder: 'Describe what would become difficult: communication, payments, staffing, reporting, field coordination, customer support...',
  },
  {
    key: 'automation_priority',
    section: 'Infrastructure Priority',
    prompt: 'What should NEXORA help automate, organize, or improve first?',
    helper: 'End with whether you want a follow-up consultation.',
    placeholder: 'Example: payment reminders first, parent communication first, installation tracking first, reporting dashboard first. Also mention if you want a consultation.',
  },
]

const inputClass =
  'min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-steel/55 focus:border-signal/60 focus:bg-white/[0.055]'

const textareaClass =
  'min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-steel/55 focus:border-signal/60 focus:bg-white/[0.055]'

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
  const text = `${answers.workflow_tracking || ''} ${answers.growth_readiness || ''} ${answers.automation_priority || ''}`
  if (!text.trim()) return 'Needs assessment'
  if (/manual|notebook|paper|whatsapp|excel/i.test(text)) return 'Manual or fragmented operations'
  return 'Ready for structured digitization'
}

function derivePaymentPotential(answers: ReviewAnswers) {
  const text = String(answers.payment_tracking || '')
  if (/debt|debtor|outstanding|unpaid|balance|installment|fee|reminder/i.test(text)) return 'Payment visibility and recovery opportunity'
  return text.trim() ? 'Payment workflow improvement opportunity' : 'Needs assessment'
}

function buildPayload(answers: ReviewAnswers) {
  const industry = String(answers.industry || '')
  const profileData =
    industry === 'School'
      ? {
          student_count: answers.student_count || '',
          staff_count: answers.staff_count || '',
        }
      : industry === 'Solar Company'
        ? {
            team_size: answers.team_size || '',
            installation_volume: answers.installation_volume || '',
          }
        : {}

  return {
    source: 'Website AI Operational Review',
    review_id: createReviewId(),
    business_name: answers.business_name || '',
    industry,
    contact_person: '',
    position: '',
    phone_number: answers.phone_number || '',
    email: answers.email || '',
    location: '',
    business_type: industry,
    team_size: toNumber(String(answers.team_size || answers.staff_count || '')),
    revenue_estimate: '',
    customer_volume: answers.student_count || answers.installation_volume || '',
    business_maturity: '',
    operational_scale: `${answers.student_count || answers.installation_volume || 'Unknown volume'} / ${answers.staff_count || answers.team_size || 'unknown team size'}`,
    infrastructure_maturity: deriveInfrastructureMaturity(answers),
    payment_potential: derivePaymentPotential(answers),
    growth_stage: '',
    communication_methods: [],
    workflow_structure: answers.workflow_tracking || '',
    operational_pain_points: splitPainPoints([
      String(answers.operational_bottlenecks || ''),
      String(answers.communication_followups || ''),
      String(answers.payment_tracking || ''),
      String(answers.growth_readiness || ''),
    ]),
    responses: answers,
    profile_data: profileData,
    completed_at: new Date().toISOString(),
  }
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="inline-flex items-center gap-2 rounded-[22px] rounded-tl-md border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-steel">
        <span>NEXORA is typing</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal/80" style={{ animationDelay: `${dot * 160}ms` }} />
          ))}
        </span>
      </div>
    </div>
  )
}

function RecordingWaveform({ transcript }: { transcript: string }) {
  const bars = [12, 22, 14, 30, 18, 36, 20, 28, 16, 24, 12, 32]

  return (
    <div className="rounded-[24px] border border-signal/35 bg-signal/10 p-4 shadow-[0_0_30px_rgba(79,140,255,0.15)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-signal shadow-[0_0_18px_rgba(79,140,255,.9)]" />
            Recording voice answer
          </div>
          <p className="mt-1 text-xs leading-6 text-steel">Speak naturally. Review and edit the transcript before continuing.</p>
        </div>
        <div className="flex h-12 items-center gap-1.5 rounded-2xl border border-white/10 bg-black/10 px-4">
          {bars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-1.5 animate-pulse rounded-full bg-signal/80"
              style={{ height, animationDelay: `${index * 90}ms` }}
            />
          ))}
        </div>
      </div>
      {transcript ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs leading-6 text-frost">
          <span className="text-steel">Live transcript: </span>
          {transcript}
        </div>
      ) : null}
    </div>
  )
}

function BotBubble({ section, children, helper }: { section?: string; children: React.ReactNode; helper?: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-[22px] rounded-tl-md border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-frost">
        {section ? <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-steel">{section}</span> : null}
        {children}
        {helper ? <p className="mt-2 text-xs leading-6 text-steel">{helper}</p> : null}
      </div>
    </div>
  )
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[92%] whitespace-pre-wrap rounded-[22px] rounded-tr-md border border-signal/30 bg-signal/15 px-4 py-3 text-sm leading-7 text-white">
        {children}
      </div>
    </div>
  )
}

export default function OperationalReviewChatbot() {
  const [answers, setAnswers] = useState<ReviewAnswers>(starterDefaults)
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null)
  const activeVoiceQuestionRef = useRef('')
  const voiceBaseTextRef = useRef('')
  const voiceSegmentsRef = useRef<Record<number, string>>({})

  const currentQuestion = auditQuestions[index]
  const isComplete = started && index >= auditQuestions.length
  const progress = started ? Math.round((Math.min(index + 1, auditQuestions.length) / auditQuestions.length) * 100) : 0
  const canStart = Boolean(String(answers.business_name || '').trim() && String(answers.industry || '').trim() && String(answers.phone_number || '').trim() && String(answers.email || '').trim())
  const canContinue = currentQuestion ? Boolean(String(answers[currentQuestion.key] || '').trim()) : true

  const updateAnswer = (key: string, value: string | string[]) => {
    setAnswers((current) => ({ ...current, [key]: value }))
    if (status === 'error') setStatus('idle')
    if (voiceError) setVoiceError('')
  }

  const visibleIntroFields = useMemo(() => {
    if (answers.industry === 'School') return ['student_count', 'staff_count']
    if (answers.industry === 'Solar Company') return ['team_size', 'installation_volume']
    return []
  }, [answers.industry])

  const showNextBotMessage = (nextIndex: number) => {
    setIsTyping(true)
    window.setTimeout(() => {
      setIndex(nextIndex)
      setIsTyping(false)
    }, 720)
  }

  const startAudit = () => {
    if (!canStart) return
    setStarted(true)
    setIsTyping(true)
    window.setTimeout(() => setIsTyping(false), 720)
  }

  const goNext = () => {
    if (!canContinue || isListening) return
    if (index >= auditQuestions.length - 1) {
      setIndex(auditQuestions.length)
      return
    }
    showNextBotMessage(index + 1)
  }

  const goBack = () => {
    if (isListening) stopListening()
    setIndex((current) => Math.max(current - 1, 0))
    setIsTyping(false)
  }

  const startListening = () => {
    if (!currentQuestion || typeof window === 'undefined') return
    const speechWindow = window as SpeechWindow
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition

    if (!Recognition) {
      setVoiceSupported(false)
      setVoiceError('Voice dictation is not available in this browser. Please type your answer instead.')
      return
    }

    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    activeVoiceQuestionRef.current = currentQuestion.key
    voiceBaseTextRef.current = String(answers[currentQuestion.key] || '').trim()
    voiceSegmentsRef.current = {}
    recognition.onresult = (event) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const phrase = event.results[i][0].transcript.trim()
        if (event.results[i].isFinal) voiceSegmentsRef.current[i] = phrase
        else interimTranscript += `${phrase} `
      }

      const finalTranscript = Object.entries(voiceSegmentsRef.current)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, phrase]) => phrase)
        .filter(Boolean)
        .join(' ')
        .trim()
      const combinedTranscript = [voiceBaseTextRef.current, finalTranscript].filter(Boolean).join(' ')

      setAnswers((current) => ({
        ...current,
        [activeVoiceQuestionRef.current]: combinedTranscript,
      }))
      setLiveTranscript(interimTranscript.trim())
    }
    recognition.onerror = () => {
      setIsListening(false)
      setVoiceError('Voice recording stopped unexpectedly. Please try again, or type/edit the transcript manually.')
    }
    recognition.onend = () => {
      setIsListening(false)
      setLiveTranscript('')
    }
    recognitionRef.current = recognition
    setVoiceError('')
    setLiveTranscript('')
    recognition.start()
    setIsListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    activeVoiceQuestionRef.current = ''
    voiceBaseTextRef.current = ''
    voiceSegmentsRef.current = {}
    setIsListening(false)
    setLiveTranscript('')
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

  if (status === 'success') {
    return (
      <motion.div id="operational-review-chatbot" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass mx-auto max-w-5xl rounded-[28px] p-6 md:p-8">
        <CheckCircle2 className="h-10 w-10 text-signal" />
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white">Operational review received.</h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-steel">
          Your review has been submitted. NEXORA will review your workflow and send recommendations through the WhatsApp number or email you provided.
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
            Fill in the basics, then complete a short seven-question audit. You can type or use voice dictation for faster answers.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-steel lg:min-w-64">
          <div className="flex items-center justify-between text-white">
            <span>{started ? (isComplete ? 'Ready to submit' : `Audit ${Math.min(index + 1, auditQuestions.length)} of ${auditQuestions.length}`) : 'Quick start'}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-signal transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {!started ? (
        <div className="mt-8 rounded-[24px] border border-white/10 bg-black/10 p-4 md:p-6">
          <BotBubble helper="We only need these details to identify the organization and know where to send the report.">
            First, share the basic details so we can prepare the review properly.
          </BotBubble>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Company or school name</span>
              <input className={inputClass} value={String(answers.business_name || '')} placeholder="Organization name" onChange={(event) => updateAnswer('business_name', event.target.value)} />
            </label>
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Industry</span>
              <div className="flex flex-wrap gap-2">
                {['School', 'Solar Company', 'SME/Other'].map((option) => {
                  const active = answers.industry === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateAnswer('industry', option)}
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
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">WhatsApp or phone number</span>
              <input className={inputClass} value={String(answers.phone_number || '')} placeholder="Phone number" onChange={(event) => updateAnswer('phone_number', event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Email address</span>
              <input className={inputClass} value={String(answers.email || '')} placeholder="Email address" onChange={(event) => updateAnswer('email', event.target.value)} />
            </label>
            {visibleIntroFields.includes('student_count') ? (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Number of students</span>
                <input className={inputClass} value={String(answers.student_count || '')} placeholder="Approximate student count" onChange={(event) => updateAnswer('student_count', event.target.value)} />
              </label>
            ) : null}
            {visibleIntroFields.includes('staff_count') ? (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Number of teachers/staff</span>
                <input className={inputClass} value={String(answers.staff_count || '')} placeholder="Approximate staff count" onChange={(event) => updateAnswer('staff_count', event.target.value)} />
              </label>
            ) : null}
            {visibleIntroFields.includes('team_size') ? (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Team size</span>
                <input className={inputClass} value={String(answers.team_size || '')} placeholder="Approximate team size" onChange={(event) => updateAnswer('team_size', event.target.value)} />
              </label>
            ) : null}
            {visibleIntroFields.includes('installation_volume') ? (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-steel">Installation volume</span>
                <input className={inputClass} value={String(answers.installation_volume || '')} placeholder="Weekly or monthly installations" onChange={(event) => updateAnswer('installation_volume', event.target.value)} />
              </label>
            ) : null}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={!canStart}
              onClick={startAudit}
              className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Start Audit
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-[24px] border border-white/10 bg-black/10 p-4 md:p-6">
          <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
            <BotBubble>NEXORA will keep this audit short. Seven focused questions, then we prepare the review.</BotBubble>
            {auditQuestions.slice(0, index).map((question) => (
              <div key={question.key} className="space-y-3">
                <BotBubble section={question.section}>{question.prompt}</BotBubble>
                <UserBubble>{String(answers[question.key] || 'Answered')}</UserBubble>
              </div>
            ))}
            {isTyping ? (
              <TypingIndicator />
            ) : !isComplete && currentQuestion ? (
              <BotBubble section={currentQuestion.section} helper={currentQuestion.helper}>{currentQuestion.prompt}</BotBubble>
            ) : (
              <BotBubble>The audit is complete. Submit it now so NEXORA can prepare your operational intelligence report.</BotBubble>
            )}
          </div>

          {!isComplete && currentQuestion && !isTyping ? (
            <div className="mt-6 space-y-3">
              <textarea
                className={textareaClass}
                value={String(answers[currentQuestion.key] || '')}
                placeholder={currentQuestion.placeholder}
                onChange={(event) => updateAnswer(currentQuestion.key, event.target.value)}
              />
              {isListening ? <RecordingWaveform transcript={liveTranscript} /> : null}
              {voiceError ? (
                <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-xs leading-6 text-red-100">
                  {voiceError}
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-6 text-steel">
                  {voiceSupported ? 'Use the microphone to dictate your answer, then edit the text if needed.' : 'Voice dictation is not supported in this browser. You can still type your answer.'}
                </p>
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
                    isListening ? 'border-signal/70 bg-signal/15 text-white' : 'border-white/10 bg-white/[0.035] text-steel hover:border-white/20 hover:text-white'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isListening ? 'Stop Recording' : 'Voice Answer'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
          We could not submit the review yet. Please try again, or contact NEXORA directly.
        </div>
      )}

      {started ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0 || status === 'submitting'}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-steel transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {!isComplete ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue || isTyping || isListening}
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
              {status === 'submitting' ? 'Submitting Audit' : status === 'error' ? 'Retry Submission' : 'Submit Audit'}
            </button>
          )}
        </div>
      ) : null}
    </motion.div>
  )
}
