// Simulate Android Chrome + verify PWA install flow
import puppeteer from 'puppeteer'

const ANDROID = { width: 412, height: 800, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }

const browser = await puppeteer.launch({
  headless: 'new',
  defaultViewport: ANDROID,
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
await page.setUserAgent(
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
)
await page.setViewport(ANDROID)

// Ensure we get onboarded flag so lobby shows immediately
await page.goto('https://dh1rtp9d6qdlf.cloudfront.net/?v=android', { waitUntil: 'networkidle2' })
await page.evaluate(() => localStorage.setItem('sagrada.onboarded', '1'))
await page.reload({ waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 2500))

// Check what usePWA sees
const state = await page.evaluate(() => ({
  standalone: window.matchMedia('(display-mode: standalone)').matches,
  iosStandalone: (window.navigator).standalone,
  ua: navigator.userAgent,
  manifestLink: document.querySelector('link[rel="manifest"]')?.href,
  iconLink: document.querySelector('link[rel="apple-touch-icon"]')?.href,
}))
console.log('State:', JSON.stringify(state, null, 2))

// Screenshot lobby (should show install banner)
await page.screenshot({ path: '/tmp/android-lobby.png' })

// Try to open install sheet
const bannerClicked = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('앱으로 설치'))
  if (btn) { btn.click(); return true }
  return false
})
console.log('Banner clicked:', bannerClicked)
await new Promise((r) => setTimeout(r, 900))
await page.screenshot({ path: '/tmp/android-install-sheet.png' })

// Fetch manifest & verify content-type from CDN
const resp = await page.goto('https://dh1rtp9d6qdlf.cloudfront.net/manifest.webmanifest', { waitUntil: 'domcontentloaded' })
console.log('Manifest content-type:', resp.headers()['content-type'])
console.log('Manifest size:', (await resp.text()).length, 'bytes')

await browser.close()
console.log('\nScreenshots saved to /tmp/android-{lobby,install-sheet}.png')
