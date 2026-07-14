import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Sagrada solo E2E — plays 3 rounds end-to-end at different difficulties.
 *
 * We drive the actual UI (clicks, taps) rather than reaching into the Zustand
 * store, so console/render bugs surface. The only "cheat" is that placement
 * tries every window cell in reading order until one succeeds — this simulates
 * a very lazy player and is enough to reach the scoreboard.
 */

type RoundLog = {
  difficulty: number
  finished: boolean
  reachedScoreboard: boolean
  durationMs: number
  consoleErrors: string[]
  consoleWarnings: string[]
  pageErrors: string[]
  notes: string[]
  toolUses: number
}

const SCREENSHOT_ROOT = path.resolve(__dirname, 'screenshots')

async function shot(page: Page, roundIdx: number, step: string) {
  const dir = path.join(SCREENSHOT_ROOT, `round-${roundIdx}`)
  fs.mkdirSync(dir, { recursive: true })
  await page
    .screenshot({ path: path.join(dir, `${step}.png`), fullPage: false })
    .catch(() => {})
}

async function seedLocalStorage(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sagrada.onboarded', '1')
      localStorage.setItem('sagrada.gameTutorialSeen', '1')
    } catch {}
  })
}

async function clickByText(page: Page, text: string, timeout = 4000): Promise<boolean> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const clicked = await page.evaluate((needle) => {
      const nodes = Array.from(document.querySelectorAll('button, a')) as HTMLElement[]
      const el = nodes.find((n) => (n.textContent || '').includes(needle))
      if (!el) return false
      // Skip if the click has no effect due to hidden/disabled state
      if ((el as HTMLButtonElement).disabled) return false
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return false
      el.click()
      return true
    }, text)
    if (clicked) return true
    await page.waitForTimeout(100)
  }
  return false
}

async function bodyIncludes(page: Page, text: string, timeout = 3000): Promise<boolean> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const has = await page.evaluate((t) => document.body.innerText.includes(t), text)
    if (has) return true
    await page.waitForTimeout(100)
  }
  return false
}

/** Set solo difficulty by opening the Difficulty sheet + picking the level. */
async function setDifficulty(page: Page, level: 1 | 2 | 3 | 4 | 5) {
  // Preserve via localStorage first — some renders read from storage on load
  await page.evaluate((lv) => {
    try {
      localStorage.setItem('sagrada.soloDifficulty', String(lv))
    } catch {}
  }, level)
  // Open picker
  const opened = await clickByText(page, 'DIFFICULTY')
  if (!opened) return
  await page.waitForTimeout(400)
  // Pick the level card by its "LV N" pill
  await page.evaluate((lv) => {
    const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
    const target = btns.find((b) => {
      const t = (b.textContent || '').replace(/\s+/g, ' ')
      // Level cards contain "LV" + the number + a label word
      return /LV\s*/.test(t) && new RegExp(`\\bLV\\s*${lv}\\b`).test(t)
    })
    target?.click()
  }, level)
  // Sheet auto-closes after 220ms
  await page.waitForTimeout(500)
}

/** Try placing every die in the tray at every window cell until one lands. */
async function tryPlaceAny(page: Page): Promise<boolean> {
  // Grab all draft dice buttons in the tray
  const trayDice = await page
    .locator('div.rounded-2xl:has-text("DRAFT POOL") button')
    .elementHandles()
    .catch(() => [] as any[])
  for (const die of trayDice) {
    try {
      await die.click({ timeout: 500 }).catch(() => {})
    } catch {}
    await page.waitForTimeout(150)

    // Now try every visible non-placed cell in the window grid
    const cells = await page
      .locator('div.grid.grid-rows-4.grid-cols-5 > button')
      .elementHandles()
      .catch(() => [] as any[])
    for (const cell of cells) {
      const disabled = await cell.getAttribute('disabled').catch(() => null)
      if (disabled !== null) continue
      const placedBefore = await page.evaluate(
        () => document.querySelectorAll('div.grid.grid-rows-4.grid-cols-5 > button[disabled]').length
      )
      await cell.click({ timeout: 500, force: true }).catch(() => {})
      await page.waitForTimeout(200)
      const placedAfter = await page.evaluate(
        () => document.querySelectorAll('div.grid.grid-rows-4.grid-cols-5 > button[disabled]').length
      )
      if (placedAfter > placedBefore) return true
    }
  }
  return false
}

/** Attempts to activate a single-die-affecting tool (grinding stone / flux). */
async function tryUseSimpleTool(page: Page, log: RoundLog): Promise<boolean> {
  // Open ToolsRail buttons — they open the ToolsSheet focused on that tool
  const railBtnCount = await page
    .locator('div.pointer-events-auto button')
    .count()
    .catch(() => 0)
  for (let i = 0; i < railBtnCount; i++) {
    const btn = page.locator('div.pointer-events-auto button').nth(i)
    const enabled = await btn.isEnabled().catch(() => false)
    if (!enabled) continue
    await btn.click({ timeout: 500 }).catch(() => {})
    await page.waitForTimeout(350)

    // Try the USE button (opens ToolsSheet in focus mode)
    const usedTool = await page
      .evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
        const el = btns.find((b) => !b.disabled && /USE\s*·/.test(b.textContent || ''))
        if (el) {
          el.click()
          return true
        }
        return false
      })
      .catch(() => false)
    if (usedTool) {
      log.toolUses += 1
      await page.waitForTimeout(300)
      // Some tools open action buttons (REROLL / FLIP / +1 / −1) — try to hit them
      const clicked = await page
        .evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
          const el = btns.find((b) => !b.disabled && /REROLL|FLIP|\+1|−1/.test(b.textContent || ''))
          if (el) {
            el.click()
            return true
          }
          return false
        })
        .catch(() => false)
      if (clicked) await page.waitForTimeout(300)
      // Close sheet — click backdrop or press Escape
      await closeAnySheet(page)
      // Safety: if a window-move / other complex tool got activated and the
      // sheet auto-closed with activeTool still set, cancel it via the
      // in-scene banner. Otherwise every window cell tap is swallowed into
      // "move source" mode and no die can be placed anywhere.
      await cancelAnyActiveTool(page)
      return true
    }
    // Not usable — close the sheet
    await closeAnySheet(page)
  }
  return false
}

/**
 * Presses the CANCEL button in the active-tool banner (added for
 * window-move tools like Eglomise / Copper Foil / Lathekin / Tap Wheel).
 * A no-op when there is no active tool.
 */
async function cancelAnyActiveTool(page: Page) {
  await page
    .evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      const cancel = btns.find(
        (b) => !b.disabled && /CANCEL/.test((b.textContent || '').replace(/\s+/g, ' '))
              && /Cancel tool/i.test(b.getAttribute('aria-label') || '')
      )
      if (cancel) cancel.click()
    })
    .catch(() => {})
  await page.waitForTimeout(120)
}

/** Close any open sheet by pressing Escape + clicking backdrop area. */
async function closeAnySheet(page: Page) {
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(150)
  // Backdrop is usually a fixed inset-0 element behind the sheet
  await page
    .evaluate(() => {
      const backdrop = document.querySelector(
        'div.fixed.inset-0[class*="bg-cathedral-void"], div.fixed.inset-0[class*="backdrop"]'
      ) as HTMLElement | null
      if (backdrop) backdrop.click()
    })
    .catch(() => {})
  await page.waitForTimeout(150)
}

/**
 * Runs a single full playthrough (10 rounds) and returns a log.
 * `strategy` selects how aggressively to poke at tools.
 */
async function playOne(
  page: Page,
  difficulty: 1 | 2 | 3 | 4 | 5,
  strategy: 'basic' | 'toolsHeavy' | 'specialTools',
  roundIdx: number
): Promise<RoundLog> {
  const log: RoundLog = {
    difficulty,
    finished: false,
    reachedScoreboard: false,
    durationMs: 0,
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    notes: [],
    toolUses: 0,
  }
  const start = Date.now()

  const onConsole = (m: ConsoleMessage) => {
    if (m.type() === 'error') log.consoleErrors.push(m.text())
    else if (m.type() === 'warning') log.consoleWarnings.push(m.text())
  }
  const onPageError = (e: Error) => log.pageErrors.push(e.message)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Wait a tick for React hydrate + framer motion mount
    await page.waitForTimeout(600)
    await shot(page, roundIdx, '01-lobby')

    // Set difficulty
    await setDifficulty(page, difficulty)
    await shot(page, roundIdx, '02-difficulty')

    // PLAY SOLO
    if (!(await clickByText(page, 'PLAY SOLO'))) log.notes.push('PLAY SOLO 버튼 못 찾음')
    await page.waitForTimeout(500)

    // Private reveal — tap the Sealed envelope
    await clickByText(page, 'Sealed')
    await page.waitForTimeout(500)
    await shot(page, roundIdx, '03-private')

    // Continue to public reveal
    await clickByText(page, '공용 미션 확인')
    await page.waitForTimeout(500)

    // Reveal all publics quickly (or tap each)
    await clickByText(page, 'Reveal all')
    await page.waitForTimeout(500)

    // Pattern selection
    await clickByText(page, '패턴 선택')
    await page.waitForTimeout(500)
    await shot(page, roundIdx, '04-pattern')

    // Pick the first pattern in the grid
    const pickedPattern = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      const patternBtn = btns.find((b) => (b.className || '').includes('glass-panel') && b.querySelector('div.grid'))
      if (patternBtn) {
        patternBtn.click()
        return true
      }
      return false
    })
    if (!pickedPattern) log.notes.push('패턴 카드 클릭 실패')
    await page.waitForTimeout(400)

    // BEGIN THE WORK
    await clickByText(page, 'BEGIN THE WORK')
    await page.waitForTimeout(1000)
    await shot(page, roundIdx, '05-r1-start')

    // Round loop — up to 10 rounds, with a safety cap of many placements
    let lastSeenRound = 1
    let stallGuard = 0
    const HARD_TIME_CAP_MS = 3 * 60_000
    const loopStart = Date.now()
    for (let iter = 0; iter < 200; iter++) {
      if (Date.now() - loopStart > HARD_TIME_CAP_MS) {
        log.notes.push(`시간 초과 (iter=${iter}, 최근 round=${lastSeenRound})`)
        break
      }
      // Detect end-of-game — Scoreboard scene has distinctive text
      const isScoreboard = await page.evaluate(() =>
        /MASTERPIECE\s+COMPLETE|CHALLENGE\s+FAILED|TOTAL\s+POINTS/i.test(document.body.innerText)
      )
      if (isScoreboard) {
        log.reachedScoreboard = true
        break
      }

      // Current round number
      const round = await page
        .evaluate(() => {
          const t = document.body.innerText
          const m = t.match(/ROUND\s*(\d+)\s*\/\s*10/)
          return m ? parseInt(m[1], 10) : null
        })
        .catch(() => null)

      if (round && round !== lastSeenRound) {
        lastSeenRound = round
        if (round === 3) await shot(page, roundIdx, '06-r3-early')
        if (round === 5) await shot(page, roundIdx, '07-r5-mid')
        if (round === 8) await shot(page, roundIdx, '08-r8-late')
      }

      // Occasionally try a tool depending on strategy
      const shouldTry =
        (strategy === 'toolsHeavy' && iter % 4 === 0 && log.toolUses < 4) ||
        (strategy === 'specialTools' && iter % 5 === 0 && log.toolUses < 3)
      if (shouldTry) {
        await tryUseSimpleTool(page, log).catch(() => {})
      }

      // Try to place a die
      const placed = await tryPlaceAny(page)
      if (!placed) {
        // Try PASS ROUND if visible
        const passed = await clickByText(page, 'PASS ROUND', 400)
        if (!passed) {
          stallGuard += 1
          if (stallGuard > 4) {
            log.notes.push(`정체 (round=${round})`)
            break
          }
        } else {
          stallGuard = 0
        }
        // Wait for round advance intro
        await page.waitForTimeout(1200)
      } else {
        stallGuard = 0
        // Wait for the placement animation + potential round transition
        await page.waitForTimeout(500)
      }
    }

    await page.waitForTimeout(2000)
    const finalScoreboard = await page.evaluate(() =>
      /MASTERPIECE\s+COMPLETE|CHALLENGE\s+FAILED|TOTAL\s+POINTS/i.test(document.body.innerText)
    )
    log.reachedScoreboard = log.reachedScoreboard || finalScoreboard
    log.finished = log.reachedScoreboard
    await shot(page, roundIdx, '09-scoreboard')
  } catch (err: any) {
    log.notes.push('예외: ' + (err?.message || String(err)))
  } finally {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
    log.durationMs = Date.now() - start
  }
  return log
}

const runsAcc: RoundLog[] = []

test.describe.serial('Sagrada Solo — 3 playthroughs', () => {
  test('Run 1 · Difficulty 3 (Medium) · basic', async ({ page }) => {
    await seedLocalStorage(page)
    const log = await playOne(page, 3, 'basic', 1)
    runsAcc.push(log)
    console.log(compactSummary(1, log))
  })

  test('Run 2 · Difficulty 5 (Easy) · tools-heavy', async ({ page }) => {
    await seedLocalStorage(page)
    const log = await playOne(page, 5, 'toolsHeavy', 2)
    runsAcc.push(log)
    console.log(compactSummary(2, log))
  })

  test('Run 3 · Difficulty 1 (Extreme) · special tools', async ({ page }) => {
    await seedLocalStorage(page)
    const log = await playOne(page, 1, 'specialTools', 3)
    runsAcc.push(log)
    console.log(compactSummary(3, log))
  })

  test.afterAll(async () => {
    const reportPath = path.join(__dirname, 'report.json')
    fs.writeFileSync(reportPath, JSON.stringify(runsAcc, null, 2))
    console.log('\n===== SAGRADA E2E · REPORT WRITTEN =====')
    console.log(reportPath)
  })
})

function compactSummary(i: number, r: RoundLog): string {
  const head =
    `[Run ${i}] diff=${r.difficulty} finished=${r.finished} scoreboard=${r.reachedScoreboard} ` +
    `duration=${(r.durationMs / 1000).toFixed(1)}s tools=${r.toolUses} ` +
    `errs=${r.consoleErrors.length} warns=${r.consoleWarnings.length} pageErrs=${r.pageErrors.length}`
  const notes = r.notes.length ? '\n  notes: ' + r.notes.join(' | ') : ''
  const err = r.consoleErrors.length ? '\n  err[0]: ' + r.consoleErrors[0].slice(0, 200) : ''
  const pageErr = r.pageErrors.length ? '\n  page[0]: ' + r.pageErrors[0].slice(0, 200) : ''
  return head + notes + err + pageErr
}
