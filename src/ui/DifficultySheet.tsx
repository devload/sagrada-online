import { Sheet } from './Sheet'
import { useUI } from '../store/uiStore'
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_SUBTITLE,
  DIFFICULTY_TOOL_COUNT,
  type SoloDifficulty,
} from '../game/tools'

/**
 * Official Sagrada Solo variant difficulty picker.
 *
 * Level 1 = "Extreme Challenge" (1 tool) … Level 5 = "Easy" (5 tools).
 * The chosen level determines how many of the 12 tool cards get randomly
 * dealt into the game.
 */
export function DifficultySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chosen = useUI((s) => s.soloDifficulty)
  const setChosen = useUI((s) => s.setSoloDifficulty)

  const levels: SoloDifficulty[] = [1, 2, 3, 4, 5]

  return (
    <Sheet open={open} onClose={onClose} eyebrow="SOLO · DIFFICULTY" title="How brave today?">
      <div className="space-y-3 pb-4">
        <div className="glass-panel rounded-xl p-3 text-xs text-cathedral-parchment/70 font-serif leading-relaxed">
          공식 Solo 룰: 난이도에 따라 <b className="text-cathedral-gold">도구 카드 개수</b>가 달라집니다.
          도구는 <b className="text-cathedral-candle">드래프트 풀에서 색이 같은 주사위</b>로 지불하고,
          한 번 쓰면 게임에서 제외됩니다.
        </div>

        {levels.map((lv) => {
          const active = chosen === lv
          const count = DIFFICULTY_TOOL_COUNT[lv]
          return (
            <button
              key={lv}
              onClick={() => {
                setChosen(lv)
                // Small delay so user sees the selection change before sheet closes
                setTimeout(onClose, 220)
              }}
              className={`w-full rounded-xl p-4 text-left transition border-2
                ${active
                  ? 'bg-cathedral-gold/15 border-cathedral-gold shadow-gold-glow'
                  : 'bg-cathedral-void/40 border-cathedral-parchment/15 hover:border-cathedral-gold/50'}`}
            >
              <div className="flex items-center gap-4">
                {/* Level pill */}
                <div
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shrink-0
                    ${active ? 'border-cathedral-gold bg-cathedral-void/60' : 'border-cathedral-parchment/25 bg-cathedral-void/30'}`}
                >
                  <div className={`text-[9px] tracking-widest ${active ? 'text-cathedral-gold' : 'text-cathedral-parchment/60'}`}>
                    LV
                  </div>
                  <div
                    className={`font-display text-2xl leading-none ${active ? 'text-gold-shimmer' : 'text-cathedral-parchment/85'}`}
                  >
                    {lv}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <div className={`font-serif tracking-widest font-bold ${active ? 'text-cathedral-candle' : 'text-cathedral-parchment/90'}`}>
                      {DIFFICULTY_LABEL[lv]}
                    </div>
                    <div className="text-[10px] tracking-widest text-cathedral-gold/70">
                      · {count} TOOL{count > 1 ? 'S' : ''}
                    </div>
                  </div>
                  <div className="text-xs text-cathedral-parchment/70 mt-1 leading-snug">
                    {DIFFICULTY_SUBTITLE[lv]}
                  </div>
                  <div className="mt-1.5 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block w-6 h-1.5 rounded-full ${
                          i < count
                            ? active ? 'bg-cathedral-gold' : 'bg-cathedral-parchment/50'
                            : 'bg-cathedral-parchment/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {active && (
                  <div className="text-cathedral-gold text-lg shrink-0">✓</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
