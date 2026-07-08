import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { COLOR_HEX } from '../game/types'
import { useUI } from '../store/uiStore'
import { useGame } from '../store/gameStore'
import { StepCTA } from '../ui/StepCTA'

/**
 * Private objective is revealed BEFORE pattern selection.
 * Matches original Sagrada rules — knowing the private color shapes the pattern pick.
 */
export function PrivateRevealScene() {
  const setScene = useUI((s) => s.setScene)
  const setup = useGame((s) => s.setup)
  const rollSetup = useGame((s) => s.rollSetup)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!setup) rollSetup()
  }, [setup, rollSetup])

  const priv = setup?.private
  if (!priv) {
    return (
      <div className="w-full h-full bg-cathedral-radial flex items-center justify-center text-cathedral-parchment/60 font-serif">
        준비 중…
      </div>
    )
  }

  const hex = COLOR_HEX[priv.color]

  return (
    <div className="w-full h-full bg-cathedral-radial overflow-hidden flex flex-col pt-safe pb-safe relative">
      {/* Corner ambient glow, brightens when revealed */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl"
          style={{ background: hex }}
          animate={{ opacity: revealed ? 0.55 : 0.08 }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => setScene('lobby')}
          className="w-10 h-10 rounded-full border border-cathedral-gold/40 text-cathedral-gold hover:bg-cathedral-gold/10 transition"
        >
          ←
        </button>
        <div className="text-xs tracking-[0.3em] text-cathedral-gold/70">STEP 1 / 3</div>
        <div className="w-10" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-xs tracking-[0.4em] text-cathedral-gold/70 mb-1">YOUR SECRET GOAL</div>
          <div className="font-display text-3xl text-gold-shimmer">개인 미션</div>
          <div className="text-cathedral-parchment/70 font-serif italic text-sm mt-2 max-w-xs mx-auto">
            원작 룰: 개인 미션 색깔을 먼저 확인한 뒤 <b className="text-cathedral-parchment">유리한 패턴</b>을 고르세요.
          </div>
        </motion.div>

        {/* Card container - only ONE side is visible at a time */}
        <div className="relative w-56 h-80">
          {/* Sealed side */}
          {!revealed && (
            <motion.button
              onClick={() => setRevealed(true)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cathedral-nave to-cathedral-void border-2 border-cathedral-gold shadow-gold-glow flex flex-col items-center justify-center text-center gap-3 p-6"
            >
              <motion.div
                animate={{ rotateY: [0, 12, -12, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl"
              >
                🕯️
              </motion.div>
              <div className="font-display text-lg text-gold-shimmer">Sealed Envelope</div>
              <div className="text-xs text-cathedral-parchment/70 font-serif leading-relaxed">
                탭하여 개봉하세요.<br/>이 미션은 오직 당신만 볼 수 있어요.
              </div>
              <div className="text-[10px] tracking-widest text-cathedral-candle mt-2 border border-cathedral-candle/50 rounded-full px-3 py-1 animate-pulse">
                TAP TO REVEAL
              </div>
            </motion.button>
          )}

          {/* Revealed side — simple fade + scale (no 3D rotate that flakes on Framer) */}
          {revealed && (
            <motion.div
              key="revealed-card"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="absolute inset-0 rounded-2xl border-2 border-cathedral-gold shadow-gold-glow flex flex-col items-center justify-center text-center gap-3 p-6"
              style={{
                background: `linear-gradient(160deg, ${hex}D9 0%, rgba(22,16,41,0.95) 65%)`,
              }}
            >
              <div className="text-[10px] tracking-[0.3em] text-white/85">PRIVATE OBJECTIVE</div>
              <div
                className="w-20 h-20 rounded-xl border-2 border-white/60 flex items-center justify-center text-4xl font-serif font-bold text-white"
                style={{
                  background: hex,
                  boxShadow: `0 0 30px ${hex}, inset 0 -6px 12px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.35)`,
                }}
              >
                ◈
              </div>
              <div className="font-display text-2xl text-gold-shimmer">{priv.name}</div>
              <div className="text-xs text-white/90 font-serif leading-relaxed">
                내 <b>{priv.color}</b> 주사위 값의 합만큼 점수
              </div>
              <div className="text-[10px] tracking-widest text-cathedral-candle border border-cathedral-candle/60 rounded-full px-3 py-1 mt-1">
                이 색 위주로 배치하세요
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="relative z-10 px-6 pb-6">
        <StepCTA
          onClick={() => setScene('publicReveal')}
          disabled={!revealed}
          title="공용 미션 확인"
          subtitle="Step 2 · 모두에게 공개되는 3장의 목표"
        />
      </div>
    </div>
  )
}
