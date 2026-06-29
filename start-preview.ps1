$ErrorActionPreference = "Stop"

$env:AIRTABLE_TOKEN = [Environment]::GetEnvironmentVariable("AIRTABLE_TOKEN", "User")
$env:AIRTABLE_BASE_ID = "appNkFVWpoI8ihHmA"
$env:TELEGRAM_BOT_TOKEN = [Environment]::GetEnvironmentVariable("TELEGRAM_BOT_TOKEN", "User")
$env:TELEGRAM_WEBHOOK_SECRET = [Environment]::GetEnvironmentVariable("TELEGRAM_WEBHOOK_SECRET", "User")
$env:TELEGRAM_QUEUE_SECRET = [Environment]::GetEnvironmentVariable("TELEGRAM_QUEUE_SECRET", "User")
$env:TELEGRAM_ADMIN_CHAT_ID = [Environment]::GetEnvironmentVariable("TELEGRAM_ADMIN_CHAT_ID", "User")
$env:NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3000"

Set-Location $PSScriptRoot
& "C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" start -H 127.0.0.1 -p 3000
