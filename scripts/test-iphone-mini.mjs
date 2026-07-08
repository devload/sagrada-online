// Test viewport fit at iPhone 12 mini dimensions with Safari-like URL bar
import puppeteer from 'puppeteer'
import { writeFile } from 'node:fs/promises'

// 375×620 = worst case (Safari URL bar visible + status bar)
const worst = { width: 375, height: 620, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

const b = await puppeteer.launch({ headless: 'new', defaultViewport: worst })
const p = await b.newPage()
await p.setViewport(worst)

await p.goto('https://dh1rtp9d6qdlf.cloudfront.net/?v=safari', { waitUntil: 'networkidle2' })
await p.evaluate(() => localStorage.setItem('sagrada.onboarded', '1'))
await p.reload({ waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 2000))
await p.screenshot({ path: '/tmp/iphone-mini-lobby.png' })

// PLAY SOLO
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('PLAY SOLO'))
  if (b) b.click()
})
await new Promise((r) => setTimeout(r, 800))

// Private reveal — tap the sealed envelope
await p.evaluate(() => {
  const s = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sealed'))
  if (s) s.click()
})
await new Promise((r) => setTimeout(r, 800))
await p.screenshot({ path: '/tmp/iphone-mini-private.png' })

// Next: reveal publics
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('REVEAL PUBLIC'))
  if (b) b.click()
})
await new Promise((r) => setTimeout(r, 1000))
// Reveal all 3
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Reveal all'))
  if (b) b.click()
})
await new Promise((r) => setTimeout(r, 1000))
await p.screenshot({ path: '/tmp/iphone-mini-public.png' })

// Choose pattern
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('CHOOSE PATTERN'))
  if (b) b.click()
})
await new Promise((r) => setTimeout(r, 1000))
await p.evaluate(() => {
  const cards = [...document.querySelectorAll('button')].filter((b) => /Firmitas|Kaleido|Aurorae|Water/.test(b.textContent))
  if (cards[0]) cards[0].click()
})
await new Promise((r) => setTimeout(r, 400))
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('BEGIN THE WORK'))
  if (b) b.click()
})
await new Promise((r) => setTimeout(r, 2000))
await p.screenshot({ path: '/tmp/iphone-mini-game.png' })

// Measurements
const measurements = await p.evaluate(() => {
  const tray = document.querySelector('.rounded-2xl.px-4')
  const rail = document.querySelector('.border-t.border-cathedral-gold\\/15')
  const vh = window.innerHeight
  if (!tray) return { error: 'no tray', vh }
  const tr = tray.getBoundingClientRect()
  const rr = rail?.getBoundingClientRect()
  return {
    viewport: vh,
    tray: { top: Math.round(tr.top), bottom: Math.round(tr.bottom), height: Math.round(tr.height), visible: tr.bottom <= vh },
    rail: rr ? { top: Math.round(rr.top), bottom: Math.round(rr.bottom), visible: rr.bottom <= vh } : null,
  }
})

console.log('MEASUREMENTS:', JSON.stringify(measurements, null, 2))
await writeFile('/tmp/iphone-mini-measurements.json', JSON.stringify(measurements, null, 2))
await b.close()
console.log('\nScreenshots: iphone-mini-{lobby,private,public,game}.png')
