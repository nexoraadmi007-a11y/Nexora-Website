import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = join(process.cwd(), 'out')
const port = Number(process.env.PORT || 8080)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
    let filePath = join(root, cleanPath)

    if (url.pathname === '/' || url.pathname.endsWith('/')) {
      filePath = join(root, cleanPath, 'index.html')
    } else if (!existsSync(filePath) && !extname(filePath)) {
      filePath = `${filePath}.html`
    }

    if (!existsSync(filePath)) {
      filePath = join(root, '404.html')
    }

    const body = await readFile(filePath)
    res.writeHead(filePath.endsWith('404.html') ? 404 : 200, {
      'Content-Type': types[extname(filePath)] || 'application/octet-stream',
    })
    res.end(body)
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Internal server error')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`NEXORA local site: http://127.0.0.1:${port}`)
})
