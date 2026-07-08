import type { PatternCard } from './types'

/**
 * localStorage-persisted game statistics.
 * Every completed game (10 rounds → final score) is appended here.
 */

const KEY = 'sagrada.stats.v1'

export type GameRecord = {
  playedAt: number  // Date.now()
  score: number
  patternId: string
  patternName: string
  publicIds: string[]
  privateColor: string
  favorTokensRemaining: number
  emptyCells: number
}

export type Stats = {
  games: GameRecord[]
}

function readStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { games: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.games)) return { games: [] }
    return parsed as Stats
  } catch {
    return { games: [] }
  }
}

function writeStats(stats: Stats) {
  try { localStorage.setItem(KEY, JSON.stringify(stats)) } catch {}
}

export function recordGame(record: GameRecord): void {
  const stats = readStats()
  stats.games.push(record)
  // Keep only the most recent 100 games
  if (stats.games.length > 100) stats.games.splice(0, stats.games.length - 100)
  writeStats(stats)
}

export function getAllGames(): GameRecord[] {
  return readStats().games
}

export function clearStats(): void {
  try { localStorage.removeItem(KEY) } catch {}
}

/* ─── Derived statistics ─────────────────────────────────── */

export type StatsSummary = {
  totalGames: number
  highScore: number
  lowScore: number
  averageScore: number
  favoritePatternName: string | null
  favoritePatternCount: number
  favoritePrivateColor: string | null
  totalPointsScored: number
}

export function summarize(games: GameRecord[] = getAllGames()): StatsSummary {
  if (games.length === 0) {
    return {
      totalGames: 0,
      highScore: 0,
      lowScore: 0,
      averageScore: 0,
      favoritePatternName: null,
      favoritePatternCount: 0,
      favoritePrivateColor: null,
      totalPointsScored: 0,
    }
  }

  const totalGames = games.length
  const highScore = Math.max(...games.map((g) => g.score))
  const lowScore = Math.min(...games.map((g) => g.score))
  const totalPointsScored = games.reduce((s, g) => s + g.score, 0)
  const averageScore = Math.round((totalPointsScored / totalGames) * 10) / 10

  // Favorite pattern
  const patternCounts: Record<string, number> = {}
  const patternNames: Record<string, string> = {}
  for (const g of games) {
    patternCounts[g.patternId] = (patternCounts[g.patternId] || 0) + 1
    patternNames[g.patternId] = g.patternName
  }
  let favoritePatternId: string | null = null
  let favoritePatternCount = 0
  for (const [id, cnt] of Object.entries(patternCounts)) {
    if (cnt > favoritePatternCount) {
      favoritePatternCount = cnt
      favoritePatternId = id
    }
  }

  // Favorite private color
  const colorCounts: Record<string, number> = {}
  for (const g of games) colorCounts[g.privateColor] = (colorCounts[g.privateColor] || 0) + 1
  let favoritePrivateColor: string | null = null
  let favoritePrivateColorCount = 0
  for (const [color, cnt] of Object.entries(colorCounts)) {
    if (cnt > favoritePrivateColorCount) {
      favoritePrivateColorCount = cnt
      favoritePrivateColor = color
    }
  }

  return {
    totalGames,
    highScore,
    lowScore,
    averageScore,
    favoritePatternName: favoritePatternId ? patternNames[favoritePatternId] : null,
    favoritePatternCount,
    favoritePrivateColor,
    totalPointsScored,
  }
}

export function recordFromGameEnd(g: {
  finalScore: number
  pattern: PatternCard
  publicIds: string[]
  privateColor: string
  favorTokensRemaining: number
  emptyCells: number
}): void {
  recordGame({
    playedAt: Date.now(),
    score: g.finalScore,
    patternId: g.pattern.id,
    patternName: g.pattern.name,
    publicIds: g.publicIds,
    privateColor: g.privateColor,
    favorTokensRemaining: g.favorTokensRemaining,
    emptyCells: g.emptyCells,
  })
}
