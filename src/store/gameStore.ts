import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Die, PatternCard, PlacedDie } from '../game/types'
import {
  canPlace,
  COLS,
  legalCells,
  ROWS,
  rollDice,
  withDiePlaced,
  withDieRemoved,
  type PlaceOptions,
  type PlacementResult,
} from '../game/rules'
import {
  ALL_PUBLIC_OBJECTIVES,
  countEmptyCells,
  pickPrivate,
  pickPublics,
  score,
  type PrivateObjective,
  type PublicObjective,
  type ScoreReport,
} from '../game/scoring'
import { recordFromGameEnd } from '../game/stats'
import { fluxReroll, grindingStone, grozing, TOOL_DEFS, tokenCost, type ToolCardDef } from '../game/tools'
import { MOCK_PATTERNS } from '../game/mockData'
import type { Rng } from '../game/rng'

export const TOTAL_ROUNDS = 10
/** Solo dice count per round: enough to place 2 and discard 1 = 3 */
export const DICE_PER_ROUND = 3

export type ActiveTool = null | {
  toolId: string
  delta?: 1 | -1
  /** For window-move tools: the source cell that user picked to move */
  moveFrom?: [number, number]
  /** For Lens Cutter: the round track die id user picked to swap */
  swapWithTrackDieId?: string
}

export type ActiveGame = {
  pattern: PatternCard
  window: PlacedDie[][]
  round: number
  placedThisRound: number
  /** Cap on placements this round — 2 by default, +1 if Running Pliers used */
  placementLimit: number
  favorTokens: number
  draftPool: Die[]
  selectedDieId: string | null
  publics: PublicObjective[]
  private: PrivateObjective
  toolsUsed: Record<string, boolean>
  tools: ToolCardDef[]
  activeTool: ActiveTool
  lastError: string | null
  finalScore: ScoreReport | null
  /**
   * Round Track — after each round, any dice left in the draft pool are moved
   * here (indexed by round-1). These represent dice the artisan chose NOT to
   * draft. In original Sagrada the Lens Cutter tool can swap draft-pool dice
   * with round-track dice; they otherwise persist as historical record.
   */
  roundTrack: Die[][]
}

/**
 * A "pending setup" — private objective is chosen and revealed BEFORE the
 * player picks a pattern. This matches the original Sagrada rules: you see
 * your private goal color first, then choose a pattern that suits it.
 */
export type Setup = {
  private: PrivateObjective
  publics: PublicObjective[]
}

const emptyWindow = (): PlacedDie[][] =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null as PlacedDie))

type State = {
  setup: Setup | null
  game: ActiveGame | null
  /** Roll setup: called before pattern selection, gives player their private + public objectives */
  rollSetup: () => void
  clearSetup: () => void

  startGame: (patternId?: string) => void
  quitGame: () => void
  selectDie: (dieId: string | null) => void
  placeSelectedAt: (row: number, col: number) => PlacementResult
  legalCellsForSelected: () => Array<[number, number]>
  activateTool: (toolId: string) => void
  cancelTool: () => void
  applyTool: (payload?: unknown) => void
  finishRound: () => void
}

function newRound(game: ActiveGame, rng: Rng = Math.random): ActiveGame {
  return {
    ...game,
    round: game.round + 1,
    placedThisRound: 0,
    placementLimit: 2, // Reset — Running Pliers only affects the round it's used in
    draftPool: rollDice(DICE_PER_ROUND, undefined, rng),
    selectedDieId: null,
    activeTool: null,
    lastError: null,
  }
}

export const useGame = create<State>()(
  immer((set, get) => ({
    setup: null,
    game: null,

    rollSetup: () => {
      const priv = pickPrivate()
      const publics = pickPublics(3)
      set({ setup: { private: priv, publics } })
    },

    clearSetup: () => set({ setup: null }),

    startGame: (patternId) => {
      const pattern =
        (patternId && MOCK_PATTERNS.find((p) => p.id === patternId)) || MOCK_PATTERNS[0]
      const setup = get().setup
      const chosenPublics = setup?.publics ?? pickPublics(3)
      const priv = setup?.private ?? pickPrivate()
      // Pick 3 random tools out of the full 12
      const allToolIds = Object.keys(TOOL_DEFS)
      const shuffled = [...allToolIds].sort(() => Math.random() - 0.5)
      const toolIds = shuffled.slice(0, 3)
      const game: ActiveGame = {
        pattern,
        window: emptyWindow(),
        round: 1,
        placedThisRound: 0,
        placementLimit: 2,
        favorTokens: pattern.difficulty,
        draftPool: rollDice(DICE_PER_ROUND),
        selectedDieId: null,
        publics: chosenPublics,
        private: priv,
        tools: toolIds.map((id) => TOOL_DEFS[id]),
        toolsUsed: Object.fromEntries(toolIds.map((id) => [id, false])) as Record<string, boolean>,
        activeTool: null,
        lastError: null,
        finalScore: null,
        roundTrack: [],
      }
      set({ game, setup: null })
    },

    quitGame: () => set({ game: null, setup: null }),

    selectDie: (dieId) =>
      set((s) => {
        if (!s.game) return
        s.game.selectedDieId = dieId
        s.game.lastError = null
      }),

    legalCellsForSelected: () => {
      const g = get().game
      if (!g || !g.selectedDieId) return []
      const die = g.draftPool.find((d) => d.id === g.selectedDieId)
      if (!die) return []
      const opts: PlaceOptions = g.activeTool?.toolId === 'corkStraight'
        ? { ignoreAdjacency: true, skipMustTouch: true }
        : {}
      return legalCells(g.window, g.pattern, die, opts)
    },

    placeSelectedAt: (row, col) => {
      const g = get().game
      if (!g) return { ok: false, reason: 'occupied', message: '게임이 없어요' }
      if (g.placedThisRound >= g.placementLimit) return { ok: false, reason: 'occupied', message: `이번 라운드에 이미 ${g.placementLimit}번 배치했어요` }
      if (!g.selectedDieId) return { ok: false, reason: 'occupied', message: '주사위를 먼저 선택하세요' }

      const die = g.draftPool.find((d) => d.id === g.selectedDieId)
      if (!die) return { ok: false, reason: 'occupied', message: '선택한 주사위를 찾을 수 없어요' }

      const opts: PlaceOptions = g.activeTool?.toolId === 'corkStraight'
        ? { ignoreAdjacency: true, skipMustTouch: true }
        : {}

      const result = canPlace(g.window, g.pattern, row, col, die, opts)
      if (!result.ok) {
        set((s) => { if (s.game) s.game.lastError = result.message })
        return result
      }

      set((s) => {
        if (!s.game) return
        s.game.window = withDiePlaced(s.game.window, row, col, die)
        s.game.draftPool = s.game.draftPool.filter((d) => d.id !== die.id)
        s.game.selectedDieId = null
        s.game.placedThisRound += 1
        s.game.activeTool = null
        s.game.lastError = null
      })

      const after = get().game!
      if (after.placedThisRound >= after.placementLimit || after.draftPool.length === 0) {
        setTimeout(() => get().finishRound(), 400)
      }
      return result
    },

    activateTool: (toolId) =>
      set((s) => {
        if (!s.game) return
        if (s.game.toolsUsed[toolId] && s.game.favorTokens < 2) {
          s.game.lastError = 'Favor Token이 부족해요 (2 필요)'
          return
        }
        if (!s.game.toolsUsed[toolId] && s.game.favorTokens < 1) {
          s.game.lastError = 'Favor Token이 부족해요 (1 필요)'
          return
        }
        s.game.activeTool = { toolId }
        s.game.lastError = null
      }),

    cancelTool: () =>
      set((s) => {
        if (!s.game) return
        s.game.activeTool = null
      }),

    applyTool: (payload) => {
      const g = get().game
      if (!g || !g.activeTool) return
      const tid = g.activeTool.toolId
      const cost = tokenCost(g.toolsUsed[tid])

      set((s) => {
        if (!s.game) return
        const die = s.game.selectedDieId
          ? s.game.draftPool.find((d) => d.id === s.game!.selectedDieId)
          : null
        let ok = false

        switch (tid) {
          case 'grozing': {
            const delta = (payload as { delta: 1 | -1 })?.delta || 1
            if (die) {
              const nd = grozing(die, delta)
              if (nd) {
                s.game.draftPool = s.game.draftPool.map((d) => (d.id === die.id ? nd : d))
                ok = true
              } else {
                s.game.lastError = '1↔6 순환은 불가능해요'
              }
            }
            break
          }
          case 'grindingStone': {
            if (die) {
              const nd = grindingStone(die)
              s.game.draftPool = s.game.draftPool.map((d) => (d.id === die.id ? nd : d))
              ok = true
            }
            break
          }
          case 'fluxBrush':
          case 'fluxRemover': {
            if (die) {
              const nd = fluxReroll(die)
              s.game.draftPool = s.game.draftPool.map((d) => (d.id === die.id ? nd : d))
              ok = true
            }
            break
          }
          case 'glazingHammer': {
            // Reroll all dice in the pool (preserve colors, reroll values)
            s.game.draftPool = s.game.draftPool.map((d) => fluxReroll(d))
            ok = true
            break
          }
          case 'runningPliers': {
            // Grant one extra placement this round
            s.game.placementLimit = s.game.placementLimit + 1
            ok = true
            break
          }
          case 'lensCutter': {
            // Swap selected draft die with a track die specified by payload
            const trackDieId = (payload as { trackDieId: string })?.trackDieId
            if (die && trackDieId) {
              // Find the track die
              let found: { round: number; die: Die } | null = null
              s.game.roundTrack.forEach((roundDice, roundIdx) => {
                const found2 = roundDice.find((d) => d.id === trackDieId)
                if (found2) found = { round: roundIdx, die: found2 }
              })
              if (found !== null) {
                const f = found as { round: number; die: Die }
                // Swap
                s.game.draftPool = s.game.draftPool.map((d) => (d.id === die.id ? f.die : d))
                s.game.roundTrack[f.round] = s.game.roundTrack[f.round].map((d) =>
                  d.id === f.die.id ? die : d
                )
                ok = true
              }
            }
            break
          }
          case 'eglomise':
          case 'copperFoil':
          case 'lathekin':
          case 'tapWheel': {
            // Window move — payload has { from: [r,c], to: [r,c] }
            const from = (payload as { from: [number, number] })?.from
            const to = (payload as { to: [number, number] })?.to
            if (!from || !to) break
            const srcDie = s.game.window[from[0]][from[1]]
            if (!srcDie) break

            // Build tool-specific bypass options
            const toolDef = TOOL_DEFS[tid]
            const opts: PlaceOptions = {
              ignoreColor: toolDef.moveIgnoreColor,
              ignoreValue: toolDef.moveIgnoreValue,
              // Adjacency + must-touch still apply for these tools
            }

            // Temporarily remove src to check placement at dest
            const withoutSrc = withDieRemoved(s.game.window, from[0], from[1])
            const result = canPlace(withoutSrc, s.game.pattern, to[0], to[1], srcDie, opts)
            if (result.ok) {
              const withDest = withDiePlaced(withoutSrc, to[0], to[1], srcDie)
              s.game.window = withDest
              ok = true
            } else {
              s.game.lastError = result.message
            }
            break
          }
          case 'corkStraight': {
            // No immediate effect — placement will bypass adjacency; keep active
            return
          }
        }

        if (ok) {
          s.game.favorTokens -= cost
          s.game.toolsUsed[tid] = true
          s.game.activeTool = null
        }
      })
    },

    finishRound: () => {
      const g = get().game
      if (!g) return

      // Move any leftover draft-pool dice to the Round Track before rolling next round
      set((s) => {
        if (!s.game) return
        const leftover = [...s.game.draftPool]
        // Ensure roundTrack has entries for previous rounds
        while (s.game.roundTrack.length < s.game.round) s.game.roundTrack.push([])
        s.game.roundTrack[s.game.round - 1] = leftover
      })

      if (g.round >= TOTAL_ROUNDS) {
        const finalScore = score(g.window, g.publics, g.private, g.favorTokens)
        set((s) => {
          if (!s.game) return
          s.game.finalScore = finalScore
          s.game.draftPool = []
        })
        // Persist the completed game to stats
        try {
          recordFromGameEnd({
            finalScore: finalScore.total,
            pattern: g.pattern,
            publicIds: g.publics.map((p) => p.id),
            privateColor: g.private.color,
            favorTokensRemaining: g.favorTokens,
            emptyCells: countEmptyCells(g.window),
          })
        } catch {}
        return
      }

      set((s) => {
        if (!s.game) return
        Object.assign(s.game, newRound(s.game))
      })
    },
  }))
)

export const availablePublics = () => ALL_PUBLIC_OBJECTIVES.slice(0, 3)
