const PRODUCTION_SITE_URL = 'https://www.nexoragroup.ink'

export function publicSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim().replace(/\/$/, '')
  if (configured && (process.env.NODE_ENV !== 'production' || !/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configured))) return configured
  return PRODUCTION_SITE_URL
}

export function getGrowthAssociatePortalUrl(partnerId: string) {
  return `${publicSiteUrl()}/associate/${encodeURIComponent(partnerId)}`
}

export function getGrowthAssociateReferralUrl(code: string) {
  return `${publicSiteUrl()}/signup?ref=${encodeURIComponent(code)}`
}
