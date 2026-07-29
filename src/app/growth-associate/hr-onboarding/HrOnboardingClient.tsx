'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, FileUp, Save, ShieldCheck } from 'lucide-react'

type Associate = {
  id: string
  name: string
  email: string
  hrStatus: string
  employmentLetterStatus: string
}

type SignedLetterStatus = {
  letterGenerated: boolean
  employmentLetterStatus: string
  signedLetter: null | {
    id: string
    filename: string
    mimeType: string
    size: number
    uploadedAt: string
    status: string
    statusLabel: string
    reviewNote: string
    canReplace: boolean
  }
  maxBytes: number
  error?: string
}

const states = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

function emptyForm() {
  return {
    legalName: '',
    dateOfBirth: '',
    residentialAddress: '',
    stateOfResidence: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    educationDetails: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    confirmAccountNumber: '',
  }
}

export default function HrOnboardingClient() {
  const [token, setToken] = useState('')
  const [associate, setAssociate] = useState<Associate | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedStatus, setSignedStatus] = useState<SignedLetterStatus | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const value = params.get('token') || ''
    setToken(value)
  }, [])

  const letterUrl = useMemo(() => token ? `/api/hr-onboarding/employment-letter?token=${encodeURIComponent(token)}` : '', [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setMessage('')
      try {
        const response = await fetch(`/api/hr-onboarding/profile?token=${encodeURIComponent(token)}`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load onboarding profile.')
        if (cancelled) return
        setAssociate(result.associate)
        const profile = result.profile || {}
        setForm((current) => ({
          ...current,
          legalName: profile['Legal Name'] || result.associate?.name || '',
          dateOfBirth: profile['Date Of Birth'] || '',
          residentialAddress: profile['Residential Address'] || '',
          stateOfResidence: profile['State Of Residence'] || '',
          emergencyContactName: profile['Emergency Contact Name'] || '',
          emergencyContactPhone: profile['Emergency Contact Phone'] || '',
          educationDetails: profile['Education Details'] || '',
        }))
        await loadSignedStatus(token)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not load onboarding profile.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  async function loadSignedStatus(activeToken = token) {
    if (!activeToken) return
    const response = await fetch(`/api/hr-onboarding/signed-letter?token=${encodeURIComponent(activeToken)}`)
    const result = (await response.json()) as SignedLetterStatus
    if (!response.ok) throw new Error(result.error || 'Could not load employment document status.')
    setSignedStatus(result)
  }

  function update(key: keyof ReturnType<typeof emptyForm>, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(mode: 'save' | 'submit') {
    if (!token) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/hr-onboarding/profile', {
        method: mode === 'submit' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save onboarding details.')
      setMessage(mode === 'submit' ? 'HR onboarding submitted. You can now download your employment letter for signing.' : 'Draft saved.')
      if (associate) setAssociate({ ...associate, hrStatus: mode === 'submit' ? 'Submitted' : 'In Progress' })
      await loadSignedStatus()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save onboarding details.')
    } finally {
      setLoading(false)
    }
  }

  function onFileSelected(file: File | null) {
    setUploadError('')
    if (!file) {
      setSelectedFile(null)
      return
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      setUploadError('Upload a PDF, JPG, JPEG or PNG file.')
      setSelectedFile(null)
      return
    }
    const maxBytes = signedStatus?.maxBytes || 10 * 1024 * 1024
    if (file.size > maxBytes) {
      setUploadError(`File is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB.`)
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
  }

  async function uploadSignedLetter() {
    if (!token || !selectedFile) return
    setUploading(true)
    setUploadError('')
    setMessage('')
    try {
      const formData = new FormData()
      formData.set('token', token)
      formData.set('file', selectedFile)
      const response = await fetch('/api/hr-onboarding/signed-letter', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not upload signed employment letter.')
      setSelectedFile(null)
      setMessage(result.message || 'Signed employment letter submitted.')
      await loadSignedStatus()
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not upload signed employment letter.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#030914] px-4 py-24 text-white md:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] md:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8fb7f3]">Growth Associate HR Onboarding</p>
              <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Complete your employment details</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-steel">
                These details are used for your HR record, payroll setup, and employment letter. Do not share this link.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#7fd3a6]/30 bg-[#7fd3a6]/10 px-4 py-3 text-sm font-bold text-[#b7f0ce]">
              <ShieldCheck className="h-4 w-4" />
              Secure link
            </div>
          </div>

          {message ? <p className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4 text-sm text-frost">{message}</p> : null}

          {!token ? (
            <p className="mt-6 rounded-lg border border-[#ff9b91]/30 bg-[#ff9b91]/10 p-4 text-sm text-[#ffc5bf]">No onboarding token was provided.</p>
          ) : associate ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Info label="Associate" value={associate.name} />
                <Info label="Email" value={associate.email || 'Not provided'} />
                <Info label="HR status" value={associate.hrStatus || 'Link Sent'} />
              </div>

              <div className="mt-8 grid gap-5">
                <h2 className="text-2xl font-semibold">Personal and HR information</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Legal name *" value={form.legalName} onChange={(value) => update('legalName', value)} />
                  <Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => update('dateOfBirth', value)} />
                  <Select label="State of residence *" value={form.stateOfResidence} options={states} onChange={(value) => update('stateOfResidence', value)} />
                  <Field label="Emergency contact name *" value={form.emergencyContactName} onChange={(value) => update('emergencyContactName', value)} />
                  <Field label="Emergency contact phone *" value={form.emergencyContactPhone} onChange={(value) => update('emergencyContactPhone', value)} />
                  <Field label="Education details" value={form.educationDetails} onChange={(value) => update('educationDetails', value)} />
                </div>
                <Textarea label="Residential address *" value={form.residentialAddress} onChange={(value) => update('residentialAddress', value)} />
              </div>

              <div className="mt-8 grid gap-5">
                <h2 className="text-2xl font-semibold">Payroll details</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Bank name *" value={form.bankName} onChange={(value) => update('bankName', value)} />
                  <Field label="Account name *" value={form.accountName} onChange={(value) => update('accountName', value)} />
                  <Field label="Account number *" value={form.accountNumber} onChange={(value) => update('accountNumber', value)} />
                  <Field label="Confirm account number *" value={form.confirmAccountNumber} onChange={(value) => update('confirmAccountNumber', value)} />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => submit('save')} disabled={loading} className="button-secondary inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold disabled:opacity-60">
                  <Save className="h-4 w-4" />
                  Save draft
                </button>
                <button type="button" onClick={() => submit('submit')} disabled={loading} className="button-primary min-h-12 rounded-lg px-5 text-sm font-bold disabled:opacity-60">
                  Submit HR onboarding
                </button>
              </div>

              <section className="mt-8 rounded-lg border border-[#5793ff]/20 bg-[#07111f] p-5 md:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fb7f3]">Employment document</p>
                <h2 className="mt-2 text-2xl font-semibold">Download, sign and upload</h2>
                <p className="mt-2 text-sm leading-6 text-steel">
                  Download the employment letter, sign it, then upload the complete signed copy below. PDF preferred.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <Step label="Step 1" body="Download employment letter" />
                  <Step label="Step 2" body="Print or sign electronically" />
                  <Step label="Step 3" body="Upload signed copy" />
                </div>

                <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="font-semibold text-white">{signedStatus?.signedLetter?.statusLabel || (signedStatus?.letterGenerated ? 'Employment letter ready' : 'Employment letter pending')}</p>
                  <p className="mt-2 text-sm leading-6 text-steel">
                    {signedStatus?.signedLetter?.status === 'SIGNED_COPY_APPROVED'
                      ? 'Your signed employment letter has been approved.'
                      : signedStatus?.signedLetter?.status === 'CORRECTION_REQUIRED'
                        ? 'Please review the admin comment and upload a corrected signed copy.'
                        : signedStatus?.signedLetter
                          ? 'Your signed employment letter is awaiting verification.'
                          : signedStatus?.letterGenerated
                            ? 'Download the letter, sign it and upload the signed copy to continue.'
                            : 'Admin must generate your employment letter before download is enabled.'}
                  </p>
                  {signedStatus?.signedLetter?.reviewNote ? <p className="mt-2 text-sm text-[#ffc5bf]">Admin note: {signedStatus.signedLetter.reviewNote}</p> : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={letterUrl}
                    download
                    className={`button-primary inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold ${signedStatus?.letterGenerated ? '' : 'pointer-events-none opacity-50'}`}
                  >
                    <Download className="h-4 w-4" />
                    Download employment letter
                  </a>
                  <a
                    href={`${letterUrl}&preview=1`}
                    target="_blank"
                    rel="noreferrer"
                    className={`button-secondary inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold ${signedStatus?.letterGenerated ? '' : 'pointer-events-none opacity-50'}`}
                  >
                    Preview letter
                  </a>
                </div>

                <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.025] p-4">
                  <h3 className="text-lg font-semibold">Upload signed employment letter</h3>
                  <p className="mt-2 text-sm leading-6 text-steel">
                    After downloading and signing your employment letter, upload the complete signed copy here. PDF, JPG or PNG. Maximum {Math.round((signedStatus?.maxBytes || 10 * 1024 * 1024) / (1024 * 1024))} MB.
                  </p>
                  <ul className="mt-4 grid gap-2 text-sm text-steel">
                    <li>1. Download the employment letter.</li>
                    <li>2. Print and sign it, or sign it electronically using a PDF signing application.</li>
                    <li>3. Ensure all pages are included.</li>
                    <li>4. Upload the signed document here.</li>
                  </ul>

                  <label
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      onFileSelected(event.dataTransfer.files?.[0] || null)
                    }}
                    className={`mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#5793ff]/45 bg-[#5793ff]/5 px-4 text-center transition hover:bg-[#5793ff]/10 ${signedStatus?.letterGenerated && signedStatus?.signedLetter?.status !== 'SIGNED_COPY_APPROVED' ? '' : 'pointer-events-none opacity-50'}`}
                  >
                    <FileUp className="h-8 w-8 text-[#8fb7f3]" />
                    <span className="mt-3 text-sm font-bold text-white">{selectedFile ? 'Replace selected file' : 'Choose file or drag it here'}</span>
                    <span className="mt-1 text-xs text-steel">PDF, JPG, JPEG or PNG</span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      onChange={(event) => onFileSelected(event.target.files?.[0] || null)}
                      disabled={!signedStatus?.letterGenerated || signedStatus?.signedLetter?.status === 'SIGNED_COPY_APPROVED'}
                    />
                  </label>

                  {selectedFile ? (
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-steel">
                      <p><span className="font-semibold text-white">Selected:</span> {selectedFile.name}</p>
                      <p><span className="font-semibold text-white">Size:</span> {(selectedFile.size / 1024).toFixed(1)} KB</p>
                      <p><span className="font-semibold text-white">Type:</span> {selectedFile.type}</p>
                      <button type="button" onClick={() => onFileSelected(null)} className="mt-3 text-[#9ec2f7]">Replace file</button>
                    </div>
                  ) : null}

                  {signedStatus?.signedLetter ? (
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-steel">
                      <p><span className="font-semibold text-white">Submitted document:</span> {signedStatus.signedLetter.filename}</p>
                      <p><span className="font-semibold text-white">Status:</span> {signedStatus.signedLetter.statusLabel}</p>
                    </div>
                  ) : null}

                  {uploadError ? <p className="mt-4 rounded-lg border border-[#ff9b91]/30 bg-[#ff9b91]/10 p-3 text-sm text-[#ffc5bf]">{uploadError}</p> : null}
                  <button
                    type="button"
                    onClick={uploadSignedLetter}
                    disabled={!selectedFile || uploading || !signedStatus?.letterGenerated || signedStatus?.signedLetter?.status === 'SIGNED_COPY_APPROVED'}
                    className="button-primary mt-5 min-h-12 rounded-lg px-5 text-sm font-bold disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : signedStatus?.signedLetter?.canReplace ? 'Submit replacement signed letter' : 'Submit signed employment letter'}
                  </button>
                </div>
              </section>
            </>
          ) : loading ? (
            <p className="mt-6 text-sm text-steel">Loading onboarding profile...</p>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-steel">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function Step({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8fb7f3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{body}</p>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-steel">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 rounded-lg border border-white/10 bg-[#07111f] px-4 text-white outline-none transition focus:border-[#5793ff]" />
    </label>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-steel">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 rounded-lg border border-white/10 bg-[#07111f] px-4 text-white outline-none transition focus:border-[#5793ff]">
        <option value="">Select option</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-steel">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-white outline-none transition focus:border-[#5793ff]" />
    </label>
  )
}
