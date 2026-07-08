import puppeteer from 'puppeteer'
const worst = { width: 375, height: 620, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const b = await puppeteer.launch({ headless: 'new', defaultViewport: worst })
const p = await b.newPage()
await p.setViewport(worst)
await p.goto('https://dh1rtp9d6qdlf.cloudfront.net/?v=waiting', { waitUntil: 'networkidle2' })
await p.evaluate(() => localStorage.setItem('sagrada.onboarded', '1'))
await p.reload({ waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 1500))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('PLAY SOLO')).click())
await new Promise(r => setTimeout(r, 700))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Sealed')).click())
await new Promise(r => setTimeout(r, 700))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('REVEAL PUBLIC')).click())
await new Promise(r => setTimeout(r, 700))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Reveal all')).click())
await new Promise(r => setTimeout(r, 500))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('CHOOSE PATTERN')).click())
await new Promise(r => setTimeout(r, 1200))
await p.screenshot({ path: '/tmp/waiting-scene.png' })
// Tap one mission to open focused sheet
await p.evaluate(() => {
  const btns = [...document.querySelectorAll('button[title]')]
  const target = btns[0]
  if (target) target.click()
})
await new Promise(r => setTimeout(r, 1000))
await p.screenshot({ path: '/tmp/waiting-focused-mission.png' })
await b.close()
console.log('done')
