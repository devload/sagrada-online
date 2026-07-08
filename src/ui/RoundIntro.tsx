import { motion } from 'framer-motion'
import { TOTAL_ROUNDS } from '../store/gameStore'

type Props = { round: number | null }

/**
 * Full-screen "ROUND N" splash. Renders only when `round` is a number.
 * All timing (show → hide) is controlled by whoever sets `round` back to null.
 *
 * The internal children have their own opacity animation with a `times` array
 * so the whole splash fades in, holds, and fades out over ~1.4s regardless
 * of when the parent decides to remove us — no AnimatePresence needed.
 */
export function RoundIntro({ round }: Props) {
  if (round == null) return null

  return (
    <motion.div
      key={`round-${round}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.4, times: [0, 0.15, 0.75, 1], ease: 'easeInOut' }}
      className="fixed inset-0 z-[55] pointer-events-none flex items-center justify-center"
      style={{
        background: 'radial-gradient(circle at center, rgba(10,7,19,0.65), rgba(10,7,19,0.95) 70%)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="text-center relative">
        <div className="text-xs tracking-[0.5em] text-cathedral-candle mb-1 font-serif">
          ROUND
        </div>
        <motion.div
          initial={{ scale: 0.6, y: 8 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 180 }}
          className="font-display font-black text-8xl leading-none text-gold-shimmer drop-shadow-[0_0_30px_rgba(245,193,94,0.5)]"
        >
          {round}
        </motion.div>
        <div className="mt-2 text-sm tracking-[0.3em] text-cathedral-parchment/60 font-serif">
          of {TOTAL_ROUNDS}
        </div>
        <div className="mt-6 text-[10px] tracking-[0.4em] text-cathedral-gold animate-pulse">
          🎲 굴리는 중…
        </div>
      </div>
    </motion.div>
  )
}
