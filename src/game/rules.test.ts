import { describe, expect, it } from 'vitest'
import { canPlace, isEmpty, legalCells, ROWS, COLS, withDiePlaced } from './rules'
import type { Die, PatternCard, PlacedDie } from './types'

const empty = (): PlacedDie[][] =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null as PlacedDie))

const plain: PatternCard = {
  id: 'plain',
  name: 'Plain',
  difficulty: 3,
  grid: Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ kind: 'none' as const }))
  ),
}

const die = (color: 'red' | 'blue' | 'green' | 'yellow' | 'purple', v: 1 | 2 | 3 | 4 | 5 | 6, id = 'x'): Die => ({
  id, color, value: v,
})

describe('canPlace — first die', () => {
  it('accepts edge cell', () => {
    expect(canPlace(empty(), plain, 0, 0, die('red', 3)).ok).toBe(true)
    expect(canPlace(empty(), plain, 3, 4, die('red', 3)).ok).toBe(true)
  })
  it('rejects middle cell as first placement', () => {
    const r = canPlace(empty(), plain, 1, 2, die('red', 3))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('first-must-be-edge')
  })
})

describe('canPlace — adjacency', () => {
  it('rejects same color adjacent (orthogonal)', () => {
    const w = withDiePlaced(empty(), 0, 0, die('red', 3))
    const r = canPlace(w, plain, 0, 1, die('red', 5))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('adjacent-same-color')
  })
  it('rejects same value adjacent (orthogonal)', () => {
    const w = withDiePlaced(empty(), 0, 0, die('red', 3))
    const r = canPlace(w, plain, 0, 1, die('blue', 3))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('adjacent-same-value')
  })
  it('accepts different color+value adjacent', () => {
    const w = withDiePlaced(empty(), 0, 0, die('red', 3))
    const r = canPlace(w, plain, 0, 1, die('blue', 5))
    expect(r.ok).toBe(true)
  })
  it('accepts same color diagonally', () => {
    const w = withDiePlaced(empty(), 0, 0, die('red', 3))
    const r = canPlace(w, plain, 1, 1, die('red', 5))
    expect(r.ok).toBe(true)
  })
})

describe('canPlace — must touch existing', () => {
  it('rejects isolated placement', () => {
    const w = withDiePlaced(empty(), 0, 0, die('red', 3))
    const r = canPlace(w, plain, 2, 2, die('blue', 5))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('must-touch-existing')
  })
  it('accepts placement diagonally adjacent to existing', () => {
    const w = withDiePlaced(empty(), 0, 0, die('red', 3))
    const r = canPlace(w, plain, 1, 1, die('blue', 5))
    expect(r.ok).toBe(true)
  })
})

describe('canPlace — pattern restrictions', () => {
  const patCol: PatternCard = {
    ...plain,
    grid: plain.grid.map((row, r) =>
      row.map((cell, c) => (r === 0 && c === 0 ? { kind: 'color' as const, color: 'blue' as const } : cell))
    ),
  }
  const patVal: PatternCard = {
    ...plain,
    grid: plain.grid.map((row, r) =>
      row.map((cell, c) => (r === 0 && c === 0 ? { kind: 'value' as const, value: 5 as const } : cell))
    ),
  }

  it('rejects mismatched color on color cell', () => {
    const r = canPlace(empty(), patCol, 0, 0, die('red', 3))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('pattern-color')
  })
  it('accepts matching color on color cell', () => {
    expect(canPlace(empty(), patCol, 0, 0, die('blue', 3)).ok).toBe(true)
  })
  it('rejects mismatched value on value cell', () => {
    const r = canPlace(empty(), patVal, 0, 0, die('red', 3))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('pattern-value')
  })
})

describe('canPlace — bypass options', () => {
  it('ignoreAdjacency lets same-color adjacent placement pass', () => {
    const w = withDiePlaced(empty(), 0, 0, die('red', 3))
    const r = canPlace(w, plain, 0, 1, die('red', 5), { ignoreAdjacency: true, skipMustTouch: true })
    expect(r.ok).toBe(true)
  })
})

describe('isEmpty / legalCells', () => {
  it('isEmpty true for new window', () => {
    expect(isEmpty(empty())).toBe(true)
  })
  it('legalCells only edges for first placement', () => {
    const cells = legalCells(empty(), plain, die('red', 3))
    // 4 corners + edges: 5+5+2+2 = 14 edge cells for 4x5 grid
    // = perimeter = 2*(4+5) - 4 = 14
    expect(cells.length).toBe(14)
    for (const [r, c] of cells) {
      expect(r === 0 || r === 3 || c === 0 || c === 4).toBe(true)
    }
  })
})
