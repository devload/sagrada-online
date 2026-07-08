export type DiceColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple'
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6

export type Die = {
  id: string
  color: DiceColor
  value: DiceValue
}

// Pattern cell restriction: color constraint OR value constraint OR none
export type CellRestriction =
  | { kind: 'color'; color: DiceColor }
  | { kind: 'value'; value: DiceValue }
  | { kind: 'none' }

export type PatternCard = {
  id: string
  name: string
  difficulty: 3 | 4 | 5 | 6
  grid: CellRestriction[][] // 4 rows x 5 cols
}

export type PlacedDie = Die | null

export type Player = {
  id: string
  name: string
  avatarHue: number
  window: PlacedDie[][] // 4x5
  favorTokens: number
  score: number
}

export type ObjectiveCard = {
  id: string
  name: string
  description: string
  points: number
}

export type ToolCard = {
  id: string
  name: string
  description: string
  used: boolean
}

export const COLOR_HEX: Record<DiceColor, string> = {
  red: '#B8213A',
  blue: '#1E4A8F',
  green: '#1E7A4F',
  yellow: '#D4A017',
  purple: '#6B2C7A',
}
