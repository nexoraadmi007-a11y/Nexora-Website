import { createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AirtableRecord, createRecord, escapeFormula, listRecords, updateRecord } from './airtable'
import { sendEmail } from './email'
import { compact, text } from './growth-associate'

export type Fields = Record<string, any>

export const hrConfig = {
  companyName: 'NEXORA INSTITUTE',
  registrationNumber: 'iRC9613919',
  website: 'https://www.nexoragroup.ink',
  email: 'admin@nexoragroup.ink',
  phone: '0701002613 | 08103200200',
  address: 'Thebunker Office Building, Beside Access Bank, Oke Ilewo, Along Jide Jones, Abeokuta, Ogun State.',
  signatoryName: 'Zephaniah Morakinyo',
  signatoryTitle: 'CEO',
  roleTitle: 'Growth Associate',
  employmentType: 'Full-time',
  salary: 75000,
  salaryBasis: 'Gross monthly salary',
  salaryPaymentDate: '31st day of every month',
  workingHours: '8 working hours',
  monthlyTarget: 30,
  probationPeriod: 'No probation period',
  noticePeriod: 'No notice period',
  leaveTerms: 'No leave terms currently attached to this engagement',
  statutoryDeductions: 'No statutory deduction/tax treatment configured',
  witnessRequired: false,
  templateVersion: 'NEX-HR-EMP-001',
}

export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function makeHrToken() {
  return randomBytes(32).toString('base64url')
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export async function findAssociateById(id: string) {
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `RECORD_ID()='${escapeFormula(id)}'`,
    maxRecords: 1,
  })
  return records[0] || null
}

export async function findAssociateByToken(token: string) {
  const hash = tokenHash(token)
  const records = await listRecords<Fields>('Ambassadors', {
    formula: `AND({HR Onboarding Token Hash}='${escapeFormula(hash)}',NOT({HR Onboarding Link Revoked}))`,
    maxRecords: 1,
  })
  const associate = records[0] || null
  if (!associate) return null
  const expiry = text(associate.fields['HR Onboarding Token Expires At'], 80)
  if (expiry && new Date(expiry).getTime() < Date.now()) return null
  return associate
}

export function associateName(fields: Fields) {
  return text(fields['Ambassador Name'] || fields['Full Name'], 180) || 'Growth Associate'
}

export function associateEmail(fields: Fields) {
  return text(fields.Email, 254).toLowerCase()
}

export async function createHrOnboardingLink(associate: AirtableRecord<Fields>) {
  const token = makeHrToken()
  const expiresAt = addDays(new Date(), 7).toISOString()
  await updateRecord('Ambassadors', associate.id, compact({
    'HR Onboarding Status': 'Link Sent',
    'HR Onboarding Token Hash': tokenHash(token),
    'HR Onboarding Token Expires At': expiresAt,
    'HR Onboarding Link Revoked': false,
    'Employment Letter Status': associate.fields['Employment Letter Status'] || 'Not Generated',
    'Updated At': new Date().toISOString(),
  }))
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexoragroup.ink'
  return {
    token,
    expiresAt,
    url: `${baseUrl}/growth-associate/hr-onboarding?token=${encodeURIComponent(token)}`,
  }
}

export async function sendHrOnboardingEmail(associate: AirtableRecord<Fields>, url: string) {
  const email = associateEmail(associate.fields)
  if (!email) return 'No associate email on record.'
  const name = associateName(associate.fields)
  const result = await sendEmail({
    to: email,
    subject: 'NEXORA Growth Associate HR Onboarding',
    text: `Hello ${name},\n\nCongratulations again on joining NEXORA Institute as a Growth Associate.\n\nPlease complete your HR onboarding using this secure link:\n${url}\n\nThis link expires in 7 days. Do not share it with anyone.\n\nNEXORA Institute HR`,
  })
  if (result.skipped) return result.reason || 'Email provider is not configured.'
  return `HR onboarding email sent to ${email}${result.id ? ` (Resend ID: ${result.id})` : ''}.`
}

export async function upsertHrProfile(associate: AirtableRecord<Fields>, data: Fields, submitted = false) {
  const existing = await listRecords<Fields>('Associate HR Profiles', {
    formula: `FIND('${escapeFormula(associate.id)}',ARRAYJOIN({Associate}))`,
    maxRecords: 1,
  }).catch(() => [])
  const now = new Date().toISOString()
  const fields = compact({
    Associate: [associate.id],
    'Legal Name': text(data.legalName || data.fullName, 180),
    'Date Of Birth': text(data.dateOfBirth, 40),
    'Residential Address': text(data.residentialAddress, 500),
    'State Of Residence': text(data.stateOfResidence, 120),
    'Emergency Contact Name': text(data.emergencyContactName, 160),
    'Emergency Contact Phone': text(data.emergencyContactPhone, 80),
    'Education Details': text(data.educationDetails, 500),
    'HR Form Status': submitted ? 'Submitted' : 'Draft',
    'Submitted At': submitted ? now : '',
    'Updated At': now,
  })

  if (existing[0]) {
    await updateRecord('Associate HR Profiles', existing[0].id, fields)
    return existing[0].id
  }
  const created = await createRecord<{ id: string; fields: Fields }>('Associate HR Profiles', {
    'HR Profile ID': `HRP-${Date.now()}`,
    ...fields,
    'Created At': now,
  })
  return created.id
}

export async function upsertPayrollDetails(associate: AirtableRecord<Fields>, data: Fields) {
  const accountNumber = text(data.accountNumber, 20).replace(/\D/g, '')
  const existing = await listRecords<Fields>('Payroll Details', {
    formula: `FIND('${escapeFormula(associate.id)}',ARRAYJOIN({Associate}))`,
    maxRecords: 1,
  }).catch(() => [])
  const fields = compact({
    Associate: [associate.id],
    'Bank Name': text(data.bankName, 160),
    'Account Name': text(data.accountName, 180),
    'Account Number': accountNumber,
    'Account Number Last Four': accountNumber.slice(-4),
    'Verification Status': 'Pending Review',
    'Updated At': new Date().toISOString(),
  })
  if (existing[0]) {
    await updateRecord('Payroll Details', existing[0].id, fields)
    return existing[0].id
  }
  const created = await createRecord<{ id: string; fields: Fields }>('Payroll Details', {
    'Payroll ID': `PAY-${Date.now()}`,
    ...fields,
    'Created At': new Date().toISOString(),
  })
  return created.id
}

export async function markHrSubmitted(associate: AirtableRecord<Fields>) {
  await updateRecord('Ambassadors', associate.id, {
    'HR Onboarding Status': 'Submitted',
    'Updated At': new Date().toISOString(),
  })
}

export function imageDataUri(path: string, fallbackMime = 'image/png') {
  const data = readFileSync(path)
  const extension = path.toLowerCase().split('.').pop()
  const mime = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : fallbackMime
  return `data:${mime};base64,${data.toString('base64')}`
}

export function logoDataUri() {
  return imageDataUri(join(process.cwd(), 'public', 'nexora-logo.png'))
}

export function signatureDataUri() {
  if (process.env.NEXORA_SIGNATURE_DATA_URI) return process.env.NEXORA_SIGNATURE_DATA_URI
  const configured = process.env.NEXORA_SIGNATURE_PATH
  return imageDataUri(configured || join(process.cwd(), 'private', 'hr-assets', 'zephaniah-signature.jpeg'), 'image/jpeg')
}

function money(amount: number) {
  return `NGN ${amount.toLocaleString('en-NG')}`
}

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function getLatestHrProfile(associateId: string) {
  const records = await listRecords<Fields>('Associate HR Profiles', {
    formula: `FIND('${escapeFormula(associateId)}',ARRAYJOIN({Associate}))`,
    maxRecords: 1,
    sortField: 'Updated At',
    direction: 'desc',
  }).catch(() => [])
  return records[0] || null
}

export function employmentLetterHtml(input: {
  associate: AirtableRecord<Fields>
  profile?: AirtableRecord<Fields> | null
  startDate?: string
  workMode?: string
}) {
  const fields = input.associate.fields
  const profile = input.profile?.fields || {}
  const name = text(profile['Legal Name'] || fields['Ambassador Name'] || fields['Full Name'], 180) || 'Growth Associate'
  const startDate = formatDate(input.startDate || text(fields['Employment Start Date'], 40) || new Date().toISOString().slice(0, 10))
  const workMode = text(input.workMode || fields['Work Mode'], 80) || 'Hybrid'
  const issueDate = formatDate(new Date().toISOString().slice(0, 10))
  const logo = logoDataUri()
  const signature = signatureDataUri()

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NEXORA Employment Letter - ${escapeHtml(name)}</title>
  <style>
    @page { size: A4; margin: 24mm 20mm; }
    body { margin: 0; background: #f4f7fb; color: #102033; font-family: Arial, Helvetica, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; box-sizing: border-box; padding: 22mm 20mm; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #18304f; padding-bottom: 18px; }
    .logo { width: 170px; height: auto; }
    .meta { text-align: right; font-size: 11px; line-height: 1.55; color: #4d6078; }
    h1 { color: #102033; font-size: 22px; margin: 34px 0 8px; letter-spacing: 0; }
    p, li { font-size: 13px; line-height: 1.72; color: #24364d; }
    .subject { margin: 24px 0; font-weight: 700; color: #102033; text-transform: uppercase; }
    .terms { border-collapse: collapse; width: 100%; margin: 22px 0; font-size: 12px; }
    .terms th, .terms td { border: 1px solid #d6deea; padding: 10px 12px; vertical-align: top; }
    .terms th { width: 34%; background: #eef4fb; color: #18304f; text-align: left; }
    .section-title { margin-top: 24px; font-size: 14px; font-weight: 700; color: #18304f; }
    .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 42px; align-items: end; }
    .signature { height: 96px; object-fit: contain; object-position: left center; transform: rotate(90deg); transform-origin: left center; margin-left: 42px; }
    .line { border-top: 1px solid #26384f; padding-top: 8px; font-size: 12px; color: #24364d; }
    .acceptance { margin-top: 28px; border: 1px solid #d6deea; padding: 16px; }
    .footer { margin-top: 34px; border-top: 1px solid #d6deea; padding-top: 12px; font-size: 10px; color: #6a7c92; }
    @media print { body { background: white; } .page { margin: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <img class="logo" src="${logo}" alt="NEXORA" />
      <div class="meta">
        <strong>${escapeHtml(hrConfig.companyName)}</strong><br />
        RC: ${escapeHtml(hrConfig.registrationNumber)}<br />
        ${escapeHtml(hrConfig.email)}<br />
        ${escapeHtml(hrConfig.phone)}<br />
        ${escapeHtml(hrConfig.website)}
      </div>
    </div>

    <h1>Employment Letter</h1>
    <p>${issueDate}</p>
    <p>Dear ${escapeHtml(name)},</p>
    <p class="subject">Appointment as ${escapeHtml(hrConfig.roleTitle)}</p>
    <p>
      We are pleased to confirm your appointment with ${escapeHtml(hrConfig.companyName)} as a
      ${escapeHtml(hrConfig.roleTitle)}. This letter sets out the core terms of your engagement and the
      expectations attached to the role.
    </p>

    <table class="terms">
      <tr><th>Employment type</th><td>${escapeHtml(hrConfig.employmentType)}</td></tr>
      <tr><th>Start date</th><td>${escapeHtml(startDate)}</td></tr>
      <tr><th>Work mode</th><td>${escapeHtml(workMode)}</td></tr>
      <tr><th>Working hours</th><td>${escapeHtml(hrConfig.workingHours)}</td></tr>
      <tr><th>Salary</th><td>${escapeHtml(hrConfig.salaryBasis)} of ${money(hrConfig.salary)}</td></tr>
      <tr><th>Payment date</th><td>${escapeHtml(hrConfig.salaryPaymentDate)}</td></tr>
      <tr><th>Monthly target</th><td>${hrConfig.monthlyTarget} confirmed paid intakes per month</td></tr>
      <tr><th>Probation</th><td>${escapeHtml(hrConfig.probationPeriod)}</td></tr>
      <tr><th>Notice period</th><td>${escapeHtml(hrConfig.noticePeriod)}</td></tr>
      <tr><th>Leave terms</th><td>${escapeHtml(hrConfig.leaveTerms)}</td></tr>
      <tr><th>Statutory deductions/tax</th><td>${escapeHtml(hrConfig.statutoryDeductions)}</td></tr>
    </table>

    <p class="section-title">Role expectations</p>
    <ul>
      <li>Represent NEXORA professionally in all outreach, referral and candidate-facing communication.</li>
      <li>Generate qualified programme interest, follow up with prospects, and support confirmed paid intake.</li>
      <li>Use approved NEXORA messaging, referral links, reporting channels and operational guidelines.</li>
      <li>Submit honest activity updates and protect candidate/customer information.</li>
    </ul>

    <p>
      Your monthly target is ${hrConfig.monthlyTarget} confirmed paid intakes. Performance, incentives and continued
      engagement may be reviewed based on confirmed results, conduct, reporting quality and compliance with NEXORA operating standards.
    </p>

    <p>
      By accepting this appointment, you agree to handle NEXORA information, candidates, leads, documents and internal
      resources responsibly and confidentially.
    </p>

    <div class="signature-row">
      <div>
        <img class="signature" src="${signature}" alt="Employer signature" />
        <div class="line">
          ${escapeHtml(hrConfig.signatoryName)}<br />
          ${escapeHtml(hrConfig.signatoryTitle)}, ${escapeHtml(hrConfig.companyName)}
        </div>
      </div>
      <div class="line">
        Employee signature and date<br />
        ${escapeHtml(name)}
      </div>
    </div>

    <div class="acceptance">
      <p><strong>Acceptance:</strong> I, ${escapeHtml(name)}, accept this appointment and agree to the terms stated in this letter.</p>
      <p>Signature: ______________________________ Date: ______________________________</p>
    </div>

    <div class="footer">
      ${escapeHtml(hrConfig.address)}<br />
      Template: ${escapeHtml(hrConfig.templateVersion)}
    </div>
  </div>
</body>
</html>`
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
