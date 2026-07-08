import { Sheet } from './Sheet'
import { useGame, TOTAL_ROUNDS } from '../store/gameStore'
import { COLOR_HEX, type Die } from '../game/types'

/**
 * Round Track — visualizes each round's leftover dice (not drafted by anyone).
 * In multiplayer Sagrada these are used by Lens Cutter tool and matter for scoring;
 * in solo they mostly serve as a history/log.
 */
export function RoundTrackSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGame((s) => s.game)
  if (!game) return null

  const total = game.roundTrack.reduce((n, r) => n + r.length, 0)

  return (
    <Sheet open={open} onClose={onClose} eyebrow="ROUND TRACK" title="라운드 트랙">
      <div className="mb-4 text-xs text-cathedral-parchment/70 leading-relaxed font-serif" style={{ wordBreak: 'keep-all' }}>
        각 라운드에서 <b className="text-cathedral-parchment">드래프트되지 않은 주사위</b>가 여기에 쌓여요.
        보관된 주사위 총 <b className="text-cathedral-candle">{total}개</b>.
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
          const dice = game.roundTrack[i] || []
          const isPast = i < game.round - 1
          const isCurrent = i === game.round - 1
          const isFuture = i > game.round - 1
          return (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 flex items-center gap-3 transition
                ${isCurrent
                  ? 'border-cathedral-candle/70 bg-cathedral-candle/10'
                  : isPast
                    ? 'border-cathedral-gold/30 bg-cathedral-void/50'
                    : 'border-cathedral-parchment/10 bg-cathedral-void/25 opacity-60'}
              `}
            >
              <div className="text-[10px] tracking-widest text-cathedral-gold/80 font-serif w-14 shrink-0">
                R{i + 1}
                {isCurrent && (
                  <div className="text-[8px] text-cathedral-candle">진행중</div>
                )}
              </div>
              <div className="flex-1 flex items-center gap-1.5 flex-wrap min-h-[24px]">
                {dice.length === 0 ? (
                  <span className="text-[10px] text-cathedral-parchment/40 font-serif italic">
                    {isFuture ? '아직 진행 전' : isCurrent ? '진행 중…' : '남은 주사위 없음'}
                  </span>
                ) : (
                  dice.map((d) => <MiniDie key={d.id} die={d} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}

function MiniDie({ die }: { die: Die }) {
  return (
    <div
      className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
      style={{
        background: COLOR_HEX[die.color],
        boxShadow: 'inset 0 -2px 3px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.25)',
      }}
    >
      {die.value}
    </div>
  )
}
