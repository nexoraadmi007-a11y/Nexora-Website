const siteUrl = process.env.GROWTH_AUTOMATION_URL || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/growth/daily-automation`
const secret = process.env.CRON_SECRET || process.env.TELEGRAM_QUEUE_SECRET || process.env.GROWTH_ADMIN_SECRET

if (!siteUrl || siteUrl === '/api/growth/daily-automation') {
  throw new Error('GROWTH_AUTOMATION_URL or NEXT_PUBLIC_SITE_URL is required.')
}

if (!secret) {
  throw new Error('CRON_SECRET, TELEGRAM_QUEUE_SECRET, or GROWTH_ADMIN_SECRET is required.')
}

const response = await fetch(siteUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nexora-secret': secret,
  },
  body: JSON.stringify({
    importLimit: Number(process.env.GROWTH_AUTOMATION_IMPORT_LIMIT || 10),
    countPerAssociate: Number(process.env.GROWTH_AUTOMATION_ASSIGN_COUNT || 5),
  }),
})

const result = await response.text()
console.log(result)

if (!response.ok) {
  throw new Error(`Growth automation failed with ${response.status}.`)
}
