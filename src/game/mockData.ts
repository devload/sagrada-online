import type { Die, PatternCard, Player, ObjectiveCard, ToolCard, DiceColor, DiceValue, CellRestriction, PlacedDie } from './types'

let idCounter = 0
const uid = () => `d${++idCounter}`

const c = (color: DiceColor): CellRestriction => ({ kind: 'color', color })
const v = (value: DiceValue): CellRestriction => ({ kind: 'value', value })
const n = (): CellRestriction => ({ kind: 'none' })

export const MOCK_PATTERNS: PatternCard[] = [
  {
    id: 'kaleidoscopic',
    name: 'Kaleidoscopic Dream',
    difficulty: 4,
    grid: [
      [c('yellow'), n(), n(), v(5), c('blue')],
      [n(), v(3), n(), c('purple'), n()],
      [c('purple'), n(), c('green'), n(), v(2)],
      [n(), c('red'), n(), v(4), n()],
    ],
  },
  {
    id: 'aurorae',
    name: 'Aurorae Magnificus',
    difficulty: 5,
    grid: [
      [v(1), c('purple'), n(), c('blue'), n()],
      [c('yellow'), n(), v(4), n(), c('green')],
      [n(), c('red'), n(), v(6), n()],
      [c('blue'), n(), c('purple'), n(), v(3)],
    ],
  },
  {
    id: 'firmitas',
    name: 'Firmitas',
    difficulty: 3,
    grid: [
      [n(), c('yellow'), n(), n(), v(5)],
      [v(6), n(), c('red'), n(), n()],
      [n(), c('green'), n(), v(2), c('purple')],
      [c('blue'), n(), v(1), n(), n()],
    ],
  },
  {
    id: 'water_serpent',
    name: 'Water of Life',
    difficulty: 6,
    grid: [
      [c('blue'), v(3), n(), v(5), c('red')],
      [v(1), c('green'), n(), c('yellow'), v(6)],
      [c('purple'), v(2), c('blue'), v(4), c('green')],
      [v(6), c('red'), v(1), n(), c('purple')],
    ],
  },
]

// Empty 4x5 window
const emptyWindow = (): PlacedDie[][] =>
  Array.from({ length: 4 }, () => Array.from({ length: 5 }, () => null as PlacedDie))

// Sample placed dice on player 1's window
const p1Window = emptyWindow()
p1Window[0][0] = { id: uid(), color: 'yellow', value: 3 }
p1Window[0][3] = { id: uid(), color: 'blue', value: 5 }
p1Window[1][1] = { id: uid(), color: 'purple', value: 3 }
p1Window[1][3] = { id: uid(), color: 'red', value: 2 }
p1Window[2][0] = { id: uid(), color: 'purple', value: 6 }
p1Window[2][2] = { id: uid(), color: 'green', value: 4 }
p1Window[3][1] = { id: uid(), color: 'red', value: 1 }

export const MOCK_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: '나 (You)',
    avatarHue: 45,
    window: p1Window,
    favorTokens: 4,
    score: 0,
  },
  {
    id: 'p2',
    name: 'Alessandro',
    avatarHue: 210,
    window: emptyWindow(),
    favorTokens: 3,
    score: 0,
  },
  {
    id: 'p3',
    name: 'Beatrice',
    avatarHue: 330,
    window: emptyWindow(),
    favorTokens: 4,
    score: 0,
  },
]

// Dice draft pool (6 dice for 3 players in Sagrada: 2P+1)
export const MOCK_DRAFT_POOL: Die[] = [
  { id: uid(), color: 'red', value: 4 },
  { id: uid(), color: 'blue', value: 2 },
  { id: uid(), color: 'green', value: 6 },
  { id: uid(), color: 'yellow', value: 3 },
  { id: uid(), color: 'purple', value: 5 },
  { id: uid(), color: 'red', value: 1 },
  { id: uid(), color: 'blue', value: 5 },
]

export const MOCK_PUBLIC_OBJECTIVES: ObjectiveCard[] = [
  {
    id: 'rowColorVariety',
    name: 'Row Color Variety',
    description: '가로줄에 5가지 다른 색이 모두 있으면 +6점',
    points: 6,
  },
  {
    id: 'colDarkShades',
    name: 'Column Shades of Dark',
    description: '세로줄에 1과 2가 모두 있으면 +5점',
    points: 5,
  },
  {
    id: 'diagonalColors',
    name: 'Diagonal Colors',
    description: '같은 색이 대각선으로 이어지는 각 주사위마다 +1점',
    points: 1,
  },
]

export const MOCK_PRIVATE_OBJECTIVE: ObjectiveCard = {
  id: 'privatePurple',
  name: 'Amethyst',
  description: '내 보라색 주사위 값의 합만큼 점수',
  points: 0,
}

export const MOCK_TOOLS: ToolCard[] = [
  {
    id: 'grozing',
    name: 'Grozing Pliers',
    description: '드래프트 풀 주사위 값 ±1 조정',
    used: false,
  },
  {
    id: 'copper',
    name: 'Copper Foil Burnisher',
    description: '이미 배치한 주사위를 다른 곳으로 이동 (값 조건 무시)',
    used: true,
  },
  {
    id: 'lens',
    name: 'Lens Cutter',
    description: '드래프트 풀 주사위와 라운드 트랙 주사위 교환',
    used: false,
  },
]
