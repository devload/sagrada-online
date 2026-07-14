import type {
  DiceColor,
  DiceValue,
  Die,
  PatternCard,
  PlacedDie,
} from './types'

export const ROWS = 4
export const COLS = 5

export type PlaceOptions = {
  /** Ignore pattern color restriction (Eglomise / Copper) */
  ignoreColor?: boolean
  /** Ignore pattern value restriction (Copper Foil) */
  ignoreValue?: boolean
  /** Ignore adjacency rules — Cork-backed Straightedge only */
  ignoreAdjacency?: boolean
  /** Skip the "must touch existing die" rule (used when moving) */
  skipMustTouch?: boolean
  /**
   * Cork-backed Straightedge — the die MUST NOT be adjacent (ortho or
   * diagonal) to any other die. Overrides the usual "must touch existing"
   * requirement, but pattern color/value restrictions still apply.
   */
  requireNotAdjacent?: boolean
}

export type PlacementError =
  | 'occupied'
  | 'out-of-bounds'
  | 'pattern-color'
  | 'pattern-value'
  | 'adjacent-same-color'
  | 'adjacent-same-value'
  | 'first-must-be-edge'
  | 'must-touch-existing'
  | 'must-not-be-adjacent'

export type PlacementResult =
  | { ok: true }
  | { ok: false; reason: PlacementError; message: string }

const REASON_MESSAGES: Record<PlacementError, string> = {
  'occupied': '이 칸에는 이미 주사위가 있어요',
  'out-of-bounds': '창문 밖입니다',
  'pattern-color': '이 칸은 다른 색만 놓을 수 있어요',
  'pattern-value': '이 칸은 다른 숫자만 놓을 수 있어요',
  'adjacent-same-color': '인접한 칸에 같은 색이 있어요',
  'adjacent-same-value': '인접한 칸에 같은 숫자가 있어요',
  'first-must-be-edge': '첫 주사위는 창문 가장자리에만 놓을 수 있어요',
  'must-touch-existing': '이미 놓인 주사위와 상하좌우/대각선으로 붙어야 해요',
  'must-not-be-adjacent': 'Cork-backed Straightedge는 다른 주사위와 붙지 않은 칸에만 놓을 수 있어요',
}

const fail = (reason: PlacementError): PlacementResult => ({
  ok: false,
  reason,
  message: REASON_MESSAGES[reason],
})

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS
}

export function isEmpty(window: PlacedDie[][]): boolean {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (window[r][c]) return false
  return true
}

export function countPlaced(window: PlacedDie[][]): number {
  let n = 0
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (window[r][c]) n++
  return n
}

/** Orthogonally adjacent neighbours */
export function orthNeighbours(row: number, col: number): Array<[number, number]> {
  return [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ].filter(([r, c]) => inBounds(r, c)) as Array<[number, number]>
}

/** Orth + diagonal neighbours */
export function allNeighbours(row: number, col: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr, c = col + dc
      if (inBounds(r, c)) out.push([r, c])
    }
  }
  return out
}

function isEdge(row: number, col: number): boolean {
  return row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1
}

/**
 * Check if `die` can be placed at (row, col) on `window` per pattern.
 * Pure — no mutation.
 */
export function canPlace(
  window: PlacedDie[][],
  pattern: PatternCard,
  row: number,
  col: number,
  die: Die,
  opts: PlaceOptions = {}
): PlacementResult {
  if (!inBounds(row, col)) return fail('out-of-bounds')
  if (window[row][col]) return fail('occupied')

  const restriction = pattern.grid[row][col]
  if (!opts.ignoreColor && restriction.kind === 'color' && restriction.color !== die.color) {
    return fail('pattern-color')
  }
  if (!opts.ignoreValue && restriction.kind === 'value' && restriction.value !== die.value) {
    return fail('pattern-value')
  }

  // Adjacent same-color / same-value
  if (!opts.ignoreAdjacency) {
    for (const [r, c] of orthNeighbours(row, col)) {
      const other = window[r][c]
      if (!other) continue
      if (other.color === die.color) return fail('adjacent-same-color')
      if (other.value === die.value) return fail('adjacent-same-value')
    }
  }

  // Cork-backed Straightedge: die must NOT be adjacent (ortho or diagonal)
  // to any other die. Replaces the usual touch requirement.
  if (opts.requireNotAdjacent) {
    for (const [r, c] of allNeighbours(row, col)) {
      if (window[r][c]) return fail('must-not-be-adjacent')
    }
    return { ok: true }
  }

  // First die: must be on edge/corner
  const empty = isEmpty(window)
  if (empty) {
    if (!isEdge(row, col)) return fail('first-must-be-edge')
    return { ok: true }
  }

  // Subsequent dice: must touch an existing die (ortho or diagonal)
  if (!opts.skipMustTouch) {
    let touches = false
    for (const [r, c] of allNeighbours(row, col)) {
      if (window[r][c]) { touches = true; break }
    }
    if (!touches) return fail('must-touch-existing')
  }

  return { ok: true }
}

/** Set of legal cells for a given die on a window (used for hint highlights) */
export function legalCells(
  window: PlacedDie[][],
  pattern: PatternCard,
  die: Die,
  opts: PlaceOptions = {}
): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (canPlace(window, pattern, r, c, die, opts).ok) out.push([r, c])
    }
  }
  return out
}

/** Returns a new window with the die placed. Does NOT validate — caller should check first. */
export function withDiePlaced(
  window: PlacedDie[][],
  row: number,
  col: number,
  die: Die
): PlacedDie[][] {
  return window.map((rowArr, r) =>
    rowArr.map((cell, c) => (r === row && c === col ? { ...die } : cell))
  )
}

/** Remove a die from window (used by tool cards) */
export function withDieRemoved(
  window: PlacedDie[][],
  row: number,
  col: number
): PlacedDie[][] {
  return window.map((rowArr, r) =>
    rowArr.map((cell, c) => (r === row && c === col ? null : cell))
  )
}

export const COLORS: DiceColor[] = ['red', 'blue', 'green', 'yellow', 'purple']
export const VALUES: DiceValue[] = [1, 2, 3, 4, 5, 6]

export const rollDie = (rng: () => number = Math.random): DiceValue =>
  (Math.floor(rng() * 6) + 1) as DiceValue

let idc = 0
export const nextDieId = () => `d${++idc}`

export function rollDice(count: number, colors: DiceColor[] = COLORS, rng: () => number = Math.random): Die[] {
  const out: Die[] = []
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(rng() * colors.length)]
    out.push({ id: nextDieId(), color, value: rollDie(rng) })
  }
  return out
}
