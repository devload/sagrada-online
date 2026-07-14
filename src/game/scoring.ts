import { COLS, ROWS } from './rules'
import type { DiceColor, DiceValue, Die, PlacedDie } from './types'

export type ScoreLineItem = {
  label: string
  value: number
  /** true when the line was contributed by a specific objective card */
  fromObjective?: string
}

export type ScoreReport = {
  total: number
  breakdown: ScoreLineItem[]
}

/* ─── Public Objective Cards ─────────────────────────────── */

export type PublicObjective = {
  id: string
  name: string
  description: string
  pointsPer: number
  /** Compute how many "sets" this objective is worth, then multiply by pointsPer */
  count: (window: PlacedDie[][]) => number
}

const uniqueColors = (dice: PlacedDie[]): number => {
  const s = new Set<DiceColor>()
  for (const d of dice) if (d) s.add(d.color)
  return s.size
}
const uniqueValues = (dice: PlacedDie[]): number => {
  const s = new Set<DiceValue>()
  for (const d of dice) if (d) s.add(d.value)
  return s.size
}

const rowsOf = (w: PlacedDie[][]) => w
const colsOf = (w: PlacedDie[][]) =>
  Array.from({ length: COLS }, (_, c) => Array.from({ length: ROWS }, (_, r) => w[r][c]))

/** Row Color Variety — 6 points per row with 5 different colors */
export const rowColorVariety: PublicObjective = {
  id: 'rowColorVariety',
  name: 'Row Color Variety',
  description: '가로줄에 5가지 다른 색이 모두 있으면 +6점',
  pointsPer: 6,
  count: (w) => rowsOf(w).filter((row) => uniqueColors(row) === 5 && row.every((d) => d)).length,
}

/** Column Color Variety — 5 points per column with 4 different colors */
export const columnColorVariety: PublicObjective = {
  id: 'columnColorVariety',
  name: 'Column Color Variety',
  description: '세로줄에 4가지 다른 색이 모두 있으면 +5점',
  pointsPer: 5,
  count: (w) => colsOf(w).filter((col) => uniqueColors(col) === 4 && col.every((d) => d)).length,
}

/** Row Shade Variety — 5 points per row with 5 different values */
export const rowShadeVariety: PublicObjective = {
  id: 'rowShadeVariety',
  name: 'Row Shade Variety',
  description: '가로줄에 5개의 서로 다른 숫자가 있으면 +5점',
  pointsPer: 5,
  count: (w) => rowsOf(w).filter((row) => uniqueValues(row) === 5 && row.every((d) => d)).length,
}

/** Column Shade Variety — 4 points per column with 4 different values */
export const columnShadeVariety: PublicObjective = {
  id: 'columnShadeVariety',
  name: 'Column Shade Variety',
  description: '세로줄에 4개의 서로 다른 숫자가 있으면 +4점',
  pointsPer: 4,
  count: (w) => colsOf(w).filter((col) => uniqueValues(col) === 4 && col.every((d) => d)).length,
}

const countShadePairs = (w: PlacedDie[][], values: DiceValue[]): number => {
  const counts: Record<number, number> = {}
  for (const row of w) for (const d of row) if (d && values.includes(d.value)) counts[d.value] = (counts[d.value] || 0) + 1
  return Math.min(...values.map((v) => counts[v] || 0))
}

export const lightShades: PublicObjective = {
  id: 'lightShades',
  name: 'Light Shades',
  description: '1과 2가 짝을 이룰 때마다 +2점',
  pointsPer: 2,
  count: (w) => countShadePairs(w, [1, 2]),
}
export const mediumShades: PublicObjective = {
  id: 'mediumShades',
  name: 'Medium Shades',
  description: '3과 4가 짝을 이룰 때마다 +2점',
  pointsPer: 2,
  count: (w) => countShadePairs(w, [3, 4]),
}
export const deepShades: PublicObjective = {
  id: 'deepShades',
  name: 'Deep Shades',
  description: '5와 6이 짝을 이룰 때마다 +2점',
  pointsPer: 2,
  count: (w) => countShadePairs(w, [5, 6]),
}

/** Shade Variety — 5 points per set containing one of each value 1..6 */
export const shadeVariety: PublicObjective = {
  id: 'shadeVariety',
  name: 'Shade Variety',
  description: '1~6이 하나씩 모이면 +5점 (여러 세트 가능)',
  pointsPer: 5,
  count: (w) => {
    const counts: Record<number, number> = {}
    for (const row of w) for (const d of row) if (d) counts[d.value] = (counts[d.value] || 0) + 1
    return Math.min(...[1, 2, 3, 4, 5, 6].map((v) => counts[v] || 0))
  },
}

/** Color Variety — 4 points per set containing one of each color */
export const colorVariety: PublicObjective = {
  id: 'colorVariety',
  name: 'Color Variety',
  description: '5색이 하나씩 모이면 +4점 (여러 세트 가능)',
  pointsPer: 4,
  count: (w) => {
    const counts: Record<string, number> = {}
    for (const row of w) for (const d of row) if (d) counts[d.color] = (counts[d.color] || 0) + 1
    return Math.min(...(['red', 'blue', 'green', 'yellow', 'purple'] as DiceColor[]).map((c) => counts[c] || 0))
  },
}

/** Diagonals Same Color — 1 point per die that has a diagonally-adjacent same-color die */
export const diagonalsSameColor: PublicObjective = {
  id: 'diagonalsSameColor',
  name: 'Diagonals Same Color',
  description: '같은 색이 대각선으로 이어지는 각 주사위마다 +1점',
  pointsPer: 1,
  count: (w) => {
    let n = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const d = w[r][c]
        if (!d) continue
        for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const) {
          const nr = r + dr, nc = c + dc
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
          const other = w[nr][nc]
          if (other && other.color === d.color) { n++; break }
        }
      }
    }
    return n
  },
}

export const ALL_PUBLIC_OBJECTIVES: PublicObjective[] = [
  rowColorVariety,
  columnColorVariety,
  rowShadeVariety,
  columnShadeVariety,
  lightShades,
  mediumShades,
  deepShades,
  shadeVariety,
  colorVariety,
  diagonalsSameColor,
]

/* ─── Private Objective (one per color) ─────────────────── */

export type PrivateObjective = {
  id: string
  color: DiceColor
  name: string
  description: string
  score: (window: PlacedDie[][]) => number
}

const makePrivate = (color: DiceColor, name: string): PrivateObjective => ({
  id: `private-${color}`,
  color,
  name,
  description: `내 ${color} 주사위 값의 합만큼 점수`,
  score: (w) => {
    let s = 0
    for (const row of w) for (const d of row) if (d && d.color === color) s += d.value
    return s
  },
})

export const PRIVATE_OBJECTIVES: PrivateObjective[] = [
  makePrivate('red', 'Ruby'),
  makePrivate('blue', 'Sapphire'),
  makePrivate('green', 'Emerald'),
  makePrivate('yellow', 'Amber'),
  makePrivate('purple', 'Amethyst'),
]

/* ─── Final scoring ─────────────────────────────────────── */

export function countEmptyCells(window: PlacedDie[][]): number {
  let n = 0
  for (const row of window) for (const d of row) if (!d) n++
  return n
}

export type ScoreOptions = {
  /**
   * Points lost per empty cell. Standard = 1; Solo = 3.
   * Defaults to 1 (multiplayer rules).
   */
  emptyCellPenalty?: number
  /**
   * When true, each remaining favor token adds +1 VP (standard game).
   * Solo rules do NOT use favor tokens, so this should be false there.
   */
  includeFavorBonus?: boolean
  /**
   * When provided, private objectives array (Solo uses TWO privates).
   * If both `privates` and legacy single `priv` are given, `privates` wins.
   */
  privates?: PrivateObjective[]
}

export function score(
  window: PlacedDie[][],
  publics: PublicObjective[],
  priv: PrivateObjective,
  favorTokens: number,
  options: ScoreOptions = {}
): ScoreReport {
  const { emptyCellPenalty = 1, includeFavorBonus = true, privates } = options

  const breakdown: ScoreLineItem[] = []
  for (const obj of publics) {
    const c = obj.count(window)
    if (c > 0) breakdown.push({ label: obj.name, value: c * obj.pointsPer, fromObjective: obj.id })
    else breakdown.push({ label: obj.name, value: 0, fromObjective: obj.id })
  }

  // Private objectives — Solo has TWO (both scored). Standard has one.
  const privList = privates && privates.length > 0 ? privates : [priv]
  for (const p of privList) {
    breakdown.push({
      label: `Private · ${p.name}`,
      value: p.score(window),
      fromObjective: p.id,
    })
  }

  if (includeFavorBonus) {
    breakdown.push({ label: 'Favor Tokens', value: favorTokens })
  }
  const empties = countEmptyCells(window)
  breakdown.push({
    label: emptyCellPenalty === 3 ? 'Empty Cells (×3)' : 'Empty Cells',
    value: -empties * emptyCellPenalty,
  })

  const total = breakdown.reduce((s, l) => s + l.value, 0)
  return { total, breakdown }
}

/**
 * Solo Target Score — sum of the pip values of every die on the Round Track.
 * If a round is empty (no leftover dice), the official rule uses a Score
 * Marker as a placeholder worth 0 pips; we simply skip empty rounds.
 * Player must score STRICTLY MORE than this value to win.
 */
export function computeTargetScore(roundTrack: Die[][]): number {
  let total = 0
  for (const roundDice of roundTrack) {
    for (const d of roundDice) total += d.value
  }
  return total
}

/** Pick N random public objectives (deterministic if rng provided) */
export function pickPublics(n = 3, rng: () => number = Math.random): PublicObjective[] {
  const pool = [...ALL_PUBLIC_OBJECTIVES]
  const out: PublicObjective[] = []
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

export function pickPrivate(rng: () => number = Math.random): PrivateObjective {
  return PRIVATE_OBJECTIVES[Math.floor(rng() * PRIVATE_OBJECTIVES.length)]
}

/** Pick N distinct private objectives (Solo uses 2, both face-up). */
export function pickPrivates(n = 2, rng: () => number = Math.random): PrivateObjective[] {
  const pool = [...PRIVATE_OBJECTIVES]
  const out: PrivateObjective[] = []
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}
