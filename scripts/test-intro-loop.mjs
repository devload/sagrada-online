import puppeteer from 'puppeteer'
const worst = { width: 375, height: 750, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const b = await puppeteer.launch({ headless: 'new', defaultViewport: worst })
const p = await b.newPage()
await p.setViewport(worst)
await p.goto('https://dh1rtp9d6qdlf.cloudfront.net/?v=introfix', { waitUntil: 'networkidle2' })
await p.evaluate(() => {
  localStorage.setItem('sagrada.onboarded', '1')
  localStorage.setItem('sagrada.gameTutorialSeen', '1')
})
await p.reload({ waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 1500))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('PLAY SOLO'))?.click())
await new Promise(r => setTimeout(r, 500))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Sealed'))?.click())
await new Promise(r => setTimeout(r, 500))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('공용 미션 확인'))?.click())
await new Promise(r => setTimeout(r, 500))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Reveal all'))?.click())
await new Promise(r => setTimeout(r, 400))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('패턴 선택'))?.click())
await new Promise(r => setTimeout(r, 800))
await p.evaluate(() => {
  const cards = [...document.querySelectorAll('button')].filter(b => /Firmitas|Kaleido|Aurorae|Water/.test(b.textContent))
  if (cards[0]) cards[0].click()
})
await new Promise(r => setTimeout(r, 300))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('BEGIN THE WORK'))?.click())

// Take multiple screenshots to see the intro lifecycle
for (let i = 0; i < 5; i++) {
  await new Promise(r => setTimeout(r, 500))
  await p.screenshot({ path: `/tmp/intro-t${i * 500}.png` })
}
// After 2.5s, take final screenshot
await new Promise(r => setTimeout(r, 500))
await p.screenshot({ path: '/tmp/intro-final.png' })

// Check DOM for RoundIntro presence
const state = await p.evaluate(() => {
  const intro = document.querySelector('[class*="z-\\[55\\]"]')
  return {
    introVisible: !!intro,
    introOpacity: intro ? getComputedStyle(intro).opacity : null,
  }
})
console.log('State after 3s:', state)
await b.close()
