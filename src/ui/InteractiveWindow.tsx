import { motion } from 'framer-motion'
import { COLOR_HEX, type PatternCard, type PlacedDie } from '../game/types'

type Props = {
  pattern: PatternCard
  placed: PlacedDie[][]
  legalCells?: Array<[number, number]>
  onCellTap?: (row: number, col: number) => void
  errorMessage?: string | null
  disabled?: boolean
  /** Cell that just triggered a rejection — used for shake animation */
  shakeCell?: [number, number] | null
  /** Cell that just received a die — used for placement flash */
  flashCell?: [number, number] | null
}

const isLegal = (cells: Array<[number, number]> | undefined, r: number, c: number) =>
  !!cells?.some(([rr, cc]) => rr === r && cc === c)

/**
 * 2D interactive stained-glass window.
 * Uses CSS clamp() so cells shrink on small viewports (iPhone 12 mini etc.)
 * but stay big enough to tap on larger screens.
 */
export function InteractiveWindow({
  pattern,
  placed,
  legalCells,
  onCellTap,
  errorMessage,
  disabled,
  shakeCell,
  flashCell,
}: Props) {
  const isShaking = (r: number, c: number) =>
    !!shakeCell && shakeCell[0] === r && shakeCell[1] === c
  const isFlashing = (r: number, c: number) =>
    !!flashCell && flashCell[0] === r && flashCell[1] === c
  // Cells shrink between 38px (iPhone 12 mini) and 56px (larger screens).
  // Height clamp is also used to prevent board from being too tall.
  const cellSize = 'clamp(38px, min(11vw, 7.5vh), 56px)'
  const gapSize = 'clamp(2px, 0.8vw, 5px)'

  return (
    <div className="relative">
      <div
        className="inline-block rounded-xl bg-cathedral-void/80 border-2 border-cathedral-gold/60
                   shadow-[0_0_40px_rgba(212,175,55,0.15),inset_0_0_20px_rgba(63,42,92,0.4)]"
        style={{ padding: gapSize }}
      >
        <div className="grid grid-rows-4 grid-cols-5" style={{ gap: gapSize }}>
          {pattern.grid.flatMap((row, r) =>
            row.map((cell, c) => {
              const die = placed[r]?.[c]
              const legal = isLegal(legalCells, r, c)
              const bg = cell.kind === 'color' ? COLOR_HEX[cell.color] : cell.kind === 'value' ? '#160E28' : '#0F0A1C'
              const border = legal ? 'border-cathedral-candle shadow-[0_0_16px_rgba(245,193,94,0.6)]' :
                cell.kind === 'none' ? 'border-cathedral-parchment/10' : 'border-cathedral-gold/30'

              const shaking = isShaking(r, c)
              const flashing = isFlashing(r, c)

              return (
                <motion.button
                  key={`${r}-${c}`}
                  type="button"
                  disabled={disabled || (!legal && !die) || !!die}
                  onClick={() => onCellTap && onCellTap(r, c)}
                  whileTap={{ scale: 0.9 }}
                  animate={
                    shaking
                      ? { x: [0, -6, 6, -5, 5, -3, 3, 0], scale: 1 }
                      : legal
                        ? { scale: [1, 1.05, 1] }
                        : { scale: 1, x: 0 }
                  }
                  transition={
                    shaking
                      ? { duration: 0.45 }
                      : legal
                        ? { duration: 1.4, repeat: Infinity }
                        : { duration: 0.2 }
                  }
                  className={`rounded-md flex items-center justify-center border-2 relative overflow-hidden
                    ${shaking ? '!border-dice-red !shadow-[0_0_20px_rgba(184,33,58,0.7)]' : border}
                    ${!die && !legal ? 'cursor-default' : ''}
                    ${legal ? 'cursor-pointer' : ''}
                    transition-colors`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: die ? COLOR_HEX[die.color] : bg,
                    opacity: cell.kind === 'color' && !die ? 0.55 : 1,
                  }}
                >
                  {die ? (
                    <>
                      <span className="font-serif font-bold text-white drop-shadow relative z-10"
                        style={{ fontSize: 'clamp(14px, 4.2vw, 20px)' }}>
                        {die.value}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
                    </>
                  ) : cell.kind === 'value' ? (
                    <span className="font-serif text-cathedral-parchment/70"
                      style={{ fontSize: 'clamp(13px, 3.8vw, 18px)' }}>
                      {cell.value}
                    </span>
                  ) : null}
                  {legal && !die && (
                    <div className="absolute inset-0 bg-cathedral-candle/25 pointer-events-none" />
                  )}

                  {/* Red flash overlay on shake */}
                  {shaking && (
                    <motion.div
                      className="absolute inset-0 bg-dice-red/60 pointer-events-none"
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.45 }}
                    />
                  )}

                  {/* Success flash when die is placed */}
                  {flashing && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 1, scale: 0.5 }}
                      animate={{ opacity: 0, scale: 1.6 }}
                      transition={{ duration: 0.55 }}
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255,240,180,0.9) 0%, rgba(245,193,94,0.3) 50%, transparent 80%)',
                      }}
                    />
                  )}
                </motion.button>
              )
            })
          )}
        </div>
      </div>

      {errorMessage && (
        <motion.div
          key={errorMessage}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-10 left-0 right-0 flex justify-center"
        >
          <div className="bg-dice-red/90 text-white text-xs font-serif px-3 py-1.5 rounded-full border border-dice-red shadow-lg">
            ⚠ {errorMessage}
          </div>
        </motion.div>
      )}
    </div>
  )
}
