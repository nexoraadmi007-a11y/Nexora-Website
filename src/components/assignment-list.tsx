'use client'
import { FormEvent, useState } from 'react'

export function AssignmentList({ assignments }: { assignments: any[] }) {
  const [open, setOpen] = useState<string | null>(null)
  const [message, setMessage] = useState<Record<string, string>>({})
  async function submit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setMessage((value) => ({ ...value, [id]: 'Submitting...' }))
    const response = await fetch(`/api/assignments/${id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionText: form.get('submissionText'), submissionUrl: form.get('submissionUrl') }) })
    const result = await response.json(); setMessage((value) => ({ ...value, [id]: response.ok ? 'Assignment submitted.' : result.error || 'Submission failed.' }))
  }
  return <div className="assignment-list">{assignments.length ? assignments.map((assignment) => <article className="assignment-card" key={assignment.id}><div><span className="status-pill warning">{assignment.status}</span><h3>{assignment.title}</h3><p className="muted">{assignment.classes?.programmes?.name || assignment.classes?.name} · Due {assignment.due_at ? new Date(assignment.due_at).toLocaleString('en-NG') : 'date pending'}</p>{assignment.description ? <p>{assignment.description}</p> : null}</div><button className="btn btn-secondary" onClick={() => setOpen(open === assignment.id ? null : assignment.id)} type="button">{open === assignment.id ? 'Close' : 'View Assignment'}</button>{open === assignment.id ? <form className="form-grid assignment-submit" onSubmit={(event) => submit(event, assignment.id)}><label className="field"><span>Submission link</span><input name="submissionUrl" type="url" placeholder="https://..." /></label><label className="field"><span>Submission note</span><textarea name="submissionText" placeholder="Add your answer or a note for your instructor" /></label>{message[assignment.id] ? <p className="form-message success">{message[assignment.id]}</p> : null}<button className="btn btn-primary" type="submit">Submit Assignment</button></form> : null}</article>) : <div className="empty-state">No assignments have been published yet.</div>}</div>
}
