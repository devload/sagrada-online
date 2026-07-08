import { AnimatePresence, motion } from 'framer-motion'
import { COLOR_HEX, type Die } from '../game/types'

type Props = {
  dice: Die[]
  /** Screen-space source rect (dice tray center) */
  fromX: number
  fromY: number
  /** Screen-space target rect (round track indicator) */
  toX: number
  toY: number
  onDone: () => void
}

/**
 * Overlay that briefly renders the leftover dice flying from tray to the
 * top-HUD round track indicator. Uses a shared "flying" copy so both the
 * source (tray) and destination (track) can update state independently.
 */
export function LeftoverDiceFlight({ dice, fromX, fromY, toX, toY, onDone }: Props) {
  if (dice.length === 0) return null

  return (
    <AnimatePresence
      onExitComplete={onDone}
    >
      <div className="fixed inset-0 z-40 pointer-events-none">
        {dice.map((die, i) => {
          // Small spread from center so they don't stack
          const spread = (i - (dice.length - 1) / 2) * 18
          return (
            <motion.div
              key={die.id}
              initial={{
                left: fromX + spread,
                top: fromY,
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              animate={{
                left: toX,
                top: toY,
                opacity: [1, 1, 0.85],
                scale: [1, 1.1, 0.5],
                rotate: 360,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.9,
                delay: i * 0.08,
                ease: 'easeInOut',
                left: { duration: 0.9, ease: 'easeInOut' },
                top: { duration: 0.9, ease: [0.4, -0.1, 0.5, 1] }, // arc trajectory
              }}
              className="absolute rounded-md shadow-lg"
              style={{
                width: 32,
                height: 32,
                marginLeft: -16,
                marginTop: -16,
                background: COLOR_HEX[die.color],
                boxShadow: `0 4px 12px rgba(0,0,0,0.6), 0 0 20px ${COLOR_HEX[die.color]}88`,
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                {die.value}
              </div>
            </motion.div>
          )
        })}
      </div>
    </AnimatePresence>
  )
}
