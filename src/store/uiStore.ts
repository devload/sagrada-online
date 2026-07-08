import { create } from 'zustand'

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

type UIState = {
  scene: Scene
  mode: PlayMode
  overlay: Overlay
  /** When opening 'objectives', optionally focus on one objective id */
  overlayFocusId: string | null
  onboarded: boolean
  isDemo: boolean
  setScene: (s: Scene) => void
  setMode: (m: PlayMode) => void
  openOverlay: (o: Overlay, focusId?: string | null) => void
  markOnboarded: () => void
  startDemo: () => void
  endDemo: () => void
}

const initialOnboarded = typeof window !== 'undefined'
  ? localStorage.getItem(ONBOARDING_KEY) === '1'
  : true

export const useUI = create<UIState>((set) => ({
  scene: 'lobby',
  mode: 'solo',
  overlay: null,
  overlayFocusId: null,
  onboarded: initialOnboarded,
  isDemo: false,
  setScene: (scene) => set({ scene }),
  setMode: (mode) => set({ mode }),
  openOverlay: (overlay, focusId = null) => set({ overlay, overlayFocusId: focusId }),
  markOnboarded: () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
    set({ onboarded: true })
  },
  startDemo: () => set({ mode: 'demo', isDemo: true, scene: 'game' }),
  endDemo: () => set({ isDemo: false, scene: 'lobby' }),
}))
