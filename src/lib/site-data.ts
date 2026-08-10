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
    name: 'AI Income Accelerator',
    code: 'NGTP',
    family: 'Career',
    audience: 'NYSC members, 500-level students, graduates, and young professionals.',
    audienceType: 'Career',
    slug: 'career-accelerator',
    duration: '4 specialisations',
    price: 10000,
    description: 'A flagship skills-to-income accelerator with four specialisations: AI content and digital marketing, AI UI/UX and design, AI financial and business analysis, and AI automation/no-code solutions.',
    curriculum: 'AI Content & Digital Marketing\nAI UI/UX & Digital Design\nAI Financial & Business Analysis\nAI Automation & No-Code Solutions\nFrom Skill to Income',
    cta: 'Apply for AI Income Accelerator',
    paymentLink: '',
  },
  {
    name: 'AI Business Transformation Program',
    code: 'BATP',
    family: 'Business',
    audience: 'Small business owners, entrepreneurs, SMEs, startups, freelancers, agencies, service providers, retail businesses, and professional firms.',
    audienceType: 'Business',
    slug: 'business-transformation',
    duration: '4 weeks',
    price: 35000,
    description: 'A practical 30-day business transformation program that helps business owners build branding, a website, customer database, marketing engine, sales process, automation, dashboards, and a 90-day growth plan.',
    curriculum: 'Brand identity kit\nLive business website\nMarketing engine\nSales system\nAI business operating system',
    cta: 'Apply for Business Transformation',
    paymentLink: '',
  },
]

function programFromFields(fields: Record<string, any>): Program {
  const code = fields['Programme Code'] || fields['Program Code'] || ''
  const fallback = fallbackPrograms.find((program) => program.code === code) || fallbackPrograms[0]
  const rawPrice = Number(fields['Website Price'] || fallback.price)
  const price = rawPrice || fallback.price
  const publicName = code === 'NGTP'
    ? 'AI Income Accelerator'
    : code === 'BATP'
      ? 'AI Business Transformation Program'
      : code === 'COMPLETE'
        ? 'Complete AI Accelerator'
        : fields['Website Program Name'] || fields['Programme Name'] || fallback.name
  const publicDescription = code === 'NGTP'
    ? fallbackPrograms[0].description
    : code === 'BATP'
      ? fallbackPrograms[1].description
      : fields['Website Description'] || fields.Description || fallback.description
  return {
    name: publicName,
    code: code || fallback.code,
    family: fields['Program Family'] || fallback.family,
    audience: fields['Target Audience'] || fallback.audience,
    audienceType: fields['Audience Type'] || fallback.audienceType,
    slug: fields['Landing Page Slug'] || fallback.slug,
    duration: fields['Website Duration'] || fallback.duration,
    price,
    description: publicDescription,
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
    const programs = records.map(({ fields }) => programFromFields(fields)).filter((program) => program.code !== 'COMPLETE')
    return programs.length ? programs : fallbackPrograms
  } catch {
    return fallbackPrograms
  }
}

export async function getProgramByCode(code: 'NGTP' | 'BATP' | 'COMPLETE'): Promise<Program> {
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

export async function getCompleteAccelerator(): Promise<Program> {
  return getProgramByCode('COMPLETE')
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
