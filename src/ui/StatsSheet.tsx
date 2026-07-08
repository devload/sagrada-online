import { Sheet } from './Sheet'
import { clearStats, getAllGames, summarize } from '../game/stats'
import { COLOR_HEX, type DiceColor } from '../game/types'
import { useState } from 'react'

export function StatsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [refresh, setRefresh] = useState(0)
  const games = getAllGames()
  const summary = summarize(games)

  const doClear = () => {
    if (!confirm('모든 기록을 지울까요? 되돌릴 수 없어요.')) return
    clearStats()
    setRefresh((n) => n + 1)
  }

  if (summary.totalGames === 0) {
    return (
      <Sheet open={open} onClose={onClose} eyebrow="STATS" title="내 기록">
        <div className="text-center py-8">
          <div className="text-5xl mb-3 opacity-50">📊</div>
          <div className="text-cathedral-parchment/70 font-serif" style={{ wordBreak: 'keep-all' }}>
            아직 완료한 게임이 없어요.<br />
            10라운드를 완주하면 여기에 기록이 쌓여요.
          </div>
        </div>
      </Sheet>
    )
  }

  const recentGames = [...games].reverse().slice(0, 10)

  return (
    <Sheet open={open} onClose={onClose} eyebrow="STATS" title="내 기록">
      <div className="space-y-5 pb-4" key={refresh}>
        {/* Big summary tiles */}
        <div className="grid grid-cols-2 gap-2">
          <BigStat label="총 게임" value={String(summary.totalGames)} accent="candle" />
          <BigStat label="최고 점수" value={String(summary.highScore)} accent="gold" />
          <BigStat label="평균 점수" value={String(summary.averageScore)} accent="parchment" />
          <BigStat label="누적 총점" value={String(summary.totalPointsScored)} accent="parchment" />
        </div>

        {/* Favorites */}
        <div className="glass-panel rounded-xl p-4 space-y-2.5">
          <div className="text-[10px] tracking-widest text-cathedral-gold/70">즐겨찾기</div>
          <StatRow
            label="최애 패턴"
            value={summary.favoritePatternName ?? '—'}
            note={summary.favoritePatternCount ? `${summary.favoritePatternCount}회 선택` : ''}
          />
          <StatRow
            label="최애 개인 미션"
            value={
              summary.favoritePrivateColor ? (
                <span className="flex items-center gap-2 justify-end">
                  <span
                    className="w-3 h-3 rounded"
                    style={{ background: COLOR_HEX[summary.favoritePrivateColor as DiceColor] }}
                  />
                  <span className="capitalize">{summary.favoritePrivateColor}</span>
                </span>
              ) : (
                '—'
              )
            }
          />
        </div>

        {/* Recent games */}
        <div>
          <div className="text-[10px] tracking-widest text-cathedral-gold/70 mb-2 px-1">
            최근 게임 · 상위 10개
          </div>
          <div className="space-y-1.5">
            {recentGames.map((g, i) => {
              const date = new Date(g.playedAt)
              const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
              return (
                <div
                  key={g.playedAt + '-' + i}
                  className="glass-panel rounded-lg px-3 py-2 flex items-center gap-3"
                >
                  <div className="text-[9px] tracking-widest text-cathedral-gold/60 w-8 shrink-0">
                    {dateStr}
                  </div>
                  <div className="flex-1 text-cathedral-parchment text-sm font-serif truncate">
                    {g.patternName}
                  </div>
                  <div
                    className="w-3 h-3 rounded shrink-0"
                    style={{ background: COLOR_HEX[g.privateColor as DiceColor] }}
                    title={g.privateColor}
                  />
                  <div className={`font-serif font-bold text-lg ${g.score === summary.highScore ? 'text-cathedral-candle' : 'text-cathedral-parchment/85'}`}>
                    {g.score}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button
          onClick={doClear}
          className="w-full text-[10px] text-cathedral-parchment/40 hover:text-dice-red border border-cathedral-parchment/15 rounded-lg py-2 transition"
        >
          기록 모두 지우기
        </button>
      </div>
    </Sheet>
  )
}

function BigStat({
  label, value, accent,
}: { label: string; value: string; accent: 'gold' | 'candle' | 'parchment' }) {
  const c = accent === 'gold'
    ? 'text-gold-shimmer'
    : accent === 'candle'
      ? 'text-cathedral-candle'
      : 'text-cathedral-parchment'
  return (
    <div className="glass-panel rounded-xl p-3 text-center">
      <div className="text-[9px] tracking-widest text-cathedral-gold/70">{label}</div>
      <div className={`font-display text-2xl mt-1 ${c}`}>{value}</div>
    </div>
  )
}

function StatRow({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-cathedral-parchment/70 font-serif">{label}</div>
      <div className="text-cathedral-parchment font-serif flex flex-col items-end">
        <div>{value}</div>
        {note && <div className="text-[9px] text-cathedral-parchment/50">{note}</div>}
      </div>
    </div>
  )
}
