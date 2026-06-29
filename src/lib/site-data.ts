import { listRecords } from '@/lib/airtable'

export type Program = {
  name: string
  code: string
  family: string
  audience: string
  audienceType: string
  slug: string
  duration: string
  price: number
  description: string
  curriculum: string
  cta: string
  paymentLink: string
}

export type Webinar = {
  title: string
  topic: string
  date: string
  time: string
  speaker: string
  description: string
  learn: string[]
  registrationLink: string
  replayLink: string
  status: string
}

export type Resource = {
  title: string
  category: string
  description: string
  author: string
  publishedDate: string
  ctaText: string
  ctaLink: string
}

export type Testimonial = {
  name: string
  role: string
  organization: string
  testimonial: string
  type: string
}

export type Cohort = {
  name: string
  startDate: string
  endDate: string
  status: string
  capacity: number
  currentEnrollment: number
  paymentLink: string
  applicationLink: string
}

const fallbackPrograms: Program[] = [
  {
    name: 'NEXORA Graduate Training Program',
    code: 'NGTP',
    family: 'Career',
    audience: 'NYSC members, graduates, final-year students, and young professionals.',
    audienceType: 'Career',
    slug: 'career-accelerator',
    duration: '4 weeks',
    price: 25000,
    description: 'A practical AI career pathway for NYSC members, graduates, final-year students, and young professionals.',
    curriculum: 'AI foundations and workplace productivity\nCareer assets and professional communication\nData, reporting, content, and automation workflows\nPortfolio, monetization, and career action planning',
    cta: 'Apply for NGTP',
    paymentLink: '',
  },
  {
    name: 'Business AI Transformation Program',
    code: 'BATP',
    family: 'Business',
    audience: 'Business owners, SMEs, startups, corporate teams, and entrepreneurs.',
    audienceType: 'Business',
    slug: 'business-ai-transformation',
    duration: '4 weeks',
    price: 25000,
    description: 'A practical AI transformation program for business owners and teams who want better marketing, operations, customer follow-up, and productivity.',
    curriculum: 'AI readiness and workflow diagnosis\nMarketing, sales, and customer communication systems\nOperations, reporting, automation, and team productivity\nBusiness transformation roadmap and implementation plan',
    cta: 'Apply for BATP',
    paymentLink: '',
  },
]

function programFromFields(fields: Record<string, any>): Program {
  const code = fields['Programme Code'] || fields['Program Code'] || ''
  const fallback = fallbackPrograms.find((program) => program.code === code) || fallbackPrograms[0]
  return {
    name: fields['Website Program Name'] || fields['Programme Name'] || fallback.name,
    code: code || fallback.code,
    family: fields['Program Family'] || fallback.family,
    audience: fields['Target Audience'] || fallback.audience,
    audienceType: fields['Audience Type'] || fallback.audienceType,
    slug: fields['Landing Page Slug'] || fallback.slug,
    duration: fields['Website Duration'] || fallback.duration,
    price: Number(fields['Website Price'] || fallback.price),
    description: fields['Website Description'] || fields.Description || fallback.description,
    curriculum: fields['Website Curriculum'] || fallback.curriculum,
    cta: fields['CTA Text'] || fields['Default CTA'] || fallback.cta,
    paymentLink: fields['Payment Link'] || fallback.paymentLink,
  }
}

export async function getPrograms(): Promise<Program[]> {
  try {
    const records = await listRecords<Record<string, any>>('Programmes', {
      formula: "AND({Display on Website}=TRUE(),{Website Status}='Active')",
      sortField: 'Display Order',
      direction: 'asc',
      maxRecords: 10,
    })
    const programs = records.map(({ fields }) => programFromFields(fields))
    return programs.length ? programs : fallbackPrograms
  } catch {
    return fallbackPrograms
  }
}

export async function getProgramByCode(code: 'NGTP' | 'BATP'): Promise<Program> {
  const programs = await getPrograms()
  return programs.find((program) => program.code === code) || fallbackPrograms.find((program) => program.code === code) || fallbackPrograms[0]
}

export async function getCareerAccelerator(): Promise<Program> {
  try {
    const records = await listRecords<Record<string, any>>('Programmes', {
      formula: "AND({Display on Website}=TRUE(),{Website Status}='Active',{Programme Code}='NGTP')",
      maxRecords: 1,
    })
    const fields = records[0]?.fields || {}
    return fields['Programme Code'] ? programFromFields(fields) : fallbackPrograms[0]
  } catch {
    return fallbackPrograms[0]
  }
}

export async function getBusinessTransformation(): Promise<Program> {
  return getProgramByCode('BATP')
}

export async function getWebinars() {
  try {
    const records = await listRecords<Record<string, any>>('Intelligence Sessions', {
      formula: '{Display on Website}=TRUE()',
      sortField: 'Date',
      direction: 'asc',
      maxRecords: 6,
    })
    return records.map(({ fields }) => ({
      title: fields['Session Title'] || 'Nexora Weekly AI Webinar',
      topic: fields['Webinar Topic'] || fields['Session Title'] || 'AI at work',
      date: fields.Date || '',
      time: fields['Webinar Time Label'] || '',
      speaker: fields.Speaker || fields.Facilitator || 'Nexora Faculty',
      description: fields.Description || fields.Notes || '',
      learn: String(fields['What You Will Learn'] || '').split('\n').filter(Boolean),
      registrationLink: fields['Registration Link'] || '/webinars',
      replayLink: fields['Replay Link'] || fields['Recording Link'] || '',
      status: fields['Session Status'] || 'Scheduled',
    })) as Webinar[]
  } catch {
    return []
  }
}

export async function getCohorts() {
  try {
    const records = await listRecords<Record<string, any>>('NGTP Cohorts', {
      formula: '{Display on Website}=TRUE()',
      sortField: 'Start Date',
      direction: 'asc',
      maxRecords: 3,
    })
    return records.map(({ fields }) => ({
      name: fields['Cohort Name'] || 'Next Cohort',
      startDate: fields['Start Date'] || '',
      endDate: fields['End Date'] || '',
      status: fields['Cohort Status'] || 'Planned',
      capacity: Number(fields.Capacity || 0),
      currentEnrollment: Number(fields['Current Enrollment'] || fields['Member Count'] || 0),
      paymentLink: fields['Payment Link'] || '',
      applicationLink: fields['Application Link'] || '/career-accelerator',
    })) as Cohort[]
  } catch {
    return []
  }
}

export async function getResources() {
  try {
    const records = await listRecords<Record<string, any>>('Website Resources', {
      formula: "AND({Display on Website}=TRUE(),{Status}='Published')",
      sortField: 'Published Date',
      direction: 'desc',
      maxRecords: 8,
    })
    return records.map(({ fields }) => ({
      title: fields.Title || '',
      category: fields.Category || 'AI at Work',
      description: fields.Description || '',
      author: fields.Author || 'Nexora Institute',
      publishedDate: fields['Published Date'] || '',
      ctaText: fields['CTA Text'] || 'Read more',
      ctaLink: fields['CTA Link'] || '/resources',
    })) as Resource[]
  } catch {
    return []
  }
}

export async function getTestimonials() {
  try {
    const records = await listRecords<Record<string, any>>('Testimonials', {
      formula: 'AND({Display on Website}=TRUE(),{Permission Granted}=TRUE())',
      maxRecords: 6,
    })
    return records.map(({ fields }) => ({
      name: fields.Name || 'Nexora Member',
      role: fields.Role || '',
      organization: fields.Organization || '',
      testimonial: fields.Testimonial || '',
      type: fields.Type || 'Student',
    })) as Testimonial[]
  } catch {
    return []
  }
}
