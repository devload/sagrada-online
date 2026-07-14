import type { Die, DiceColor, DiceValue } from './types'
import { rollDie } from './rules'

export type ToolCardDef = {
  id: string
  name: string
  description: string
  /**
   * Official Sagrada tool-card "top-left color" — in Solo mode you pay by
   * spending a draft-pool die of THIS color (rather than favor tokens).
   * See: Sagrada rulebook (Floodgate SA01), Solo Variant section.
   */
  color: DiceColor
  /** Whether it grants adjacency bypass on placement */
  bypassAdjacency?: boolean
  /** Whether it lets you modify a drafted die's value */
  modifyValue?: boolean
  /** Whether it re-rolls a die */
  reroll?: boolean
  /** Requires selecting a die on the window to move somewhere else */
  moveMode?: 'window' | null
  /** Bypass placement restrictions when moving on the window */
  moveIgnoreColor?: boolean
  moveIgnoreValue?: boolean
  /**
   * For window-move tools, the maximum number of dice that may be moved
   * with a single activation. Defaults to 1. Lathekin = 2, Tap Wheel = 2.
   */
  moveCount?: number
  /**
   * Tap Wheel: all moved dice must match a chosen color from the current
   * round track. We model the constraint at the UI level (player picks
   * a color first), so here it's just a flag for special handling.
   */
  moveSameColorOnly?: boolean
  /** Requires a die from the round track to be picked */
  needsRoundTrack?: boolean
  /** Grants an extra placement this round */
  grantsExtraTurn?: boolean
  /**
   * Running Pliers (official): must be used immediately after your FIRST
   * draft of the round → you take a second die right away, and then you
   * skip your first pick of the following round.
   */
  runningPliersMode?: boolean
  /** Rerolls the entire draft pool */
  rerollAll?: boolean
}

export const TOOL_DEFS: Record<string, ToolCardDef> = {
  // Colors follow the top-left color band on each official Sagrada tool card.
  // Original 3
  grozing: {
    id: 'grozing',
    name: 'Grozing Pliers',
    description: '드래프트한 주사위 값을 +1 또는 −1 조정 (1↔6 순환 불가)',
    color: 'purple',
    modifyValue: true,
  },
  fluxBrush: {
    id: 'fluxBrush',
    name: 'Flux Brush',
    description: '드래프트한 주사위를 다시 굴리기',
    color: 'purple',
    reroll: true,
  },
  corkStraight: {
    id: 'corkStraight',
    name: 'Cork-backed Straightedge',
    description: '다른 주사위와 인접하지 않은 칸에 배치 가능 (모든 배치 규칙 완화)',
    color: 'purple',
    bypassAdjacency: true,
  },
  // NEW 9
  eglomise: {
    id: 'eglomise',
    name: 'Eglomise Brush',
    description: '창문의 주사위 하나를 이동 · 색 제약 무시 (숫자 · 인접 규칙은 준수)',
    color: 'blue',
    moveMode: 'window',
    moveIgnoreColor: true,
    moveCount: 1,
  },
  copperFoil: {
    id: 'copperFoil',
    name: 'Copper Foil Burnisher',
    description: '창문의 주사위 하나를 이동 · 숫자 제약 무시 (색 · 인접 규칙은 준수)',
    color: 'red',
    moveMode: 'window',
    moveIgnoreValue: true,
    moveCount: 1,
  },
  lathekin: {
    id: 'lathekin',
    name: 'Lathekin',
    description: '창문의 주사위 2개를 이동 · 모든 배치 규칙 준수',
    color: 'yellow',
    moveMode: 'window',
    moveCount: 2,
  },
  lensCutter: {
    id: 'lensCutter',
    name: 'Lens Cutter',
    description: '드래프트한 주사위와 라운드 트랙의 주사위를 교환',
    color: 'green',
    needsRoundTrack: true,
  },
  fluxRemover: {
    id: 'fluxRemover',
    name: 'Flux Remover',
    description: '드래프트한 주사위 폐기 → 새 주사위로 교체',
    color: 'red',
    reroll: true,
  },
  glazingHammer: {
    id: 'glazingHammer',
    name: 'Glazing Hammer',
    description: '드래프트 풀의 모든 주사위 다시 굴리기',
    color: 'blue',
    rerollAll: true,
  },
  runningPliers: {
    id: 'runningPliers',
    name: 'Running Pliers',
    description: '라운드 첫 픽 직후 사용 → 즉시 한 번 더 픽 · 다음 라운드 첫 픽 스킵',
    color: 'red',
    grantsExtraTurn: true,
    runningPliersMode: true,
  },
  grindingStone: {
    id: 'grindingStone',
    name: 'Grinding Stone',
    description: '드래프트한 주사위를 반대 면으로 뒤집기 (1↔6, 2↔5, 3↔4)',
    color: 'yellow',
    modifyValue: true,
  },
  tapWheel: {
    id: 'tapWheel',
    name: 'Tap Wheel',
    description: '라운드 트랙의 색과 같은 창문의 주사위 최대 2개를 이동 (모든 규칙 준수)',
    color: 'green',
    moveMode: 'window',
    moveCount: 2,
    moveSameColorOnly: true,
    needsRoundTrack: true,
  },
}

/** Apply Grozing Pliers ±1 to a die value; 1↔6 순환 불가 */
export function grozing(die: Die, delta: 1 | -1): Die | null {
  const nv = die.value + delta
  if (nv < 1 || nv > 6) return null
  return { ...die, value: nv as DiceValue }
}

/** Grinding Stone — flip to opposite face (1↔6, 2↔5, 3↔4) */
export function grindingStone(die: Die): Die {
  return { ...die, value: (7 - die.value) as DiceValue }
}

/** Flux Brush / Flux Remover — reroll the value (keep color for Flux Brush) */
export function fluxReroll(die: Die, rng: () => number = Math.random): Die {
  return { ...die, value: rollDie(rng) }
}

/** Cost in favor tokens: 1 for first use, 2 for subsequent uses (standard rules) */
export function tokenCost(previouslyUsed: boolean): number {
  return previouslyUsed ? 2 : 1
}

/** Which tools are considered "simple" (no window-move / track needed) */
export function isSimpleTool(tool: ToolCardDef): boolean {
  return !tool.moveMode && !tool.needsRoundTrack
}

/* ─── Solo mode: dice-based tool payment ─────────────────── */

/**
 * Official Sagrada Solo variant: to use a Tool Card you must PAY with a
 * draft-pool die whose color matches the tool's top-left color band. That
 * die + the tool card are then permanently removed from the game (each
 * tool may be used at most once in Solo).
 *
 * Returns the list of draft-pool die IDs eligible to pay for `tool`.
 */
export function eligiblePaymentDice(pool: Die[], tool: ToolCardDef): Die[] {
  return pool.filter((d) => d.color === tool.color)
}

/** Whether the given draft pool has ANY die that could pay for the tool. */
export function canPayForTool(pool: Die[], tool: ToolCardDef): boolean {
  return eligiblePaymentDice(pool, tool).length > 0
}

/**
 * Number of tool cards a Solo game should start with, given difficulty (1-5).
 * Level 1 = Extreme Challenge (1 tool). Level 5 = Easy (5 tools).
 */
export const DIFFICULTY_TOOL_COUNT: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
}

export type SoloDifficulty = 1 | 2 | 3 | 4 | 5

export const DIFFICULTY_LABEL: Record<SoloDifficulty, string> = {
  1: 'EXTREME',
  2: 'HARD',
  3: 'MEDIUM',
  4: 'CASUAL',
  5: 'EASY',
}

export const DIFFICULTY_SUBTITLE: Record<SoloDifficulty, string> = {
  1: '단 1장의 도구 · 순수 실력만',
  2: '2장 · 도전적인 밤',
  3: '3장 · 균형 잡힌 선택',
  4: '4장 · 도구가 넉넉',
  5: '5장 · 처음이라면 여기서',
}
