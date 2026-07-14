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
  computeTargetScore,
  countEmptyCells,
  pickPrivate,
  pickPrivates,
  pickPublics,
  score,
  type PrivateObjective,
  type PublicObjective,
  type ScoreReport,
} from '../game/scoring'
import { recordFromGameEnd } from '../game/stats'
import {
  canPayForTool,
  DIFFICULTY_TOOL_COUNT,
  fluxReroll,
  grindingStone,
  grozing,
  TOOL_DEFS,
  tokenCost,
  type SoloDifficulty,
  type ToolCardDef,
} from '../game/tools'
import { MOCK_PATTERNS } from '../game/mockData'
import type { Rng } from '../game/rng'

export const TOTAL_ROUNDS = 10
/**
 * Solo dice count per round.
 * Official Sagrada Solo rules: 4 dice per round (2 to place, 2 to Round Track).
 */
export const DICE_PER_ROUND = 4
/**
 * Solo empty-cell penalty per official rules: −3 VP per empty cell.
 * Standard multiplayer game uses −1.
 */
export const SOLO_EMPTY_PENALTY = 3
/** Number of Public Objectives shown in Solo (official = 2). */
export const SOLO_PUBLICS = 2
/** Number of Private Objectives shown in Solo (both face-up, official = 2). */
export const SOLO_PRIVATES = 2

export type ActiveTool = null | {
  toolId: string
  delta?: 1 | -1
  /** For window-move tools: the source cell that user picked to move */
  moveFrom?: [number, number]
  /**
   * For multi-move tools (Lathekin, Tap Wheel): the number of moves the
   * player has already completed with this activation. When it reaches
   * `moveCount`, the tool auto-finalizes.
   */
  movesDone?: number
  /**
   * For Tap Wheel: the color chosen from the round track. All moved dice
   * must match this color.
   */
  moveColor?: import('../game/types').DiceColor
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
  /**
   * Kept for backward compat: the primary private objective. In Solo mode we
   * also store the full list (2 privates) in `privates`; `private` is index 0.
   */
  private: PrivateObjective
  /** All private objectives (Solo = 2 face-up; standard game = 1). */
  privates: PrivateObjective[]
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
  /**
   * Solo mode Target Score — sum of pip values of every die on the Round
   * Track. Player must score strictly greater than this to win. Computed
   * live and finalised at game end.
   */
  targetScore: number
  /**
   * Solo mode result — set alongside `finalScore`. `null` until game ends.
   */
  soloResult: 'win' | 'loss' | null
  /**
   * When true, this game uses Solo rules (−3 empty penalty, no favor bonus,
   * target score, 2 privates). False = standard multiplayer rules.
   */
  soloMode: boolean
  /**
   * Solo difficulty level (1 = Extreme / 1 tool, 5 = Easy / 5 tools). Only
   * meaningful when `soloMode === true`.
   */
  soloDifficulty: SoloDifficulty
  /**
   * Running Pliers pending penalty — when set to true, the player must skip
   * their FIRST pick of the next round (i.e. only 1 placement allowed).
   * Consumed on round-start.
   */
  runningPliersPending: boolean
}

/**
 * A "pending setup" — private objective is chosen and revealed BEFORE the
 * player picks a pattern. This matches the original Sagrada rules: you see
 * your private goal color first, then choose a pattern that suits it.
 */
export type Setup = {
  /** Legacy single-private (kept for backward compat with the reveal scenes). */
  private: PrivateObjective
  /** Full list — Solo shows 2 face-up privates. */
  privates: PrivateObjective[]
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

  startGame: (patternId?: string, difficulty?: SoloDifficulty) => void
  quitGame: () => void
  selectDie: (dieId: string | null) => void
  placeSelectedAt: (row: number, col: number) => PlacementResult
  legalCellsForSelected: () => Array<[number, number]>
  activateTool: (toolId: string) => void
  cancelTool: () => void
  applyTool: (payload?: unknown) => void
  finishRound: () => void
  /**
   * For Tap Wheel: pick the round-track color that the moves will follow.
   * Called from the UI once the player taps a track die. No-op if the
   * active tool isn't Tap Wheel.
   */
  setActiveMoveColor: (color: import('../game/types').DiceColor) => void
  /**
   * Finalize a multi-move tool early (Lathekin / Tap Wheel), consuming
   * payment and clearing activeTool. Used when the player chooses to move
   * only 1 die of the 2 allowed.
   */
  finalizeActiveTool: () => void
}

function newRound(game: ActiveGame, rng: Rng = Math.random): ActiveGame {
  // Running Pliers pending: player skips first pick of this round → only 1
  // placement instead of 2. Consume the pending flag.
  const nextLimit = game.runningPliersPending ? 1 : 2
  return {
    ...game,
    round: game.round + 1,
    placedThisRound: 0,
    placementLimit: nextLimit,
    draftPool: rollDice(DICE_PER_ROUND, undefined, rng),
    selectedDieId: null,
    activeTool: null,
    lastError: null,
    runningPliersPending: false,
  }
}

export const useGame = create<State>()(
  immer((set, get) => ({
    setup: null,
    game: null,

    rollSetup: () => {
      // Solo rules: 2 face-up privates + 2 face-up publics.
      const privates = pickPrivates(SOLO_PRIVATES)
      const publics = pickPublics(SOLO_PUBLICS)
      set({ setup: { private: privates[0], privates, publics } })
    },

    clearSetup: () => set({ setup: null }),

    startGame: (patternId, difficulty) => {
      const pattern =
        (patternId && MOCK_PATTERNS.find((p) => p.id === patternId)) || MOCK_PATTERNS[0]
      const setup = get().setup
      const chosenPublics = setup?.publics ?? pickPublics(SOLO_PUBLICS)
      const chosenPrivates =
        setup?.privates && setup.privates.length > 0
          ? setup.privates
          : setup?.private
          ? [setup.private]
          : pickPrivates(SOLO_PRIVATES)
      const priv = chosenPrivates[0] ?? pickPrivate()
      // Solo tool count from difficulty (1..5). Default = 3 (Medium).
      const soloDifficulty: SoloDifficulty = difficulty ?? 3
      const toolCount = DIFFICULTY_TOOL_COUNT[soloDifficulty]
      const allToolIds = Object.keys(TOOL_DEFS)
      const shuffled = [...allToolIds].sort(() => Math.random() - 0.5)
      const toolIds = shuffled.slice(0, toolCount)
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
        privates: chosenPrivates,
        tools: toolIds.map((id) => TOOL_DEFS[id]),
        toolsUsed: Object.fromEntries(toolIds.map((id) => [id, false])) as Record<string, boolean>,
        activeTool: null,
        lastError: null,
        finalScore: null,
        roundTrack: [],
        targetScore: 0,
        soloResult: null,
        soloMode: true,
        soloDifficulty,
        runningPliersPending: false,
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
        ? { requireNotAdjacent: true }
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
        ? { requireNotAdjacent: true }
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
        const tool = TOOL_DEFS[toolId]
        if (!tool) return

        // Solo mode: each tool is single-use (removed after use) AND requires
        // a matching-color die in the draft pool to pay the cost.
        if (s.game.soloMode) {
          if (s.game.toolsUsed[toolId]) {
            s.game.lastError = '이 도구는 이미 사용했어요 (Solo · 1회만)'
            return
          }
          if (!canPayForTool(s.game.draftPool, tool)) {
            s.game.lastError = `${tool.color} 주사위가 있어야 이 도구를 쓸 수 있어요`
            return
          }
          // Running Pliers has a strict timing: must be used AFTER first pick
          if (tool.runningPliersMode && s.game.placedThisRound !== 1) {
            s.game.lastError = 'Running Pliers는 이번 라운드 첫 픽 직후에만 사용해요'
            return
          }
        } else {
          if (s.game.toolsUsed[toolId] && s.game.favorTokens < 2) {
            s.game.lastError = 'Favor Token이 부족해요 (2 필요)'
            return
          }
          if (!s.game.toolsUsed[toolId] && s.game.favorTokens < 1) {
            s.game.lastError = 'Favor Token이 부족해요 (1 필요)'
            return
          }
        }
        s.game.activeTool = { toolId, movesDone: 0 }
        s.game.lastError = null
      }),

    cancelTool: () =>
      set((s) => {
        if (!s.game) return
        s.game.activeTool = null
      }),

    setActiveMoveColor: (color) =>
      set((s) => {
        if (!s.game?.activeTool) return
        s.game.activeTool.moveColor = color
      }),

    finalizeActiveTool: () =>
      set((s) => {
        if (!s.game?.activeTool) return
        const tid = s.game.activeTool.toolId
        const toolDef = TOOL_DEFS[tid]
        // Must have at least one move done to finalize (else use cancel)
        const done = s.game.activeTool.movesDone ?? 0
        if (done === 0) {
          s.game.activeTool = null
          return
        }
        if (s.game.soloMode) {
          const idx = s.game.draftPool.findIndex((d) => d.color === toolDef.color)
          if (idx >= 0) {
            const paying = s.game.draftPool[idx]
            if (s.game.selectedDieId === paying.id) s.game.selectedDieId = null
            s.game.draftPool.splice(idx, 1)
          }
        } else {
          const cost = tokenCost(s.game.toolsUsed[tid])
          s.game.favorTokens -= cost
        }
        s.game.toolsUsed[tid] = true
        s.game.activeTool = null
      }),

    applyTool: (payload) => {
      const g = get().game
      if (!g || !g.activeTool) return
      const tid = g.activeTool.toolId
      const toolDef = TOOL_DEFS[tid]
      const cost = tokenCost(g.toolsUsed[tid])

      set((s) => {
        if (!s.game) return
        const die = s.game.selectedDieId
          ? s.game.draftPool.find((d) => d.id === s.game!.selectedDieId)
          : null
        let ok = false
        // For multi-move tools we may finalize across several apply calls.
        // Default = tool finalizes on this apply.
        let finalize = true

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
            // Official: only usable right after your FIRST pick of the round.
            // Grant one extra placement THIS round, then set a pending flag
            // so the FIRST pick of the NEXT round is skipped.
            if (s.game.placedThisRound !== 1) {
              s.game.lastError = 'Running Pliers는 첫 픽 직후에만 사용해요'
              break
            }
            s.game.placementLimit = s.game.placementLimit + 1
            s.game.runningPliersPending = true
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

            // Tap Wheel: enforce same-color constraint (chosen at activation).
            if (tid === 'tapWheel') {
              const chosen = s.game.activeTool?.moveColor
              if (chosen && srcDie.color !== chosen) {
                s.game.lastError = `Tap Wheel: ${chosen} 주사위만 옮길 수 있어요`
                break
              }
            }

            const opts: PlaceOptions = {
              ignoreColor: toolDef.moveIgnoreColor,
              ignoreValue: toolDef.moveIgnoreValue,
            }

            const withoutSrc = withDieRemoved(s.game.window, from[0], from[1])
            const result = canPlace(withoutSrc, s.game.pattern, to[0], to[1], srcDie, opts)
            if (result.ok) {
              s.game.window = withDiePlaced(withoutSrc, to[0], to[1], srcDie)
              ok = true

              // Multi-move: Lathekin & Tap Wheel allow up to 2 moves per use.
              const maxMoves = toolDef.moveCount ?? 1
              const done = (s.game.activeTool?.movesDone ?? 0) + 1
              if (done < maxMoves) {
                finalize = false
                if (s.game.activeTool) {
                  s.game.activeTool.movesDone = done
                  // Reset moveFrom so UI prompts for the next source cell
                  s.game.activeTool.moveFrom = undefined
                }
              }
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

        if (ok && finalize) {
          if (s.game.soloMode) {
            // Solo payment: remove one draft-pool die whose color matches the
            // tool's top-left color band. The die + card are gone for good.
            const idx = s.game.draftPool.findIndex((d) => d.color === toolDef.color)
            if (idx >= 0) {
              const paying = s.game.draftPool[idx]
              // If the player also had that die "selected" (e.g., for grozing
              // on a red die and the tool color is also red), clear selection
              // when the selected die was consumed as payment.
              if (s.game.selectedDieId === paying.id) {
                s.game.selectedDieId = null
              }
              s.game.draftPool.splice(idx, 1)
            }
          } else {
            s.game.favorTokens -= cost
          }
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
        // Update live target score (Solo win condition).
        s.game.targetScore = computeTargetScore(s.game.roundTrack)
      })

      // Refresh snapshot after target score update
      const gAfter = get().game!
      if (gAfter.round >= TOTAL_ROUNDS) {
        const solo = gAfter.soloMode
        const finalScore = score(
          gAfter.window,
          gAfter.publics,
          gAfter.private,
          gAfter.favorTokens,
          solo
            ? {
                emptyCellPenalty: SOLO_EMPTY_PENALTY,
                includeFavorBonus: false,
                privates: gAfter.privates,
              }
            : {}
        )
        const target = computeTargetScore(gAfter.roundTrack)
        const soloResult: 'win' | 'loss' | null = solo
          ? finalScore.total > target ? 'win' : 'loss'
          : null
        set((s) => {
          if (!s.game) return
          s.game.finalScore = finalScore
          s.game.targetScore = target
          s.game.soloResult = soloResult
          s.game.draftPool = []
        })
        // Persist the completed game to stats
        try {
          recordFromGameEnd({
            finalScore: finalScore.total,
            pattern: gAfter.pattern,
            publicIds: gAfter.publics.map((p) => p.id),
            privateColor: gAfter.private.color,
            favorTokensRemaining: gAfter.favorTokens,
            emptyCells: countEmptyCells(gAfter.window),
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
