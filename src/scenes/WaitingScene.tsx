import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useUI } from '../store/uiStore'
import { MOCK_PATTERNS } from '../game/mockData'
import { PatternGrid } from '../ui/PatternGrid'
import { useGame } from '../store/gameStore'
import { COLOR_HEX } from '../game/types'
import { WaitingMissions } from '../ui/WaitingMissions'

export function WaitingScene() {
  const setScene = useUI((s) => s.setScene)
  const startGame = useGame((s) => s.startGame)
  const setup = useGame((s) => s.setup)
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)

  const priv = setup?.private

  // Smooth-scroll the BEGIN button into view once a pattern is picked.
  // Uses block:'end' with a small padding so the button lands comfortably
  // above the safe area, not glued to the very bottom.
  const beginBtnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!selectedPattern || !beginBtnRef.current) return
    // Small delay lets the "ring/glow" selection animation kick in first.
    const t = setTimeout(() => {
      beginBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 180)
    return () => clearTimeout(t)
  }, [selectedPattern])

  const beginGame = () => {
    if (!selectedPattern) return
    startGame(selectedPattern)
    setScene('game')
  }

  // Count how many cells of the private color each pattern has (as a hint)
  const cellsForColor = (pattern: (typeof MOCK_PATTERNS)[number], color?: string) => {
    if (!color) return 0
    let n = 0
    for (const row of pattern.grid)
      for (const cell of row) if (cell.kind === 'color' && cell.color === color) n++
    return n
  }

  return (
    <div className="w-full h-full bg-cathedral-radial overflow-y-auto pt-safe pb-safe">
      <div className="min-h-full px-4 py-6 flex flex-col gap-5 max-w-md mx-auto">
        <div className="text-center relative">
          <button
            onClick={() => setScene('publicReveal')}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-cathedral-gold/40
                       text-cathedral-gold hover:bg-cathedral-gold/10 transition"
          >
            ←
          </button>
          <div className="text-xs tracking-widest text-cathedral-gold/70 mb-1">
            STEP 3 / 3 · CHOOSE PATTERN
          </div>
          <h1 className="font-display text-2xl text-gold-shimmer">
            Pick Your Window
          </h1>
        </div>

        {/* All 4 missions (3 public + 1 private) so player can strategize */}
        <WaitingMissions />

        <div>
          <div className="text-xs tracking-widest text-cathedral-gold/70 mb-2 px-1 flex items-center justify-between">
            <span>CHOOSE YOUR WINDOW</span>
            {priv && <span className="text-cathedral-candle text-[10px]">◆ = {priv.color} 칸 개수</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MOCK_PATTERNS.map((p) => {
              const selected = selectedPattern === p.id
              const colorCount = cellsForColor(p, priv?.color)
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPattern(p.id)}
                  className={`glass-panel rounded-xl p-3 flex flex-col items-center gap-2 transition
                    ${selected ? 'ring-2 ring-cathedral-gold shadow-gold-glow' : 'hover:border-cathedral-gold/50'}`}
                >
                  <PatternGrid pattern={p} scale="sm" />
                  <div className="text-cathedral-parchment font-serif text-xs text-center leading-tight">
                    {p.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-cathedral-candle">
                      {Array.from({ length: p.difficulty }).map((_, i) => (
                        <span key={i}>◆</span>
                      ))}
                    </span>
                    {priv && colorCount > 0 && (
                      <span
                        className="tracking-widest px-1.5 py-0.5 rounded border"
                        style={{
                          color: COLOR_HEX[priv.color],
                          borderColor: COLOR_HEX[priv.color] + '80',
                          background: COLOR_HEX[priv.color] + '20',
                        }}
                      >
                        {colorCount}× ◆
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] tracking-widest text-cathedral-parchment/60">
                    {p.difficulty} FAVOR ◈
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        <button
          ref={beginBtnRef}
          onClick={beginGame}
          disabled={!selectedPattern}
          className="w-full bg-gold-gradient text-cathedral-void font-serif font-bold text-lg tracking-wider
                     py-3.5 rounded-lg shadow-gold-glow
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:brightness-110 active:scale-[0.98] transition mt-1 scroll-mb-6"
        >
          BEGIN THE WORK
        </button>
      </div>

      {/* Objective card sheet — needed here so WaitingMissions taps open the focused card */}
      <WaitingObjectivesSheet />
    </div>
  )
}

/**
 * Wrapper that opens/closes the ObjectivesSheet based on ui overlay state.
 * ObjectivesSheet normally reads from `useGame().game`, but before the game
 * starts we need to render it from `setup`. We reuse the same sheet by
 * temporarily swapping in a mini "preview game" so the same components work.
 */
function WaitingObjectivesSheet() {
  const overlay = useUI((s) => s.overlay)
  const openOverlay = useUI((s) => s.openOverlay)
  const focusId = useUI((s) => s.overlayFocusId)
  const setup = useGame((s) => s.setup)

  // We create a minimal "preview" game object for the sheet to read
  // (it only touches publics/private for count/score which are pure functions on window)
  const previewGame = setup
    ? {
        // Empty 4x5 window since no dice placed yet
        window: Array.from({ length: 4 }, () => Array.from({ length: 5 }, () => null)),
        publics: setup.publics,
        private: setup.private,
      }
    : null

  // Bridge: temporarily attach the preview to gameStore.game if focused sheet is open here
  // Simpler approach: render a custom preview sheet inline
  if (!previewGame) return null

  return (
    <ObjectivesPreviewSheet
      open={overlay === 'objectives'}
      onClose={() => openOverlay(null)}
      publics={previewGame.publics}
      priv={previewGame.private}
      focusId={focusId}
      setFocus={(id) => openOverlay('objectives', id)}
    />
  )
}

/** Preview version of ObjectivesSheet that reads from setup (no game yet) */
import { Sheet } from '../ui/Sheet'
import { OBJECTIVE_ICONS, PrivateIcon } from '../ui/MissionIcons'
import type { PrivateObjective, PublicObjective } from '../game/scoring'

function ObjectivesPreviewSheet({
  open, onClose, publics, priv, focusId, setFocus,
}: {
  open: boolean; onClose: () => void
  publics: PublicObjective[]; priv: PrivateObjective
  focusId: string | null; setFocus: (id: string | null) => void
}) {
  const focused =
    focusId === `private-${priv.color}` ? { type: 'private' as const } :
    publics.find((p) => p.id === focusId) ? { type: 'public' as const, obj: publics.find((p) => p.id === focusId)! } :
    null

  const eyebrow = focused ? 'MISSION DETAIL' : 'YOUR MISSIONS'
  const title = focused ? '미션 카드' : 'Sacred Aims'

  return (
    <Sheet open={open} onClose={onClose} eyebrow={eyebrow} title={title}>
      {focused ? (
        <div className="space-y-4 pb-4">
          {focused.type === 'public' ? (
            <PreviewPublicCard obj={focused.obj} />
          ) : (
            <PreviewPrivateCard priv={priv} />
          )}
          <button
            onClick={() => setFocus(null)}
            className="w-full border border-cathedral-gold/40 text-cathedral-gold font-serif tracking-widest text-xs
                       py-2.5 rounded-lg hover:bg-cathedral-gold/10 transition"
          >
            ✦ 다른 미션도 보기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <div className="text-xs tracking-widest text-cathedral-gold/70 mb-3">✦ PUBLIC · SHARED BY ALL</div>
            <div className="space-y-2.5">
              {publics.map((obj) => {
                const Icon = OBJECTIVE_ICONS[obj.id]
                return (
                  <button
                    key={obj.id}
                    onClick={() => setFocus(obj.id)}
                    className="w-full glass-panel rounded-xl p-3 shadow-deep text-left hover:bg-cathedral-gold/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 rounded bg-cathedral-void/60 border border-cathedral-gold/40 flex items-center justify-center flex-shrink-0">
                        {Icon && <Icon size={40} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-cathedral-parchment text-sm font-semibold truncate mb-0.5">{obj.name}</div>
                        <div className="text-xs text-cathedral-parchment/70 leading-snug line-clamp-2">{obj.description}</div>
                      </div>
                      <div className="text-cathedral-candle font-serif text-sm shrink-0">+{obj.pointsPer}pt</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
          <section>
            <div className="text-xs tracking-widest text-cathedral-gold/70 mb-3">◈ PRIVATE · YOURS ALONE</div>
            <button
              onClick={() => setFocus(`private-${priv.color}`)}
              className="w-full rounded-xl p-3 shadow-gold-glow text-left border transition hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${COLOR_HEX[priv.color]}44, rgba(22,16,41,0.85))`,
                borderColor: COLOR_HEX[priv.color],
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-16 rounded flex items-center justify-center flex-shrink-0 border border-white/50" style={{ background: COLOR_HEX[priv.color] + '55' }}>
                  <PrivateIcon color={priv.color} size={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-white text-sm font-semibold mb-0.5">{priv.name}</div>
                  <div className="text-xs text-white/75 leading-snug line-clamp-2">{priv.description}</div>
                </div>
              </div>
            </button>
          </section>
        </div>
      )}
    </Sheet>
  )
}

function PreviewPublicCard({ obj }: { obj: PublicObjective }) {
  const Icon = OBJECTIVE_ICONS[obj.id]
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-deep border-cathedral-gold/40">
      <div className="text-[10px] tracking-widest text-cathedral-gold/70 mb-3">✦ PUBLIC OBJECTIVE</div>
      <div className="flex justify-center mb-4">
        <div className="w-24 h-32 rounded-lg bg-cathedral-void/70 border-2 border-cathedral-gold flex items-center justify-center shadow-inner">
          {Icon && <Icon size={70} />}
        </div>
      </div>
      <div className="text-center mb-2 font-display text-xl text-gold-shimmer">{obj.name}</div>
      <div className="text-sm text-cathedral-parchment/85 font-serif text-center leading-relaxed mb-4">{obj.description}</div>
      <div className="border-t border-cathedral-gold/20 pt-3 text-center text-cathedral-candle font-serif text-2xl font-bold">
        +{obj.pointsPer} pt
      </div>
    </div>
  )
}

function PreviewPrivateCard({ priv }: { priv: PrivateObjective }) {
  const hex = COLOR_HEX[priv.color]
  return (
    <div className="rounded-2xl p-5 shadow-gold-glow border-2 text-white"
      style={{ background: `linear-gradient(160deg, ${hex}D9 0%, rgba(22,16,41,0.95) 65%)`, borderColor: hex }}>
      <div className="text-[10px] tracking-widest text-white/85 mb-3">◈ MY PRIVATE OBJECTIVE</div>
      <div className="flex justify-center mb-4">
        <div className="w-24 h-32 rounded-lg flex items-center justify-center border-2 border-white/60"
          style={{
            background: hex,
            boxShadow: `0 0 30px ${hex}, inset 0 -6px 12px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.35)`,
          }}
        >
          <PrivateIcon color={priv.color} size={72} />
        </div>
      </div>
      <div className="text-center mb-2 font-display text-xl text-gold-shimmer">{priv.name}</div>
      <div className="text-sm text-white/90 font-serif text-center leading-relaxed mb-4">{priv.description}</div>
      <div className="border-t border-white/20 pt-3 text-center text-cathedral-candle font-serif text-lg font-bold">
        내 {priv.color} 주사위 값의 합만큼 점수
      </div>
    </div>
  )
}
