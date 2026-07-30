'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'

type KnowledgeConflict = {
  field: string
  websiteValue: string
  databaseValue: string
  hardCodedValue: string
  lastUpdatedTime: string
  recommendedResolution: string
  adminApprovalStatus: string
}

type Programme = {
  id: string
  name: string
  programmeFamily: string
  currentPrice: number
  duration: string
  tracks?: Array<{ name: string; currentPrice: number; duration: string }>
}

type Report = {
  mode?: string
  snapshot?: {
    version: string
    generatedAt: string
    approvedAt: string
    approvedBy: string
    programmes: Programme[]
    conflicts: KnowledgeConflict[]
  }
  website?: {
    extractedAt: string
    careerPrice?: number
    careerProgrammeCount?: number
    businessPrice?: number
    businessDuration?: string
    error?: string
  }
  conflicts?: KnowledgeConflict[]
  error?: string
}

function ngn(value: number) {
  return `NGN ${Number(value || 0).toLocaleString('en-NG')}`
}

export default function CopilotKnowledgePage() {
  const [secret, setSecret] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)

  async function load(sync = false) {
    setLoading(true)
    try {
      const response = await fetch(`/api/growth/copilot-knowledge${sync ? '?sync=website' : ''}`, {
        headers: { 'x-nexora-admin-secret': secret },
      })
      setReport(await response.json())
    } finally {
      setLoading(false)
    }
  }

  const conflicts = report?.conflicts || report?.snapshot?.conflicts || []
  const programmes = report?.snapshot?.programmes || []

  return (
    <main className="min-h-screen bg-obsidian px-5 py-24 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <span className="eyebrow">Copilot Knowledge</span>
        <h1 className="mt-4 text-4xl font-semibold md:text-5xl">Approved commercial knowledge and conflicts</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-steel">
          This page shows the current approved Nexora programme snapshot and any website/database conflicts that require admin review before the Copilot can use changed commercial facts.
        </p>

        <div className="mt-8 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 md:flex-row">
          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            type="password"
            placeholder="Admin secret"
            className="min-h-12 flex-1 rounded-lg border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-signal"
          />
          <button onClick={() => load(false)} className="button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Load Approved
          </button>
          <button onClick={() => load(true)} className="button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Manual Sync
          </button>
        </div>

        {report?.error ? <p className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{report.error}</p> : null}

        {report?.snapshot ? (
          <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.025] p-5">
            <h2 className="text-2xl font-semibold">Current Approved Version</h2>
            <div className="mt-4 grid gap-3 text-sm text-steel md:grid-cols-3">
              <p>Version: <span className="text-white">{report.snapshot.version}</span></p>
              <p>Approved: <span className="text-white">{report.snapshot.approvedAt}</span></p>
              <p>Approved by: <span className="text-white">{report.snapshot.approvedBy}</span></p>
            </div>
          </section>
        ) : null}

        {report?.website ? (
          <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-5">
            <h2 className="text-2xl font-semibold">Website Version</h2>
            <div className="mt-4 grid gap-3 text-sm text-steel md:grid-cols-4">
              <p>Career Price: <span className="text-white">{report.website.careerPrice ? ngn(report.website.careerPrice) : 'Not found'}</span></p>
              <p>Career Count: <span className="text-white">{report.website.careerProgrammeCount || 'Not found'}</span></p>
              <p>Business Price: <span className="text-white">{report.website.businessPrice ? ngn(report.website.businessPrice) : 'Not found'}</span></p>
              <p>Business Duration: <span className="text-white">{report.website.businessDuration || 'Not found'}</span></p>
            </div>
            {report.website.error ? <p className="mt-4 text-sm text-red-200">{report.website.error}</p> : null}
          </section>
        ) : null}

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-signal" />
            <h2 className="text-2xl font-semibold">KNOWLEDGE_CONFLICT</h2>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-steel">
                <tr>
                  <th className="border-b border-white/10 p-3">Field</th>
                  <th className="border-b border-white/10 p-3">Website Value</th>
                  <th className="border-b border-white/10 p-3">Database Value</th>
                  <th className="border-b border-white/10 p-3">Hard-coded Value</th>
                  <th className="border-b border-white/10 p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.length ? conflicts.map((item) => (
                  <tr key={`${item.field}-${item.lastUpdatedTime}`} className="border-b border-white/10">
                    <td className="p-3 text-white">{item.field}</td>
                    <td className="p-3 text-steel">{item.websiteValue}</td>
                    <td className="p-3 text-steel">{item.databaseValue}</td>
                    <td className="p-3 text-steel">{item.hardCodedValue}</td>
                    <td className="p-3 text-signal">{item.adminApprovalStatus}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="p-3 text-steel" colSpan={5}>No conflicts loaded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          {programmes.map((programme) => (
            <div key={programme.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">{programme.programmeFamily}</p>
              <h3 className="mt-3 text-2xl font-semibold">{programme.name}</h3>
              <p className="mt-2 text-sm text-steel">{programme.duration} - {ngn(programme.currentPrice)}</p>
              {programme.tracks?.length ? (
                <div className="mt-4 grid gap-2">
                  {programme.tracks.map((track) => <p key={track.name} className="text-sm text-frost">{track.name} - {ngn(track.currentPrice)}</p>)}
                </div>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
