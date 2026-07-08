import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useUI } from '../store/uiStore'
import { useGame } from '../store/gameStore'
import { OBJECTIVE_ICONS } from '../ui/MissionIcons'
import { StepCTA } from '../ui/StepCTA'

/**
 * Public objectives are revealed to all players face-up.
 * In original Sagrada this happens after private objectives are dealt.
 * User taps each of 3 cards to reveal it (or "Reveal All").
 */
export function PublicRevealScene() {
  const setScene = useUI((s) => s.setScene)
  const setup = useGame((s) => s.setup)
  const rollSetup = useGame((s) => s.rollSetup)
  const [revealedCount, setRevealedCount] = useState(0)

  useEffect(() => {
    if (!setup) rollSetup()
  }, [setup, rollSetup])

  const publics = setup?.publics ?? []
  if (publics.length === 0) {
    return (
      <div className="w-full h-full bg-cathedral-radial flex items-center justify-center text-cathedral-parchment/60 font-serif">
        준비 중…
      </div>
    )
  }

  const allRevealed = revealedCount >= publics.length

  return (
    <div className="w-full h-full bg-cathedral-radial overflow-hidden flex flex-col pt-safe pb-safe relative">
      {/* Ambient gold glow that intensifies as more cards reveal */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-0 left-0 right-0 h-64 bg-gradient-radial rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.35), transparent 70%)' }}
          animate={{ opacity: allRevealed ? 0.9 : 0.2 + revealedCount * 0.2 }}
          transition={{ duration: 0.6 }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => setScene('privateReveal')}
          className="w-10 h-10 rounded-full border border-cathedral-gold/40 text-cathedral-gold hover:bg-cathedral-gold/10 transition"
        >
          ←
        </button>
        <div className="text-xs tracking-[0.3em] text-cathedral-gold/70">STEP 2 / 3</div>
        <div className="w-10" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-3 gap-4 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-xs tracking-[0.4em] text-cathedral-gold/70 mb-1">SHARED GOALS</div>
          <div className="font-display text-3xl text-gold-shimmer">공용 미션</div>
          <div className="text-cathedral-parchment/70 font-serif italic text-sm mt-2 max-w-xs mx-auto">
            모두에게 공개되는 3장의 목표. 이 카드들을 만족하는 배치로 점수를 얻어요.
          </div>
        </motion.div>

        {/* 3 cards in a row (or wrap on very narrow viewports) */}
        <div className="flex gap-2.5 justify-center items-stretch w-full max-w-md flex-wrap">
          {publics.map((obj, idx) => {
            const isRevealed = idx < revealedCount
            const Icon = OBJECTIVE_ICONS[obj.id]
            return (
              <div
                key={obj.id}
                className="relative overflow-hidden rounded-lg"
                style={{
                  width: 'clamp(100px, 30vw, 132px)',
                  height: 'clamp(150px, 45vw, 200px)',
                }}
              >
                {!isRevealed ? (
                  // Face-down card
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.12 }}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02, y: -3 }}
                    onClick={() => setRevealedCount(Math.max(revealedCount, idx + 1))}
                    className="absolute inset-0 bg-gradient-to-br from-cathedral-nave to-cathedral-void border-2 border-cathedral-gold/60 shadow-deep rounded-lg flex flex-col items-center justify-center gap-2 p-2 text-center"
                  >
                    <div className="font-display text-cathedral-gold text-4xl leading-none">✦</div>
                    <div className="text-[9px] tracking-widest text-cathedral-parchment/50">
                      PUBLIC #{idx + 1}
                    </div>
                    <div className="text-[10px] tracking-widest text-cathedral-candle animate-pulse mt-1 border border-cathedral-candle/40 rounded-full px-2 py-0.5">
                      TAP
                    </div>
                  </motion.button>
                ) : (
                  // Revealed card — icon takes ~55% (top), name+desc fills rest, +Npt is a corner badge
                  <motion.div
                    key={`revealed-${obj.id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 16, stiffness: 200 }}
                    className="absolute inset-0 border-2 border-cathedral-gold shadow-gold-glow rounded-lg overflow-hidden bg-gradient-to-br from-cathedral-glow to-cathedral-void"
                  >
                    {/* +Npt corner badge — always visible, no risk of overflow */}
                    <div
                      className="absolute top-0 right-0 z-10 text-[10px] tracking-widest font-bold text-cathedral-void px-1.5 py-0.5 rounded-bl-md"
                      style={{ background: '#F5C15E' }}
                    >
                      +{obj.pointsPer}pt
                    </div>

                    <div className="absolute inset-0 flex flex-col p-1.5">
                      {/* Icon area — 55% */}
                      <div className="flex-[55] flex items-center justify-center rounded-md bg-cathedral-void/70 border border-cathedral-gold/30 mb-1.5 min-h-0 overflow-hidden">
                        {Icon && <Icon size={54} />}
                      </div>

                      {/* Text — 45% */}
                      <div className="flex-[45] flex flex-col min-h-0 overflow-hidden">
                        <div className="font-serif font-bold text-cathedral-parchment text-[10px] leading-tight line-clamp-2">
                          {obj.name}
                        </div>
                        <div className="text-[8px] text-cathedral-parchment/65 leading-snug mt-1 line-clamp-2 flex-1 overflow-hidden">
                          {obj.description}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>

        {!allRevealed && (
          <button
            onClick={() => setRevealedCount(publics.length)}
            className="text-xs text-cathedral-parchment/60 hover:text-cathedral-gold transition font-serif underline"
          >
            Reveal all
          </button>
        )}
      </div>

      <div className="relative z-10 px-6 pb-6">
        <StepCTA
          onClick={() => setScene('waiting')}
          disabled={!allRevealed}
          title="패턴 선택"
          subtitle="Step 3 · 4장의 창문 중 유리한 하나"
        />
      </div>
    </div>
  )
}
