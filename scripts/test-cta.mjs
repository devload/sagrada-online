import puppeteer from 'puppeteer'
const worst = { width: 375, height: 620, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const b = await puppeteer.launch({ headless: 'new', defaultViewport: worst })
const p = await b.newPage()
await p.setViewport(worst)
await p.goto('https://dh1rtp9d6qdlf.cloudfront.net/?v=cta', { waitUntil: 'networkidle2' })
await p.evaluate(() => localStorage.setItem('sagrada.onboarded', '1'))
await p.reload({ waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 1500))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('PLAY SOLO')).click())
await new Promise(r => setTimeout(r, 700))
// Private reveal — reveal the envelope then screenshot with new CTA visible
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Sealed')).click())
await new Promise(r => setTimeout(r, 900))
await p.screenshot({ path: '/tmp/cta-private.png' })
// Move to public reveal
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('공용 미션'))?.click())
await new Promise(r => setTimeout(r, 800))
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Reveal all'))?.click())
await new Promise(r => setTimeout(r, 700))
await p.screenshot({ path: '/tmp/cta-public.png' })
await b.close()
console.log('done')
