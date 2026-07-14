import { motion } from 'framer-motion'
import { useUI } from '../store/uiStore'
import { useGame } from '../store/gameStore'

export function ScoreboardScene() {
  const setScene = useUI((s) => s.setScene)
  const game = useGame((s) => s.game)
  const quitGame = useGame((s) => s.quitGame)

  const s = game?.finalScore
  const solo = game?.soloMode ?? false
  const target = game?.targetScore ?? 0
  const soloResult = game?.soloResult ?? null
  const won = soloResult === 'win'

  const backToLobby = () => {
    quitGame()
    setScene('lobby')
  }
  const playAgain = () => {
    quitGame()
    setScene('waiting')
  }

  const goodBadge = (v: number) =>
    v > 0 ? 'text-cathedral-candle' : v < 0 ? 'text-dice-red' : 'text-cathedral-parchment/60'

  if (!game || !s) {
    return (
      <div className="w-full h-full bg-cathedral-radial flex items-center justify-center flex-col gap-4 pt-safe pb-safe">
        <div className="font-display text-3xl text-gold-shimmer">Sagrada</div>
        <div className="text-cathedral-parchment/70 font-serif">이 세션은 완료되지 않았습니다.</div>
        <button
          onClick={backToLobby}
          className="border border-cathedral-gold/50 text-cathedral-gold font-serif tracking-widest px-6 py-2 rounded-lg hover:bg-cathedral-gold/10 transition"
        >
          LOBBY
        </button>
      </div>
    )
  }

  const positive = s.total >= 0
  // In Solo mode the *win* label is authoritative; otherwise fall back to
  // "positive/negative" total judgement.
  const banner = solo ? (won ? '👑' : '🕯️') : positive ? '👑' : '🕯️'
  const bannerText = solo
    ? won
      ? '목표를 넘겼어요 — 승리!'
      : '목표 점수에 미치지 못했어요'
    : positive
    ? '아름다운 창문이 완성되었어요'
    : '조금 더 다듬어보세요'

  return (
    <div className="w-full h-full bg-cathedral-radial overflow-y-auto pt-safe pb-safe">
      <div className="min-h-full px-4 py-6 flex flex-col gap-6 max-w-md mx-auto">
        {/* Winner banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center pt-4"
        >
          <div className="text-xs tracking-[0.5em] text-cathedral-gold/70 mb-2">
            {solo ? (won ? 'MASTERPIECE COMPLETE' : 'CHALLENGE FAILED') : 'MASTERPIECE COMPLETE'}
          </div>
          <div className="text-6xl mb-2">{banner}</div>
          <div className="font-display text-3xl text-gold-shimmer">{game.pattern.name}</div>
          <div className="mt-1 text-cathedral-parchment/70 font-serif italic text-sm">
            {bannerText}
          </div>
          <div className="mt-2 font-serif text-cathedral-candle text-6xl font-bold">
            {s.total}
          </div>
          <div className="text-[10px] tracking-widest text-cathedral-parchment/50">TOTAL POINTS</div>

          {solo && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cathedral-gold/40 bg-cathedral-void/60 px-4 py-1.5">
              <span className="text-[9px] tracking-widest text-cathedral-gold/80">TARGET</span>
              <span className="font-serif text-cathedral-parchment text-sm">{target}</span>
              <span className="text-cathedral-parchment/40">·</span>
              <span
                className={
                  'text-[10px] tracking-widest ' +
                  (won ? 'text-cathedral-candle' : 'text-dice-red')
                }
              >
                {won ? `WIN (+${s.total - target})` : `LOSS (${s.total - target})`}
              </span>
            </div>
          )}
        </motion.div>

        {/* Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-5 shadow-deep space-y-2"
        >
          <div className="text-xs tracking-widest text-cathedral-gold/70 mb-2">BREAKDOWN</div>
          {s.breakdown.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-cathedral-parchment/80">{row.label}</span>
              <span className={`font-serif ${goodBadge(row.value)}`}>
                {row.value >= 0 ? '+' : ''}
                {row.value}
              </span>
            </div>
          ))}
          <div className="border-t border-cathedral-gold/20 mt-3 pt-3 flex items-center justify-between">
            <span className="font-serif text-cathedral-parchment font-semibold">TOTAL</span>
            <span className="font-serif font-bold text-cathedral-candle text-xl">
              {s.total >= 0 ? '+' : ''}
              {s.total}
            </span>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={backToLobby}
            className="border border-cathedral-parchment/30 text-cathedral-parchment font-serif tracking-widest text-sm
                       py-3 rounded-lg hover:bg-cathedral-parchment/10 transition"
          >
            ← LOBBY
          </button>
          <button
            onClick={playAgain}
            className="bg-gold-gradient text-cathedral-void font-serif font-bold tracking-widest text-sm
                       py-3 rounded-lg shadow-gold-glow hover:brightness-110 active:scale-[0.98] transition"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  )
}
