// Generate PWA icons (192, 512, apple-touch-180) from public/icon.svg
import puppeteer from 'puppeteer'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')

const svg = await readFile(join(PUBLIC, 'icon.svg'), 'utf-8')

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-maskable-512.png', size: 512 },
]

const browser = await puppeteer.launch({ headless: 'new' })
for (const { name, size } of sizes) {
  const page = await browser.newPage()
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 })
  const html = `<!doctype html><html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px;">${svg.replace(
    'viewBox="0 0 512 512"',
    `viewBox="0 0 512 512" width="${size}" height="${size}"`
  )}</div></body></html>`
  await page.setContent(html)
  await page.screenshot({ path: join(PUBLIC, name), omitBackground: true, type: 'png' })
  await page.close()
  console.log(`✓ ${name} (${size}×${size})`)
}
await browser.close()
console.log('\nAll icons generated in public/')
