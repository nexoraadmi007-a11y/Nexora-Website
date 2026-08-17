import fs from 'node:fs'

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const adminLogin = read('src/app/admin/login/page.tsx')
const adminBootstrap = read('src/app/api/admin/bootstrap/route.ts')
const adminServices = read('src/lib/admin-services.ts')
const loginRoute = read('src/app/api/admin/auth/login/route.ts')
const logoutRoute = read('src/app/api/admin/auth/logout/route.ts')
const session = read('src/lib/admin-session.ts')
const middleware = read('src/middleware.ts')
const shell = read('src/components/shell.tsx')
const userLogin = read('src/app/login/page.tsx')
const env = read('.env.example')

assert(adminLogin.includes("fetch('/api/admin/auth/login'"), 'Admin login must use its dedicated server endpoint.')
assert(!adminLogin.includes('createSupabaseBrowserClient') && !adminLogin.includes('signInWithPassword'), 'Admin credentials must not be validated in the browser.')
assert(adminLogin.includes('href="/admin/setup"') && adminLogin.includes('Set or reset admin password'), 'Admin login must expose the secure password reset path.')
assert(!/from\('admin_roles'\)\.upsert\(\{[\s\S]*?updated_at[\s\S]*?\}, \{ onConflict: 'user_id,role' \}\)/.test(adminBootstrap), 'Admin bootstrap must only write columns present in admin_roles.')
assert(adminServices.includes('reportQueryError') && !adminServices.includes('list failed: ${error.message}'), 'Read-only admin data errors must not crash protected pages.')
assert(loginRoute.includes(".from('admin_roles')") && loginRoute.includes(".eq('status', 'ACTIVE')"), 'Admin login must verify an active server-side role.')
assert(loginRoute.includes('createAdminSessionToken') && loginRoute.includes('ADMIN_SESSION_COOKIE'), 'Admin login must create the dedicated admin session.')
assert(session.includes("'nexora_admin_session'") && session.includes("httpOnly: true") && session.includes("sameSite: 'strict'"), 'Admin cookie security attributes are missing.')
assert(session.includes("crypto.subtle.sign('HMAC'") && session.includes("crypto.subtle.verify('HMAC'"), 'Admin session must be signed and verified.')
assert(logoutRoute.includes("ADMIN_SESSION_COOKIE, ''") && logoutRoute.includes('adminSessionCookieOptions(0)'), 'Admin logout must invalidate its cookie.')
assert(middleware.includes('verifyAdminSessionToken') && middleware.includes("'/admin/login'"), 'Admin middleware guard is missing.')
assert(shell.includes('<ButtonLink href="/signup">Get Started</ButtonLink>'), 'Get Started must route to the user signup journey.')
assert(userLogin.includes("router.push('/app')"), 'User login must route only to the user workspace.')
assert(!userLogin.includes('/admin'), 'User login must not route to admin.')
assert(env.includes('ADMIN_SESSION_SECRET=') && !env.includes('NEXT_PUBLIC_ADMIN'), 'Admin session secret must be server-only.')
assert(shell.includes("'/api/admin/auth/logout'") && shell.includes("'/api/auth/logout'"), 'Admin and user logout endpoints must remain separate.')

console.log('admin authentication separation checks passed')
