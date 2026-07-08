import { COLOR_HEX, type PatternCard, type PlacedDie } from '../game/types'

type Props = {
  pattern: PatternCard
  placed?: PlacedDie[][]
  scale?: 'sm' | 'md' | 'lg'
  glow?: boolean
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

const GAP_CLASSES = {
  sm: 'gap-0.5 p-1',
  md: 'gap-1 p-2',
  lg: 'gap-1.5 p-3',
}

export function PatternGrid({ pattern, placed, scale = 'md', glow = false }: Props) {
  return (
    <div
      className={`inline-block rounded-lg ${GAP_CLASSES[scale]} bg-cathedral-void/70
                  border border-cathedral-gold/30 ${glow ? 'shadow-gold-glow' : 'shadow-deep'}`}
    >
      <div className={`grid grid-rows-4 grid-cols-5 ${scale === 'sm' ? 'gap-0.5' : scale === 'md' ? 'gap-1' : 'gap-1.5'}`}>
        {pattern.grid.flatMap((row, r) =>
          row.map((cell, c) => {
            const die = placed?.[r]?.[c]
            const bg =
              cell.kind === 'color' ? COLOR_HEX[cell.color]
              : cell.kind === 'value' ? '#1A1029'
              : '#12091E'
            const border =
              cell.kind === 'none' ? 'border-cathedral-parchment/10'
              : 'border-cathedral-gold/40'
            return (
              <div
                key={`${r}-${c}`}
                className={`${SIZE_CLASSES[scale]} rounded flex items-center justify-center border ${border} relative overflow-hidden`}
                style={{
                  background: die ? COLOR_HEX[die.color] : bg,
                  opacity: cell.kind === 'color' ? 0.55 : 1,
                }}
              >
                {die ? (
                  <span className="font-serif font-bold text-white drop-shadow">{die.value}</span>
                ) : cell.kind === 'value' ? (
                  <span className="font-serif text-cathedral-parchment/60">{cell.value}</span>
                ) : null}
                {/* Highlight overlay when placed */}
                {die && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none" />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
