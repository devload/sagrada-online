import { beforeEach, describe, expect, it } from 'vitest'
import { useGame } from './gameStore'
import { TOOL_DEFS } from '../game/tools'
import type { Die, DiceColor, DiceValue } from '../game/types'

/**
 * Integration-style tests around the Solo tool payment flow.
 *
 * These bypass the RNG by manually mutating the store's draft pool + tool
 * selection so we can drive deterministic scenarios.
 */

const die = (color: DiceColor, value: DiceValue, id: string): Die => ({
  id, color, value,
})

beforeEach(() => {
  // Reset store to a clean state between tests
  useGame.setState({ game: null, setup: null })
})

function boot(difficulty: 1 | 2 | 3 | 4 | 5 = 3) {
  useGame.getState().rollSetup()
  useGame.getState().startGame(undefined, difficulty)
  return useGame.getState().game!
}

describe('Solo mode — startGame · difficulty selects tool count', () => {
  it('level 1 → 1 tool', () => {
    const g = boot(1)
    expect(g.tools).toHaveLength(1)
    expect(g.soloMode).toBe(true)
    expect(g.soloDifficulty).toBe(1)
  })
  it('level 5 → 5 tools', () => {
    const g = boot(5)
    expect(g.tools).toHaveLength(5)
    expect(g.soloDifficulty).toBe(5)
  })
})

describe('Solo mode — tool payment removes matching die from draft pool', () => {
  it('using Grozing pays 1 purple die and marks tool used-forever', () => {
    boot(3)
    // Force a known tool set + pool
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.grozing] // color = purple
      s.game.toolsUsed = { grozing: false }
      s.game.draftPool = [
        die('purple', 3, 'p1'),
        die('red', 4, 'r1'),
      ]
      s.game.selectedDieId = 'r1'
    })

    // Grozing +1 on red die "r1", paid by "p1" (any purple)
    useGame.getState().activateTool('grozing')
    useGame.getState().applyTool({ delta: 1 })

    const g = useGame.getState().game!
    // Payment die (purple) is gone; red die remains (with value +1)
    expect(g.draftPool.find((d) => d.id === 'p1')).toBeUndefined()
    const red = g.draftPool.find((d) => d.id === 'r1')
    expect(red).toBeDefined()
    expect(red!.value).toBe(5) // 4 → 5
    expect(g.toolsUsed.grozing).toBe(true)
    expect(g.favorTokens).toBe(g.pattern.difficulty) // untouched in Solo
  })

  it('activating a tool without a matching color die records lastError', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.copperFoil] // needs red
      s.game.toolsUsed = { copperFoil: false }
      s.game.draftPool = [die('blue', 2, 'b1'), die('green', 3, 'g1')]
    })
    useGame.getState().activateTool('copperFoil')
    const g = useGame.getState().game!
    expect(g.activeTool).toBeNull()
    expect(g.lastError).toMatch(/red/)
  })

  it('a tool cannot be re-used in Solo (single-use, card is removed)', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.glazingHammer] // color = blue, rerollAll
      s.game.toolsUsed = { glazingHammer: true } // already used
      s.game.draftPool = [die('blue', 2, 'b1')]
    })
    useGame.getState().activateTool('glazingHammer')
    const g = useGame.getState().game!
    expect(g.activeTool).toBeNull()
    expect(g.lastError).toMatch(/이미 사용/)
  })
})

describe('Running Pliers — official first-pick timing', () => {
  it('rejects activation before any placement this round', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.runningPliers]
      s.game.toolsUsed = { runningPliers: false }
      s.game.draftPool = [die('red', 3, 'r1')]
      s.game.placedThisRound = 0
    })
    useGame.getState().activateTool('runningPliers')
    const g = useGame.getState().game!
    expect(g.activeTool).toBeNull()
    expect(g.lastError).toMatch(/첫 픽/)
  })

  it('accepted after first pick; grants +1 this round AND sets pending skip', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.runningPliers]
      s.game.toolsUsed = { runningPliers: false }
      s.game.draftPool = [die('red', 3, 'r1'), die('blue', 2, 'b1')]
      s.game.placedThisRound = 1
      s.game.placementLimit = 2
    })
    useGame.getState().activateTool('runningPliers')
    useGame.getState().applyTool()
    const g = useGame.getState().game!
    expect(g.placementLimit).toBe(3) // 2 + 1 = 3 placements this round
    expect(g.runningPliersPending).toBe(true)
    expect(g.toolsUsed.runningPliers).toBe(true)
    // Payment die (red) consumed
    expect(g.draftPool.find((d) => d.id === 'r1')).toBeUndefined()
  })
})

describe('Lathekin — 2 window moves per use (official)', () => {
  it('first apply keeps activeTool alive with movesDone=1; second apply finalizes', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.lathekin]
      s.game.toolsUsed = { lathekin: false }
      s.game.draftPool = [die('yellow', 3, 'y1')]
      // Place two dice on the window that we'll move around
      // Row/col 0/0 red 3, row/col 0/2 blue 5 (diagonal so both moves stay legal)
      s.game.window[0][0] = die('red', 3, 'rW')
      s.game.window[0][2] = die('blue', 5, 'bW')
    })
    // Move 1: (0,0) red 3 → (3,4). Valid (empty, no adjacency conflict since board is empty except for (0,2))
    useGame.getState().activateTool('lathekin')
    // We need the target to actually be legal for a "must-touch" rule since board has (0,2).
    // Choose (0,1): must touch existing (0,0 removed, 0,2 stays). value 3 vs neighbour (0,2)=5 → different; color red vs blue → different. OK.
    useGame.getState().applyTool({ from: [0, 0], to: [0, 1] })
    let g = useGame.getState().game!
    // After 1st move: tool still active, movesDone=1
    expect(g.activeTool).not.toBeNull()
    expect(g.activeTool!.movesDone).toBe(1)
    expect(g.toolsUsed.lathekin).toBe(false)
    expect(g.draftPool.find((d) => d.id === 'y1')).toBeDefined() // not yet paid

    // Move 2: (0,2) blue 5 → (1,2). Must touch (0,1)=red 3 and (0,2 removed). value 5 vs 3 diff, color blue vs red diff. OK.
    useGame.getState().applyTool({ from: [0, 2], to: [1, 2] })
    g = useGame.getState().game!
    expect(g.activeTool).toBeNull()
    expect(g.toolsUsed.lathekin).toBe(true)
    expect(g.draftPool.find((d) => d.id === 'y1')).toBeUndefined() // payment consumed
  })

  it('finalizeActiveTool ends the tool early after just one move', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.lathekin]
      s.game.toolsUsed = { lathekin: false }
      s.game.draftPool = [die('yellow', 3, 'y1')]
      // Use a plain pattern so no color/value restrictions get in the way
      s.game.pattern = {
        id: 'plain', name: 'Plain', difficulty: 3,
        grid: Array.from({ length: 4 }, () =>
          Array.from({ length: 5 }, () => ({ kind: 'none' as const }))
        ),
      }
      s.game.window[0][0] = die('red', 3, 'rW')
    })
    useGame.getState().activateTool('lathekin')
    // Move (0,0) → (3,4). After removing (0,0) board is empty; (3,4) is corner → OK.
    useGame.getState().applyTool({ from: [0, 0], to: [3, 4] })
    // Should still be active with movesDone=1
    const mid = useGame.getState().game!
    expect(mid.activeTool).not.toBeNull()
    expect(mid.activeTool!.movesDone).toBe(1)
    useGame.getState().finalizeActiveTool()
    const g = useGame.getState().game!
    expect(g.activeTool).toBeNull()
    expect(g.toolsUsed.lathekin).toBe(true)
    expect(g.draftPool.find((d) => d.id === 'y1')).toBeUndefined()
  })
})

describe('Tap Wheel — same-color constraint from round track', () => {
  it('rejects moves that do not match the chosen color', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.tapWheel]
      s.game.toolsUsed = { tapWheel: false }
      s.game.draftPool = [die('green', 3, 'g1')]
      s.game.roundTrack = [[die('red', 6, 'trackR')]]
      s.game.window[0][0] = die('blue', 3, 'bW')
    })
    useGame.getState().activateTool('tapWheel')
    // Pick color = red (matches track)
    useGame.getState().setActiveMoveColor('red')
    // Try to move the BLUE window die → should fail
    useGame.getState().applyTool({ from: [0, 0], to: [0, 4] })
    const g = useGame.getState().game!
    // Tool still active, move rejected
    expect(g.activeTool).not.toBeNull()
    expect(g.lastError).toMatch(/Tap Wheel/)
    // Payment die still in pool
    expect(g.draftPool.find((d) => d.id === 'g1')).toBeDefined()
  })
})

describe('cancelTool — user escape hatch from a window-move tool', () => {
  it('activating a window-move tool sets activeTool; cancelTool clears it without payment', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.tools = [TOOL_DEFS.copperFoil] // needs red die to pay
      s.game.toolsUsed = { copperFoil: false }
      s.game.draftPool = [die('red', 4, 'r1'), die('blue', 2, 'b1')]
      s.game.window[0][0] = die('red', 3, 'rW')
    })
    useGame.getState().activateTool('copperFoil')
    const mid = useGame.getState().game!
    // Tool is active, movesDone=0
    expect(mid.activeTool).not.toBeNull()
    expect(mid.activeTool!.toolId).toBe('copperFoil')
    expect(mid.activeTool!.movesDone ?? 0).toBe(0)
    // Payment die still in pool (not consumed until finalize)
    expect(mid.draftPool.find((d) => d.id === 'r1')).toBeDefined()

    // Escape hatch: user cancels without doing any move
    useGame.getState().cancelTool()
    const g = useGame.getState().game!
    expect(g.activeTool).toBeNull()
    // Nothing was paid, tool remains available for future use
    expect(g.toolsUsed.copperFoil).toBe(false)
    expect(g.draftPool.find((d) => d.id === 'r1')).toBeDefined()
  })
})

describe('Standard mode — still uses favor tokens (backward compat)', () => {
  it('when soloMode=false, activate/apply spends favor tokens instead of dice', () => {
    boot(3)
    useGame.setState((s) => {
      if (!s.game) return
      s.game.soloMode = false
      s.game.tools = [TOOL_DEFS.grozing]
      s.game.toolsUsed = { grozing: false }
      s.game.favorTokens = 4
      s.game.draftPool = [die('red', 3, 'r1'), die('purple', 5, 'p1')]
      s.game.selectedDieId = 'r1'
    })
    useGame.getState().activateTool('grozing')
    useGame.getState().applyTool({ delta: 1 })
    const g = useGame.getState().game!
    expect(g.favorTokens).toBe(3) // -1 (first use)
    // Purple die still in pool — payment was via favor token
    expect(g.draftPool.find((d) => d.id === 'p1')).toBeDefined()
    expect(g.draftPool.find((d) => d.id === 'r1')!.value).toBe(4)
  })
})
