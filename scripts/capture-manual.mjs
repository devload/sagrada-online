#!/usr/bin/env node
/**
 * Capture screenshots for MANUAL.md by walking the mockup flow,
 * and record precise DOM element positions so the manual can overlay
 * finger/ring/callout annotations at the RIGHT pixel positions.
 */
import puppeteer from 'puppeteer'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'manual', 'screenshots')

const URL = process.argv[2] || 'https://dh1rtp9d6qdlf.cloudfront.net/'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const VIEWPORT = { width: 430, height: 900, deviceScaleFactor: 2 }

async function clickText(page, text) {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.trim().includes(t)
    )
    if (btn) btn.click()
    return !!btn
  }, text)
}

async function seed(page, onboarded) {
  await page.evaluate((v) => {
    if (v) localStorage.setItem('sagrada.onboarded', '1')
    else localStorage.removeItem('sagrada.onboarded')
  }, onboarded)
}

async function shot(page, name) {
  const path = join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path, type: 'png' })
  console.log(`✓ ${name}.png`)
}

/**
 * Get an element's center as % of full viewport (usable in CSS left/top).
 * Uses CSS pixels — matches how screenshot is stored (deviceScaleFactor
 * only affects image resolution, not layout coordinates).
 */
async function rectPct(page, selector, opts = {}) {
  return page.evaluate(({ sel, pickBy, pickIndex }) => {
    let el
    if (pickBy === 'text') {
      el = [...document.querySelectorAll(sel)].find((n) =>
        n.textContent.trim().includes(pickIndex)
      )
    } else if (pickIndex != null) {
      el = document.querySelectorAll(sel)[pickIndex]
    } else {
      el = document.querySelector(sel)
    }
    if (!el) return null
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      leftPct: (r.left / vw) * 100,
      topPct: (r.top / vh) * 100,
      widthPct: (r.width / vw) * 100,
      heightPct: (r.height / vh) * 100,
      centerXPct: ((r.left + r.width / 2) / vw) * 100,
      centerYPct: ((r.top + r.height / 2) / vh) * 100,
    }
  }, { sel: selector, ...opts })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: VIEWPORT,
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-angle=metal',
    ],
  })
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)

  const coords = {}

  // 1) Onboarding card 1
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await seed(page, false)
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
  await wait(3000)
  await shot(page, '01-onboarding-1')

  // 2/3
  await clickText(page, 'CONTINUE')
  await wait(700)
  await shot(page, '02-onboarding-2')
  await clickText(page, 'CONTINUE')
  await wait(700)
  await shot(page, '03-onboarding-3')

  // 4) Lobby menu
  await clickText(page, 'ENTER SANCTUARY')
  await wait(1500)
  await shot(page, '04-lobby-menu')

  // 5/6/7 lobby panels
  await clickText(page, 'PLAY SOLO')
  await wait(700)
  await shot(page, '05-lobby-solo')
  // (There's no separate solo panel now; PLAY SOLO goes straight to waiting.)

  // 6) Create room
  await clickText(page, '←')
  await wait(500)
  await clickText(page, 'CREATE ROOM')
  await wait(700)
  await shot(page, '06-lobby-create')
  await clickText(page, '←')
  await wait(400)

  // 7) Join room
  await clickText(page, 'JOIN ROOM')
  await wait(700)
  await shot(page, '07-lobby-join')
  await clickText(page, '←')
  await wait(400)

  // 7.5) Private reveal (new step in Sagrada flow)
  await clickText(page, 'PLAY SOLO')
  await wait(1000)
  await shot(page, '07b-private-sealed')
  // Reveal the private mission envelope
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((n) =>
      n.textContent.includes('TAP TO REVEAL')
    ) || [...document.querySelectorAll('button')][2]
    if (b) b.click()
  })
  await wait(900)
  await shot(page, '07c-private-revealed')

  // 8) Waiting (solo)
  await clickText(page, 'CHOOSE PATTERN')
  await wait(1000)
  await shot(page, '08-waiting-solo')

  // Select Firmitas pattern (index 2 in the 2x2 grid)
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('button')].filter((b) =>
      /Aurorae|Firmitas|Kaleido|Water/.test(b.textContent)
    )
    if (cards[2]) cards[2].click()
  })
  await wait(500)
  await shot(page, '08b-waiting-pattern-selected')

  // 9) Game scene — before selecting anything
  await clickText(page, 'BEGIN THE WORK')
  await wait(1800) // wait past dice roll animation
  await shot(page, '09-game-scene')

  // Measure die tray dice positions
  coords.step1 = await page.evaluate(() => {
    // Find the tray section, then the die buttons inside
    const tray = document.querySelector('.rounded-2xl.p-4')
    if (!tray) return null
    const diceBtns = [...tray.querySelectorAll('button')].filter(
      (b) => b.offsetWidth > 30 && b.offsetHeight > 30
    )
    if (!diceBtns.length) return null
    // First die (leftmost)
    const first = diceBtns[0]
    const r = first.getBoundingClientRect()
    const vw = window.innerWidth, vh = window.innerHeight
    return {
      diceCount: diceBtns.length,
      first: {
        centerXPct: ((r.left + r.width / 2) / vw) * 100,
        centerYPct: ((r.top + r.height / 2) / vh) * 100,
        widthPct: (r.width / vw) * 100,
        heightPct: (r.height / vh) * 100,
      },
    }
  })

  // 9b) Select first die to reveal legal cells
  await page.evaluate(() => {
    const tray = document.querySelector('.rounded-2xl.p-4')
    if (!tray) return
    const diceBtns = [...tray.querySelectorAll('button')].filter(
      (b) => b.offsetWidth > 30 && b.offsetHeight > 30
    )
    if (diceBtns[0]) diceBtns[0].click()
  })
  await wait(500)
  await shot(page, '09b-die-selected-legal-cells')

  // Measure first legal cell position
  coords.step2 = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('button')].filter(
      (b) =>
        b.className.includes('border-cathedral-candle') &&
        b.offsetWidth < 100 && b.offsetWidth > 30
    )
    if (!cells.length) return null
    const r = cells[0].getBoundingClientRect()
    const vw = window.innerWidth, vh = window.innerHeight
    return {
      legalCount: cells.length,
      first: {
        centerXPct: ((r.left + r.width / 2) / vw) * 100,
        centerYPct: ((r.top + r.height / 2) / vh) * 100,
        widthPct: (r.width / vw) * 100,
        heightPct: (r.height / vh) * 100,
      },
    }
  })

  // 9c) Place die
  await page.evaluate(() => {
    const cells = [...document.querySelectorAll('button')].filter(
      (b) =>
        b.className.includes('border-cathedral-candle') &&
        b.offsetWidth < 100 && b.offsetWidth > 30
    )
    if (cells[0]) cells[0].click()
  })
  await wait(700)
  await shot(page, '09c-die-placed')

  // Step 3 coords = same cell now populated
  coords.step3 = coords.step2

  // 10-12 sheets
  const clickTitle = (t) =>
    page.evaluate((title) => {
      const b = document.querySelector(`button[title="${title}"]`)
      if (b) b.click()
    }, t)
  const closeSheet = async () => {
    await page.evaluate(() => {
      const closes = [...document.querySelectorAll('button[aria-label="Close"]')]
      if (closes.length) closes[0].click()
    })
    await wait(500)
  }

  await clickTitle('Objectives')
  await wait(900)
  await shot(page, '10-objectives-sheet')
  await closeSheet()

  await clickTitle('Tools')
  await wait(900)
  await shot(page, '11-tools-sheet')
  await closeSheet()

  await clickTitle('Rules')
  await wait(900)
  await shot(page, '12-rules-sheet')
  await closeSheet()

  // 13) Scoreboard via dev nav
  await page.evaluate(() => {
    const devToggle = [...document.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === '≡'
    )
    if (devToggle) devToggle.click()
  })
  await wait(300)
  await clickText(page, 'Score')
  await wait(1500)
  await shot(page, '13-scoreboard')

  // Save coords
  await writeFile(join(OUT_DIR, '..', 'coords.json'), JSON.stringify(coords, null, 2))
  console.log('\n📐 coords.json saved:', JSON.stringify(coords, null, 2))

  await browser.close()
  console.log('\n🎉 All screenshots + coords saved.')
}

main().catch((e) => {
  console.error('❌ Failed:', e)
  process.exit(1)
})
