export type ProgrammeGroupResolution = {
  status: 'AVAILABLE' | 'MISSING'
  groupName: string
  groupUrl: string
  groupType: 'CLASS_GROUP' | 'BUSINESS_PROGRAMME_GROUP' | 'GENERAL_COMMUNITY'
}

function env(name: string) {
  return (process.env[name] || '').trim()
}

function byTrack(trackSlug: string) {
  const normalized = trackSlug.toLowerCase().trim()
  if (normalized === 'ai-content-creation') {
    return {
      groupName: 'AI Content Creation Class Group',
      groupUrl: env('CAREER_GROUP_AI_CONTENT_CREATION_URL'),
      groupType: 'CLASS_GROUP' as const,
    }
  }
  if (normalized === 'ui-ux-designer') {
    return {
      groupName: 'Certified UI/UX Designer Class Group',
      groupUrl: env('CAREER_GROUP_UI_UX_DESIGNER_URL'),
      groupType: 'CLASS_GROUP' as const,
    }
  }
  if (normalized === 'ai-financial-analyst') {
    return {
      groupName: 'AI Financial Analyst Class Group',
      groupUrl: env('CAREER_GROUP_AI_FINANCIAL_ANALYST_URL'),
      groupType: 'CLASS_GROUP' as const,
    }
  }
  return null
}

export function resolveProgrammeGroup(input: {
  programCode: string
  selectedTrackSlugs?: string[]
}): ProgrammeGroupResolution {
  const code = input.programCode.toUpperCase()
  if (code === 'BATP') {
    const groupUrl = env('BATP_GROUP_URL')
    return {
      status: groupUrl ? 'AVAILABLE' : 'MISSING',
      groupName: 'AI Business Transformation Programme Group',
      groupUrl,
      groupType: 'BUSINESS_PROGRAMME_GROUP',
    }
  }

  const exactTrack = input.selectedTrackSlugs?.map(byTrack).find(Boolean)
  if (exactTrack) {
    return {
      status: exactTrack.groupUrl ? 'AVAILABLE' : 'MISSING',
      ...exactTrack,
    }
  }

  const groupUrl = env('CAREER_GROUP_GENERAL_URL') || env('NEXORA_GENERAL_COMMUNITY_URL')
  return {
    status: groupUrl ? 'AVAILABLE' : 'MISSING',
    groupName: 'NEXORA Career Accelerator Class Group',
    groupUrl,
    groupType: 'CLASS_GROUP',
  }
}
