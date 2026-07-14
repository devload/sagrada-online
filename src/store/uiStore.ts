import { create } from 'zustand'
import type { SoloDifficulty } from '../game/tools'

export type Scene =
  | 'lobby'
  | 'privateReveal'
  | 'publicReveal'
  | 'waiting'
  | 'game'
  | 'scoreboard'
export type PlayMode = 'solo' | 'demo'
export type Overlay = null | 'objectives' | 'tools' | 'rules'

const ONBOARDING_KEY = 'sagrada.onboarded'
const DIFFICULTY_KEY = 'sagrada.soloDifficulty'

type UIState = {
  scene: Scene
  mode: PlayMode
  overlay: Overlay
  /** When opening 'objectives', optionally focus on one objective id */
  overlayFocusId: string | null
  onboarded: boolean
  isDemo: boolean
  /** Solo difficulty (1 = Extreme, 5 = Easy). Determines tool count. */
  soloDifficulty: SoloDifficulty
  setScene: (s: Scene) => void
  setMode: (m: PlayMode) => void
  openOverlay: (o: Overlay, focusId?: string | null) => void
  markOnboarded: () => void
  startDemo: () => void
  endDemo: () => void
  setSoloDifficulty: (d: SoloDifficulty) => void
}

const initialOnboarded = typeof window !== 'undefined'
  ? localStorage.getItem(ONBOARDING_KEY) === '1'
  : true

const initialDifficulty: SoloDifficulty = (() => {
  if (typeof window === 'undefined') return 3
  const raw = localStorage.getItem(DIFFICULTY_KEY)
  const n = raw ? parseInt(raw, 10) : NaN
  return (n >= 1 && n <= 5 ? n : 3) as SoloDifficulty
})()

export const useUI = create<UIState>((set) => ({
  scene: 'lobby',
  mode: 'solo',
  overlay: null,
  overlayFocusId: null,
  onboarded: initialOnboarded,
  isDemo: false,
  soloDifficulty: initialDifficulty,
  setScene: (scene) => set({ scene }),
  setMode: (mode) => set({ mode }),
  openOverlay: (overlay, focusId = null) => set({ overlay, overlayFocusId: focusId }),
  markOnboarded: () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
    set({ onboarded: true })
  },
  startDemo: () => set({ mode: 'demo', isDemo: true, scene: 'game' }),
  endDemo: () => set({ isDemo: false, scene: 'lobby' }),
  setSoloDifficulty: (d) => {
    try { localStorage.setItem(DIFFICULTY_KEY, String(d)) } catch {}
    set({ soloDifficulty: d })
  },
}))
