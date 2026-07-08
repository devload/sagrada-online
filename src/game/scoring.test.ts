import { describe, expect, it } from 'vitest'
import {
  countEmptyCells,
  rowColorVariety,
  columnColorVariety,
  rowShadeVariety,
  lightShades,
  diagonalsSameColor,
  PRIVATE_OBJECTIVES,
  score,
} from './scoring'
import { ROWS, COLS } from './rules'
import type { Die, PlacedDie } from './types'

const empty = (): PlacedDie[][] =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null as PlacedDie))

const die = (color: 'red' | 'blue' | 'green' | 'yellow' | 'purple', v: 1 | 2 | 3 | 4 | 5 | 6): Die => ({
  id: `${color}${v}`, color, value: v,
})

describe('countEmptyCells', () => {
  it('20 for empty', () => expect(countEmptyCells(empty())).toBe(20))
  it('19 after placing one', () => {
    const w = empty()
    w[0][0] = die('red', 1)
    expect(countEmptyCells(w)).toBe(19)
  })
})

describe('rowColorVariety', () => {
  it('scores when a row has 5 colors', () => {
    const w = empty()
    w[0] = [die('red', 1), die('blue', 2), die('green', 3), die('yellow', 4), die('purple', 5)]
    expect(rowColorVariety.count(w)).toBe(1)
  })
  it('does not score when row has repeat color', () => {
    const w = empty()
    w[0] = [die('red', 1), die('red', 2), die('green', 3), die('yellow', 4), die('purple', 5)]
    expect(rowColorVariety.count(w)).toBe(0)
  })
})

describe('columnColorVariety', () => {
  it('scores when a column has 4 colors', () => {
    const w = empty()
    w[0][0] = die('red', 1)
    w[1][0] = die('blue', 2)
    w[2][0] = die('green', 3)
    w[3][0] = die('yellow', 4)
    expect(columnColorVariety.count(w)).toBe(1)
  })
})

describe('rowShadeVariety', () => {
  it('scores when a row has 5 different values', () => {
    const w = empty()
    w[0] = [die('red', 1), die('blue', 2), die('green', 3), die('yellow', 4), die('purple', 5)]
    expect(rowShadeVariety.count(w)).toBe(1)
  })
})

describe('lightShades', () => {
  it('counts pairs of 1s and 2s', () => {
    const w = empty()
    w[0][0] = die('red', 1)
    w[0][1] = die('blue', 2)
    w[1][0] = die('green', 1)
    w[1][1] = die('yellow', 2)
    expect(lightShades.count(w)).toBe(2) // min(count(1), count(2)) = min(2, 2)
  })
})

describe('diagonalsSameColor', () => {
  it('scores each die with a same-color diagonal neighbor', () => {
    const w = empty()
    w[0][0] = die('red', 1)
    w[1][1] = die('red', 2)
    expect(diagonalsSameColor.count(w)).toBe(2)
  })
})

describe('private objective', () => {
  it('sums own-color values', () => {
    const w = empty()
    w[0][0] = die('red', 3)
    w[0][2] = die('red', 5)
    w[1][1] = die('blue', 2)
    const ruby = PRIVATE_OBJECTIVES.find((p) => p.color === 'red')!
    expect(ruby.score(w)).toBe(8)
  })
})

describe('score integration', () => {
  it('subtracts empty cells and adds favors', () => {
    const w = empty()
    w[0][0] = die('red', 1)
    const report = score(w, [], PRIVATE_OBJECTIVES[0], 4)
    // total = 0 (no publics) + private(red=1) + favors(4) - empties(19)
    expect(report.total).toBe(1 + 4 - 19)
  })
})
