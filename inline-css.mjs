import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const outDir = join(process.cwd(), 'out')
const cssDir = join(outDir, '_next', 'static', 'css')
const cssFiles = (await readdir(cssDir)).filter((file) => file.endsWith('.css'))

if (cssFiles.length === 0) {
  throw new Error('No exported CSS file found.')
}

const css = await Promise.all(cssFiles.map((file) => readFile(join(cssDir, file), 'utf8')))
const styleTag = `<style data-nexora-inline-css>${css.join('\n')}</style>`
const htmlFiles = (await readdir(outDir)).filter((file) => file.endsWith('.html'))

for (const file of htmlFiles) {
  const path = join(outDir, file)
  let html = await readFile(path, 'utf8')
  html = html.replace(/<link rel="stylesheet" href="[^"]+" data-precedence="next"\/?>/g, styleTag)
  html = html.replace(/:HL\["\.?\/?_next\/static\/css\/[^"]+","style"\]/g, '')
  await writeFile(path, html)
}

console.log(`Inlined ${cssFiles.length} CSS file(s) into ${htmlFiles.length} HTML file(s).`)
