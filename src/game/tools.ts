import type { Die, DiceValue } from './types'
import { rollDie } from './rules'

export type ToolCardDef = {
  id: string
  name: string
  description: string
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
  /** Requires a die from the round track to be picked */
  needsRoundTrack?: boolean
  /** Grants an extra placement this round */
  grantsExtraTurn?: boolean
  /** Rerolls the entire draft pool */
  rerollAll?: boolean
}

export const TOOL_DEFS: Record<string, ToolCardDef> = {
  // Original 3
  grozing: {
    id: 'grozing',
    name: 'Grozing Pliers',
    description: '드래프트한 주사위 값을 +1 또는 −1 조정 (1↔6 순환 불가)',
    modifyValue: true,
  },
  fluxBrush: {
    id: 'fluxBrush',
    name: 'Flux Brush',
    description: '드래프트한 주사위를 다시 굴리기',
    reroll: true,
  },
  corkStraight: {
    id: 'corkStraight',
    name: 'Cork-backed Straightedge',
    description: '다른 주사위와 인접하지 않은 칸에 배치 가능 (모든 배치 규칙 완화)',
    bypassAdjacency: true,
  },
  // NEW 9
  eglomise: {
    id: 'eglomise',
    name: 'Eglomise Brush',
    description: '창문의 주사위 하나를 이동 · 색 제약 무시 (숫자 · 인접 규칙은 준수)',
    moveMode: 'window',
    moveIgnoreColor: true,
  },
  copperFoil: {
    id: 'copperFoil',
    name: 'Copper Foil Burnisher',
    description: '창문의 주사위 하나를 이동 · 숫자 제약 무시 (색 · 인접 규칙은 준수)',
    moveMode: 'window',
    moveIgnoreValue: true,
  },
  lathekin: {
    id: 'lathekin',
    name: 'Lathekin',
    description: '창문의 주사위 하나를 이동 · 모든 배치 규칙 준수',
    moveMode: 'window',
  },
  lensCutter: {
    id: 'lensCutter',
    name: 'Lens Cutter',
    description: '드래프트한 주사위와 라운드 트랙의 주사위를 교환',
    needsRoundTrack: true,
  },
  fluxRemover: {
    id: 'fluxRemover',
    name: 'Flux Remover',
    description: '드래프트한 주사위 폐기 → 새 주사위로 교체',
    reroll: true,
  },
  glazingHammer: {
    id: 'glazingHammer',
    name: 'Glazing Hammer',
    description: '드래프트 풀의 모든 주사위 다시 굴리기',
    rerollAll: true,
  },
  runningPliers: {
    id: 'runningPliers',
    name: 'Running Pliers',
    description: '이번 라운드에 주사위를 하나 더 배치 (3/2 배치)',
    grantsExtraTurn: true,
  },
  grindingStone: {
    id: 'grindingStone',
    name: 'Grinding Stone',
    description: '드래프트한 주사위를 반대 면으로 뒤집기 (1↔6, 2↔5, 3↔4)',
    modifyValue: true,
  },
  tapWheel: {
    id: 'tapWheel',
    name: 'Tap Wheel',
    description: '창문의 주사위 하나를 이동 (색 · 숫자 · 인접 규칙 모두 준수)',
    moveMode: 'window',
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

/** Cost in favor tokens: 1 for first use, 2 for subsequent uses */
export function tokenCost(previouslyUsed: boolean): number {
  return previouslyUsed ? 2 : 1
}

/** Which tools are considered "simple" (no window-move / track needed) */
export function isSimpleTool(tool: ToolCardDef): boolean {
  return !tool.moveMode && !tool.needsRoundTrack
}
