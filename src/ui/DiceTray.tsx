import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { COLOR_HEX, type Die } from '../game/types'

type Props = {
  dice: Die[]
  selectedId: string | null
  onSelect: (dieId: string) => void
  /** Trigger rolling animation on round change */
  rollKey: number
}

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
}

function Pip({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <div
      className="absolute rounded-full bg-white"
      style={{
        width: size,
        height: size,
        left: `calc(${x * 100}% - ${size / 2}px)`,
        top: `calc(${y * 100}% - ${size / 2}px)`,
        boxShadow: '0 0 4px rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.3)',
      }}
    />
  )
}

function DieFace({ color, value, size }: { color: string; value: number; size?: number }) {
  // Auto-scale to viewport if no size given
  const dim = size ?? 52
  const pips = PIP_LAYOUTS[value] || []
  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        width: `clamp(44px, min(14vw, 8vh), ${dim}px)`,
        aspectRatio: '1',
        background: color,
        boxShadow:
          '0 8px 16px rgba(0,0,0,0.55), inset 0 -4px 8px rgba(0,0,0,0.35), inset 0 3px 5px rgba(255,255,255,0.32)',
      }}
    >
      {pips.map(([x, y], i) => (
        <Pip key={i} x={x} y={y} size={dim * 0.12} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}

/**
 * Rolling die — combines random-value flickering with a 3D-ish tumble.
 * `delay` staggers each die.
 */
function RollingDie({ die, delay }: { die: Die; delay: number }) {
  const [value, setValue] = useState<number>(1)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const rollFor = 900
    const tick = () => {
      const t = performance.now() - start
      if (t < delay) {
        raf = requestAnimationFrame(tick)
        return
      }
      const local = t - delay
      if (local < rollFor) {
        setValue(1 + Math.floor(Math.random() * 6))
        raf = requestAnimationFrame(tick)
        return
      }
      setValue(die.value)
      setSettled(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [die.value, die.id, delay])

  return (
    <div
      style={{
        perspective: 500,
        display: 'inline-block',
        position: 'relative',
      }}
    >
      {/* Ground shadow */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -6,
          width: 60,
          height: 10,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          filter: 'blur(6px)',
          transform: 'translateX(-50%)',
        }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={settled ? { scale: 1, opacity: 0.6 } : { scale: [0.7, 1, 0.7], opacity: [0.3, 0.55, 0.3] }}
        transition={settled ? { duration: 0.3 } : { duration: 0.35, repeat: Infinity }}
      />

      <motion.div
        initial={{ y: -140, rotateX: -720, rotateZ: -180, scale: 0.85, opacity: 0 }}
        animate={
          settled
            ? { y: 0, rotateX: 0, rotateZ: 0, scale: 1, opacity: 1 }
            : {
                y: [0, -18, 0, -12, 0],
                rotateX: [0, -180, -360, -540, -720],
                rotateZ: [0, 90, -90, 60, -30],
                scale: 1,
                opacity: 1,
              }
        }
        transition={
          settled
            ? { type: 'spring', damping: 12, stiffness: 220, delay: delay / 1000 }
            : {
                duration: 0.9,
                delay: delay / 1000,
                ease: 'easeOut',
                times: [0, 0.25, 0.5, 0.75, 1],
              }
        }
        style={{ transformStyle: 'preserve-3d', display: 'inline-block' }}
      >
        <DieFace color={COLOR_HEX[die.color]} value={value} />
      </motion.div>

      {/* Sparkle burst when settled */}
      {settled && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.55, delay: delay / 1000 }}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 60, height: 60,
            borderRadius: '50%',
            border: '2px solid rgba(255,240,180,0.6)',
            boxShadow: '0 0 22px rgba(245,193,94,0.55)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

export function DiceTray({ dice, selectedId, onSelect, rollKey }: Props) {
  const [rolling, setRolling] = useState(true)

  // Only trigger rolling animation when the round key changes.
  // (Removing `dice.length` from deps prevents a replay when a die is placed
  // and the pool shrinks.)
  useEffect(() => {
    setRolling(true)
    // Use a static duration based on the *initial* dice count for that round
    const rollDuration = 900 + 3 * 140 + 200 // 3 dice * 140ms stagger + tail
    const t = setTimeout(() => setRolling(false), rollDuration)
    return () => clearTimeout(t)
  }, [rollKey])

  return (
    <div className="rounded-2xl px-4 py-2.5 bg-gradient-to-b from-cathedral-nave/95 to-cathedral-void border border-cathedral-gold/50 shadow-inner">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] tracking-widest text-cathedral-gold/80">DRAFT POOL</div>
        <div className="text-[10px] text-cathedral-parchment/50">
          {rolling ? '🎲 ROLLING…' : `${dice.length}개 남음`}
        </div>
      </div>
      <div className="flex justify-center gap-4 py-1.5">
        <AnimatePresence mode="popLayout">
          {dice.map((die, i) =>
            rolling ? (
              <RollingDie key={die.id} die={die} delay={i * 140} />
            ) : (
              <motion.button
                key={die.id}
                layout
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={
                  selectedId === die.id
                    ? { scale: 1.15, opacity: 1, y: [-4, -8, -4] }
                    : { scale: 1, opacity: 1, y: 0 }
                }
                transition={
                  selectedId === die.id
                    ? { y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }
                    : { type: 'spring', damping: 15, stiffness: 260 }
                }
                exit={{ scale: 0.6, opacity: 0, y: -30, rotate: -12 }}
                whileTap={{ scale: 0.92, y: 2 }}
                whileHover={{ y: -6, rotate: [0, -3, 3, 0], transition: { rotate: { duration: 0.4 } } }}
                onClick={() => onSelect(die.id)}
                className={`relative rounded-lg ${
                  selectedId === die.id
                    ? 'ring-4 ring-cathedral-candle shadow-[0_0_32px_rgba(245,193,94,0.8)]'
                    : ''
                }`}
                style={{
                  filter: selectedId === die.id ? 'brightness(1.15) saturate(1.2)' : 'brightness(1)',
                  transition: 'filter 200ms ease',
                }}
              >
                <DieFace color={COLOR_HEX[die.color]} value={die.value} />

                {/* Selected halo — soft gold aura */}
                {selectedId === die.id && (
                  <motion.div
                    className="absolute -inset-3 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(245,193,94,0.35) 0%, transparent 70%)',
                    }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {/* Sparkle indicator when selected */}
                {selectedId === die.id && (
                  <div className="absolute -top-2 -right-2 text-cathedral-candle text-sm animate-pulse">
                    ✧
                  </div>
                )}
              </motion.button>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
