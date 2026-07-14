import { describe, expect, it } from 'vitest'
import {
  canPayForTool,
  DIFFICULTY_TOOL_COUNT,
  eligiblePaymentDice,
  grindingStone,
  grozing,
  TOOL_DEFS,
} from './tools'
import type { DiceColor, DiceValue, Die } from './types'

const die = (color: DiceColor, value: DiceValue, id = `${color}${value}`): Die => ({
  id, color, value,
})

describe('TOOL_DEFS colors — official Sagrada Solo payment', () => {
  it('every one of the 12 tools has a payment color', () => {
    const ids = Object.keys(TOOL_DEFS)
    expect(ids).toHaveLength(12)
    for (const id of ids) {
      expect(TOOL_DEFS[id].color).toBeDefined()
      expect(['red', 'blue', 'green', 'yellow', 'purple']).toContain(TOOL_DEFS[id].color)
    }
  })

  it('Lathekin moves 2 dice per use (official rule)', () => {
    expect(TOOL_DEFS.lathekin.moveCount).toBe(2)
  })

  it('Tap Wheel moves up to 2 same-color dice (official rule)', () => {
    expect(TOOL_DEFS.tapWheel.moveCount).toBe(2)
    expect(TOOL_DEFS.tapWheel.moveSameColorOnly).toBe(true)
    expect(TOOL_DEFS.tapWheel.needsRoundTrack).toBe(true)
  })

  it('Running Pliers is flagged with the extra-turn + first-pick timing rule', () => {
    expect(TOOL_DEFS.runningPliers.grantsExtraTurn).toBe(true)
    expect(TOOL_DEFS.runningPliers.runningPliersMode).toBe(true)
  })

  it('single-move tools (Eglomise, Copper Foil) still allow 1 move', () => {
    expect(TOOL_DEFS.eglomise.moveCount).toBe(1)
    expect(TOOL_DEFS.copperFoil.moveCount).toBe(1)
  })
})

describe('grozing / grinding — value math', () => {
  it('grozing +1 within bounds', () => {
    expect(grozing(die('red', 3), 1)?.value).toBe(4)
  })
  it('grozing refuses 1 → 0 (no wrap)', () => {
    expect(grozing(die('red', 1), -1)).toBeNull()
  })
  it('grozing refuses 6 → 7 (no wrap)', () => {
    expect(grozing(die('red', 6), 1)).toBeNull()
  })
  it('grindingStone flips to opposite face', () => {
    expect(grindingStone(die('red', 1)).value).toBe(6)
    expect(grindingStone(die('red', 3)).value).toBe(4)
    expect(grindingStone(die('red', 5)).value).toBe(2)
  })
})

describe('Solo dice payment — eligiblePaymentDice / canPayForTool', () => {
  it('returns only dice whose color matches the tool color', () => {
    const pool = [die('red', 3), die('blue', 4), die('red', 6), die('green', 1)]
    const eligible = eligiblePaymentDice(pool, TOOL_DEFS.copperFoil) // color = red
    expect(eligible).toHaveLength(2)
    expect(eligible.every((d) => d.color === 'red')).toBe(true)
  })

  it('canPayForTool is false when no matching die exists', () => {
    const pool = [die('blue', 4), die('green', 1)]
    expect(canPayForTool(pool, TOOL_DEFS.copperFoil)).toBe(false) // needs red
    expect(canPayForTool(pool, TOOL_DEFS.eglomise)).toBe(true) // needs blue
  })

  it('canPayForTool true when at least one matching die exists', () => {
    const pool = [die('red', 3)]
    expect(canPayForTool(pool, TOOL_DEFS.copperFoil)).toBe(true) // red
  })
})

describe('DIFFICULTY_TOOL_COUNT — official Solo variant', () => {
  it('Level 1 = Extreme = 1 tool', () => {
    expect(DIFFICULTY_TOOL_COUNT[1]).toBe(1)
  })
  it('Level 5 = Easy = 5 tools', () => {
    expect(DIFFICULTY_TOOL_COUNT[5]).toBe(5)
  })
  it('Levels 2/3/4 fill the gap', () => {
    expect(DIFFICULTY_TOOL_COUNT[2]).toBe(2)
    expect(DIFFICULTY_TOOL_COUNT[3]).toBe(3)
    expect(DIFFICULTY_TOOL_COUNT[4]).toBe(4)
  })
})
