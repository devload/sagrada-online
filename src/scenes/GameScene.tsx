import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Die } from '../game/types'
import { useUI } from '../store/uiStore'
import { useGame, TOTAL_ROUNDS } from '../store/gameStore'
import { ObjectivesSheet } from '../ui/ObjectivesSheet'
import { ToolsSheet } from '../ui/ToolsSheet'
import { RulesSheet } from '../ui/RulesSheet'
import { InteractiveWindow } from '../ui/InteractiveWindow'
import { DiceTray } from '../ui/DiceTray'
import { MissionStrip } from '../ui/MissionStrip'
import { ToolsRail } from '../ui/ToolsRail'
import { GameTutorialOverlay } from '../ui/GameTutorialOverlay'
import { RoundTrackSheet } from '../ui/RoundTrackSheet'
import { RoundIntro } from '../ui/RoundIntro'
import { LeftoverDiceFlight } from '../ui/LeftoverDiceFlight'
import { canPlace } from '../game/rules'
import { COLOR_HEX } from '../game/types'
import { playPlace, playError, playRoll, playBell } from '../audio/sounds'
import { AudioButton } from '../ui/AudioButton'
import { TOOL_DEFS } from '../game/tools'

export function GameScene() {
  const setScene = useUI((s) => s.setScene)
  const overlay = useUI((s) => s.overlay)
  const openOverlay = useUI((s) => s.openOverlay)
  const isDemo = useUI((s) => s.isDemo)

  const game = useGame((s) => s.game)
  const selectDie = useGame((s) => s.selectDie)
  const placeSelectedAt = useGame((s) => s.placeSelectedAt)
  const legalCellsForSelected = useGame((s) => s.legalCellsForSelected)
  const startGame = useGame((s) => s.startGame)
  const quitGame = useGame((s) => s.quitGame)
  const finishRound = useGame((s) => s.finishRound)

  // First-game tutorial (localStorage-gated)
  const TUT_KEY = 'sagrada.gameTutorialSeen'
  const [tutOpen, setTutOpen] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(TUT_KEY) !== '1'
  )
  const closeTutorial = () => {
    try { localStorage.setItem(TUT_KEY, '1') } catch {}
    setTutOpen(false)
  }

  // Round Track sheet toggle
  const [trackOpen, setTrackOpen] = useState(false)

  // Cell interaction feedback state
  const [shakeCell, setShakeCell] = useState<[number, number] | null>(null)
  const [flashCell, setFlashCell] = useState<[number, number] | null>(null)

  // Round intro animation + leftover flight — shown when round advances
  const [introRound, setIntroRound] = useState<number | null>(null)
  const [flightDice, setFlightDice] = useState<Die[]>([])

  // Refs for source (dice tray) & target (round track button) positions
  const trayRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLButtonElement>(null)

  const round = game?.round ?? null

  // Ref guards against effect firing multiple times for the same round
  // (which would cause the intro to loop/blink).
  const shownForRound = useRef<number | null>(null)

  useEffect(() => {
    if (round == null) return
    if (shownForRound.current === round) return
    shownForRound.current = round

    // Grab the just-ended round's leftover dice from the store snapshot
    const snap = useGame.getState().game
    const prevIdx = round - 2
    const leftover = prevIdx >= 0 ? (snap?.roundTrack[prevIdx] ?? []) : []

    const timers: ReturnType<typeof setTimeout>[] = []

    if (leftover.length > 0) {
      setFlightDice(leftover)
      timers.push(setTimeout(() => setFlightDice([]), 900))
    }

    const introDelay = leftover.length > 0 ? 500 : 100
    // Cathedral bell announces round change
    timers.push(setTimeout(() => { playBell() }, introDelay))
    timers.push(setTimeout(() => setIntroRound(round), introDelay))
    timers.push(setTimeout(() => setIntroRound(null), introDelay + 1400))
    // Dice roll sound plays when tray comes back
    timers.push(setTimeout(() => { playRoll() }, introDelay + 1400))

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [round])

  // If no active game and we somehow got here, start a default one.
  useEffect(() => {
    if (!game) startGame()
  }, [game, startGame])

  useEffect(() => {
    if (game?.finalScore) {
      const t = setTimeout(() => setScene('scoreboard'), 600)
      return () => clearTimeout(t)
    }
  }, [game?.finalScore, setScene])

  if (!game) {
    return (
      <div className="w-full h-full bg-cathedral-radial flex items-center justify-center text-cathedral-parchment/60 font-serif">
        준비 중…
      </div>
    )
  }

  const legal = legalCellsForSelected()
  const selected = game.draftPool.find((d) => d.id === game.selectedDieId)

  // Detect "no die can be placed anywhere" — enables PASS ROUND button
  const noValidPlacement = (() => {
    if (game.placedThisRound >= game.placementLimit) return false
    if (game.draftPool.length === 0) return false
    // If any die in tray has at least one legal cell, placement IS possible
    for (const die of game.draftPool) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          if (canPlace(game.window, game.pattern, r, c, die).ok) return false
        }
      }
    }
    return true
  })()

  const handleQuit = () => {
    quitGame()
    setScene('lobby')
  }

  return (
    <div className="relative w-full h-full bg-cathedral-radial overflow-hidden flex flex-col pt-safe pb-safe">
      {/* Ambient corner glows */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-cathedral-glow/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-dice-red/20 blur-3xl" />
      </div>

      {/* Top HUD */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-3 pb-2 gap-2 border-b border-cathedral-gold/15 bg-cathedral-void/50 backdrop-blur">
        <button
          onClick={handleQuit}
          className="glass-panel rounded-full w-9 h-9 flex items-center justify-center text-cathedral-gold hover:bg-cathedral-gold/10 transition"
          aria-label="Back"
        >
          ←
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">
          <button
            ref={trackRef}
            onClick={() => setTrackOpen(true)}
            className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-cathedral-gold/10 transition"
            title="Round Track"
          >
            <div>
              <div className="text-[9px] tracking-widest text-cathedral-gold/70">ROUND</div>
              <div className="font-serif text-cathedral-parchment text-sm leading-none mt-0.5">
                {game.round} / {TOTAL_ROUNDS}
              </div>
            </div>
            {game.roundTrack.some((r) => r.length > 0) && (
              <div className="flex flex-col items-end -mr-1">
                <div className="text-[8px] tracking-widest text-cathedral-candle leading-none">TRACK</div>
                <div className="flex gap-0.5 mt-0.5">
                  {game.roundTrack.flat().slice(-3).map((d, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{ background: COLOR_HEX[d.color] }}
                    />
                  ))}
                </div>
              </div>
            )}
          </button>
          <div className="glass-panel rounded-lg px-3 py-1.5">
            <div className="text-[9px] tracking-widest text-cathedral-gold/70">PLACE</div>
            <div className="font-serif text-cathedral-parchment text-sm leading-none mt-0.5">
              {game.placedThisRound} / {game.placementLimit}
            </div>
            {game.runningPliersPending && (
              <div className="text-[8px] tracking-widest text-dice-red mt-0.5">
                NEXT · SKIP 1
              </div>
            )}
          </div>
          {game.soloMode && game.targetScore > 0 && (
            <div
              className="glass-panel rounded-lg px-3 py-1.5"
              title="Solo Target Score — score more than this to win"
            >
              <div className="text-[9px] tracking-widest text-cathedral-gold/70">TARGET</div>
              <div className="font-serif text-cathedral-candle text-sm leading-none mt-0.5">
                {game.targetScore}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-cathedral-candle text-base leading-none">◈</span>
            <span className="font-serif text-cathedral-parchment text-sm">{game.favorTokens}</span>
          </div>
          <AudioButton />
        </div>
      </div>

      {isDemo && (
        <div className="mx-3 mt-1 flex items-center gap-1.5 rounded-md bg-cathedral-candle/15 border border-cathedral-candle/40 px-2 py-1 text-[10px] text-cathedral-parchment/85 font-serif">
          <span className="text-cathedral-candle">✧</span>
          <span><b>Demo</b> · 3라운드 연습</span>
        </div>
      )}

      {/* Always-visible mission strip (3 publics + 1 private) */}
      <MissionStrip />

      {/* Main play area — tightly packed so it fits iPhone 12 mini (375×~700 after chrome) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-3 py-2 gap-2 min-h-0">
        {/* Pattern name — single line */}
        <div className="text-center flex items-baseline gap-2">
          <span className="text-[9px] tracking-[0.3em] text-cathedral-gold/70">YOUR WINDOW ·</span>
          <span className="font-display text-base text-gold-shimmer leading-tight">
            {game.pattern.name}
          </span>
        </div>

        {/* Interactive window */}
        <InteractiveWindow
          pattern={game.pattern}
          placed={game.window}
          legalCells={selected ? legal : undefined}
          onCellTap={(r, c) => {
            // If a window-move tool is active, first tap picks source, second tap picks destination
            const activeMove = (game.activeTool && TOOL_DEFS[game.activeTool.toolId]?.moveMode === 'window')
            if (activeMove) {
              const moveFrom = game.activeTool?.moveFrom
              if (!moveFrom) {
                // Set moveFrom if cell has a placed die
                if (game.window[r][c]) {
                  useGame.setState((s) => {
                    if (s.game?.activeTool) s.game.activeTool.moveFrom = [r, c]
                  })
                  playPlace()
                }
                return
              }
              // Apply move
              useGame.getState().applyTool({ from: moveFrom, to: [r, c] })
              playPlace()
              return
            }

            const result = placeSelectedAt(r, c)
            if (result.ok) {
              playPlace()
              setFlashCell([r, c])
              setTimeout(() => setFlashCell(null), 600)
            } else {
              playError()
              setShakeCell([r, c])
              setTimeout(() => setShakeCell(null), 500)
            }
          }}
          errorMessage={game.lastError}
          shakeCell={shakeCell}
          flashCell={flashCell}
        />

        {/* Active window-move tool banner */}
        {(game.activeTool && TOOL_DEFS[game.activeTool.toolId]?.moveMode === 'window') && (() => {
          const def = TOOL_DEFS[game.activeTool!.toolId]
          const maxMoves = def.moveCount ?? 1
          const done = game.activeTool!.movesDone ?? 0
          const isMulti = maxMoves > 1
          const isTapWheel = game.activeTool!.toolId === 'tapWheel'
          const needsColor = isTapWheel && !game.activeTool!.moveColor
          return (
            <div className="mx-3 rounded-md bg-cathedral-candle/15 border border-cathedral-candle/50 px-3 py-1.5 text-[10px] text-cathedral-parchment/85 font-serif text-center flex items-center justify-between gap-2">
              <div className="flex-1 text-center">
                <b className="text-cathedral-candle">{def.name}</b>
                {isMulti && <> · <span className="text-cathedral-gold">{done}/{maxMoves} 이동</span></>}
                {isTapWheel && game.activeTool!.moveColor && (
                  <> · <span style={{ color: COLOR_HEX[game.activeTool!.moveColor] }}>{game.activeTool!.moveColor} 전용</span></>
                )}
                {' · '}
                {needsColor
                  ? '먼저 도구 시트에서 색을 골라주세요'
                  : !game.activeTool!.moveFrom
                    ? '옮길 주사위를 창문에서 탭'
                    : '이동할 목적지 칸을 탭'}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isMulti && done >= 1 && (
                  <button
                    onClick={() => useGame.getState().finalizeActiveTool()}
                    className="text-[10px] tracking-widest px-2 py-1 rounded border border-cathedral-candle/60 text-cathedral-candle hover:bg-cathedral-candle/10"
                  >
                    ✓ DONE
                  </button>
                )}
                <button
                  onClick={() => useGame.getState().cancelTool()}
                  aria-label="Cancel tool"
                  className="text-[10px] tracking-widest px-2 py-1 rounded border border-cathedral-parchment/40 text-cathedral-parchment/70 hover:bg-cathedral-parchment/10"
                >
                  ✕ CANCEL
                </button>
              </div>
            </div>
          )
        })()}

        {/* Instruction — compact */}
        <div className="text-center text-[11px] text-cathedral-parchment/70 font-serif px-2 min-h-[16px] flex items-center gap-2">
          {game.placedThisRound >= game.placementLimit ? (
            <span>다음 라운드 준비 중…</span>
          ) : noValidPlacement ? (
            <button
              onClick={() => finishRound()}
              className="bg-dice-red/25 border border-dice-red text-cathedral-parchment font-serif tracking-widest text-xs
                         px-4 py-1.5 rounded-full animate-pulse"
            >
              ⏭ 놓을 곳 없음 · PASS ROUND
            </button>
          ) : selected ? (
            legal.length > 0 ? (
              <span className="text-cathedral-candle">✧ 금색 칸을 탭해 놓으세요</span>
            ) : (
              <span className="text-dice-red">이 주사위는 놓을 곳 없음 · 다른 주사위 선택</span>
            )
          ) : (
            <span>아래에서 주사위를 골라주세요</span>
          )}
        </div>

        {/* Dice tray — hidden during ANY round-transition state:
            • while leftover dice are flying to the Round Track, AND
            • while the "Round N" intro is showing.
            When both are clear, DiceTray mounts fresh and its roll animation
            plays cleanly. */}
        <div ref={trayRef} className="w-full max-w-md">
          {introRound === null && flightDice.length === 0 ? (
            <DiceTray
              dice={game.draftPool}
              selectedId={game.selectedDieId}
              onSelect={selectDie}
              rollKey={game.round}
            />
          ) : (
            <div className="rounded-2xl px-4 py-2.5 bg-gradient-to-b from-cathedral-nave/95 to-cathedral-void border border-cathedral-gold/50 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] tracking-widest text-cathedral-gold/80">DRAFT POOL</div>
                <div className="text-[10px] text-cathedral-parchment/50">
                  {flightDice.length > 0 ? '트랙으로 이동 중…' : '준비 중…'}
                </div>
              </div>
              <div className="flex justify-center gap-4 py-1.5 min-h-[52px]" />
            </div>
          )}
        </div>

        {/* Tools rail — always visible below dice tray */}
        <div className="w-full max-w-md">
          <ToolsRail />
        </div>
      </div>

      {/* Bottom rail — Rules only (Objectives = top strip, Tools = above) */}
      <div className="relative z-10 flex items-center justify-center px-3 py-1 border-t border-cathedral-gold/15 bg-cathedral-void/70 backdrop-blur">
        <RailButton icon="?" label="How to play" onClick={() => openOverlay('rules')} />
      </div>

      {/* Game over toast */}
      <AnimatePresence>
        {game.finalScore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-cathedral-void/85 backdrop-blur"
          >
            <div className="glass-panel rounded-2xl p-8 max-w-xs mx-4 text-center shadow-gold-glow">
              <div className="text-5xl mb-3">🎉</div>
              <div className="font-display text-2xl text-gold-shimmer mb-1">Complete!</div>
              <div className="text-sm text-cathedral-parchment/80">
                최종 점수 계산 중…
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <ObjectivesSheet open={overlay === 'objectives'} onClose={() => openOverlay(null)} />
      <ToolsSheet open={overlay === 'tools'} onClose={() => openOverlay(null)} />
      <RulesSheet open={overlay === 'rules'} onClose={() => openOverlay(null)} />

      {/* First-time in-game tutorial */}
      <GameTutorialOverlay open={tutOpen} onDone={closeTutorial} />

      {/* Round Track sheet */}
      <RoundTrackSheet open={trackOpen} onClose={() => setTrackOpen(false)} />

      {/* Leftover dice → track flight */}
      <FlightPortal
        dice={flightDice}
        trayRef={trayRef}
        trackRef={trackRef}
        onDone={() => setFlightDice([])}
      />

      {/* Round N intro splash — plays automatically when round changes */}
      <RoundIntro round={introRound} />
    </div>
  )
}

function FlightPortal({
  dice, trayRef, trackRef, onDone,
}: {
  dice: Die[]
  trayRef: React.RefObject<HTMLDivElement | null>
  trackRef: React.RefObject<HTMLButtonElement | null>
  onDone: () => void
}) {
  if (dice.length === 0) return null

  const trayRect = trayRef.current?.getBoundingClientRect()
  const trackRect = trackRef.current?.getBoundingClientRect()
  if (!trayRect || !trackRect) return null

  const fromX = trayRect.left + trayRect.width / 2
  const fromY = trayRect.top + trayRect.height / 2
  const toX = trackRect.left + trackRect.width / 2
  const toY = trackRect.top + trackRect.height / 2

  return (
    <LeftoverDiceFlight
      dice={dice}
      fromX={fromX}
      fromY={fromY}
      toX={toX}
      toY={toY}
      onDone={onDone}
    />
  )
}

function RailButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-cathedral-gold/10 transition"
      title={label}
    >
      <span className="text-cathedral-candle text-sm">{icon}</span>
      <span className="text-[10px] tracking-widest text-cathedral-parchment/70">{label}</span>
    </motion.button>
  )
}
