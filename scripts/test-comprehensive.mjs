// Comprehensive test across multiple emulated devices
import puppeteer from 'puppeteer'

const DEVICES = [
  { name: 'iPhone-12-mini', width: 375, height: 812, dpr: 3, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  { name: 'Pixel-7', width: 412, height: 800, dpr: 2.6, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36' },
  { name: 'Galaxy-S22', width: 384, height: 854, dpr: 3, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 14; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36' },
]

const URL = 'https://dh1rtp9d6qdlf.cloudfront.net'

async function testDevice(dev) {
  console.log(`\n═══ ${dev.name} (${dev.width}×${dev.height} @${dev.dpr}x) ═══`)
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport({ width: dev.width, height: dev.height, deviceScaleFactor: dev.dpr, isMobile: dev.mobile, hasTouch: true })
  await page.setUserAgent(dev.ua)

  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text())
  })

  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const clickText = async (text) => {
    return page.evaluate((t) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(t))
      if (b) { b.click(); return true }
      return false
    }, text)
  }

  await page.goto(URL + '/?v=test-' + Date.now(), { waitUntil: 'networkidle2' })
  await page.evaluate(() => {
    localStorage.setItem('sagrada.onboarded', '1')
    localStorage.setItem('sagrada.gameTutorialSeen', '1')
  })
  await page.reload({ waitUntil: 'networkidle2' })
  await wait(1500)

  const checks = []

  // 1. Lobby loaded
  const lobbyHasSagrada = await page.evaluate(() =>
    !!document.body.innerText.includes('SAGRADA')
  )
  checks.push(['Lobby loaded', lobbyHasSagrada])

  // 2. PWA install banner check
  const hasInstallBanner = await page.evaluate(() =>
    !!document.body.innerText.match(/앱으로 설치/)
  )
  checks.push(['PWA install banner shown', hasInstallBanner])

  // 3. Stats button exists
  const hasStats = await page.evaluate(() =>
    !!document.body.innerText.match(/📊 Stats/)
  )
  checks.push(['Stats button visible', hasStats])

  // 4. Play Solo → Private Reveal
  await clickText('PLAY SOLO')
  await wait(700)
  const isPrivateReveal = await page.evaluate(() =>
    document.body.innerText.includes('개인 미션') || document.body.innerText.includes('YOUR SECRET GOAL')
  )
  checks.push(['Private reveal scene', isPrivateReveal])

  // 5. Reveal envelope → shows private card
  await clickText('Sealed')
  await wait(700)
  const revealedPrivate = await page.evaluate(() =>
    document.body.innerText.includes('PRIVATE OBJECTIVE') || document.body.innerText.match(/(RUBY|SAPPHIRE|EMERALD|AMBER|AMETHYST)/)
  )
  checks.push(['Private card revealed', revealedPrivate])

  // 6. Next: Public Reveal
  await clickText('공용 미션 확인')
  await wait(700)
  const isPublicReveal = await page.evaluate(() =>
    document.body.innerText.includes('SHARED GOALS') || document.body.innerText.includes('공용 미션')
  )
  checks.push(['Public reveal scene', isPublicReveal])

  await clickText('Reveal all')
  await wait(700)

  // 7. Pattern select
  await clickText('패턴 선택')
  await wait(900)
  const isPatternSelect = await page.evaluate(() =>
    document.body.innerText.includes('CHOOSE YOUR WINDOW') || document.body.innerText.includes('YOUR MISSIONS')
  )
  checks.push(['Pattern selection', isPatternSelect])

  // 8. Missions visible in pattern select
  const missionsInPattern = await page.evaluate(() =>
    document.querySelectorAll('button[title]').length > 0
  )
  checks.push(['Missions in pattern-select', missionsInPattern])

  // Pick a pattern
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('button')].filter((b) => /Firmitas|Kaleido|Aurorae|Water/.test(b.textContent))
    if (cards[0]) cards[0].click()
  })
  await wait(400)
  await clickText('BEGIN THE WORK')
  await wait(2500) // wait past round intro

  // 9. Game scene
  const inGame = await page.evaluate(() =>
    document.body.innerText.includes('ROUND') && document.body.innerText.includes('DRAFT POOL')
  )
  checks.push(['Game scene loaded', inGame])

  // 10. Mission strip present
  const missionStripPresent = await page.evaluate(() =>
    document.querySelectorAll('button[title]').length >= 4
  )
  checks.push(['Mission strip (4 icons)', missionStripPresent])

  // 11. Tools rail present (3 icons)
  const toolsRailPresent = await page.evaluate(() => {
    const rail = [...document.querySelectorAll('div')].find((d) => d.className.includes('rounded-2xl bg-cathedral-void/50'))
    if (!rail) return false
    return rail.querySelectorAll('button').length >= 3
  })
  checks.push(['Tools rail (3 icons)', toolsRailPresent])

  // 12. Audio button
  const audioBtn = await page.evaluate(() =>
    !!document.querySelector('button[aria-label*="udio"]')
  )
  checks.push(['Audio button in HUD', audioBtn])

  // 13. Screenshot for visual review
  await page.screenshot({ path: `/tmp/${dev.name}-game.png`, fullPage: false })

  // Results
  const passed = checks.filter(([, ok]) => ok).length
  const total = checks.length
  console.log(`  Result: ${passed}/${total} checks passed`)
  checks.forEach(([label, ok]) => console.log(`   ${ok ? '✓' : '✗'} ${label}`))

  if (errors.length > 0) {
    console.log(`  ⚠️  Runtime errors:`)
    errors.slice(0, 5).forEach((e) => console.log(`   • ${e}`))
  }

  await browser.close()
  return { device: dev.name, passed, total, errors: errors.length }
}

const results = []
for (const dev of DEVICES) {
  results.push(await testDevice(dev))
}

console.log('\n═══ SUMMARY ═══')
console.log('Device'.padEnd(20), 'Passed', ' Errors')
for (const r of results) {
  console.log(r.device.padEnd(20), `${r.passed}/${r.total}`.padEnd(6), '  ' + r.errors)
}

const totalPassed = results.reduce((s, r) => s + r.passed, 0)
const totalTests = results.reduce((s, r) => s + r.total, 0)
const totalErrors = results.reduce((s, r) => s + r.errors, 0)
console.log(`\nOverall: ${totalPassed}/${totalTests} · Errors: ${totalErrors}`)
