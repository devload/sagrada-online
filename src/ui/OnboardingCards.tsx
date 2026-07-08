import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

type Props = { open: boolean; onDone: () => void }

const CARDS = [
  {
    icon: '🎲',
    title: 'Roll & Draft',
    body: '5색 주사위(빨/파/초/노/보)를 굴려서 트레이에 놓아요. 순서대로 하나씩 골라 자신의 스테인드글라스 창문을 채워갑니다.',
    accent: 'from-dice-red/40 to-dice-blue/40',
  },
  {
    icon: '🪟',
    title: 'Craft the Window',
    body: '4x5 = 20칸. 같은 색·같은 숫자는 상하좌우 인접 불가. 창문마다 특정 칸에 색/숫자 제약이 있어요.',
    accent: 'from-dice-green/40 to-dice-yellow/40',
  },
  {
    icon: '✦',
    title: 'Score Beautifully',
    body: '공용 목표 3장 + 개인 목표 1장 조건에 맞게 배치. 도구 카드로 특수 능력. 10라운드 후 가장 아름다운 창문의 승리.',
    accent: 'from-dice-purple/40 to-cathedral-glow/40',
  },
]

export function OnboardingCards({ open, onDone }: Props) {
  const [idx, setIdx] = useState(0)
  const isLast = idx === CARDS.length - 1

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-6 pt-safe pb-safe"
      style={{ backgroundColor: '#0A0713' }}
    >
      <button
        onClick={onDone}
        className="absolute top-4 right-4 text-cathedral-parchment/60 hover:text-cathedral-parchment text-sm tracking-widest px-3 py-1.5 rounded-full border border-cathedral-parchment/25 hover:border-cathedral-parchment/50 transition"
      >
        SKIP
      </button>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className={`glass-panel rounded-3xl p-8 w-full text-center shadow-deep bg-gradient-to-br ${CARDS[idx].accent}`}
          >
            <div className="text-6xl mb-4 animate-float">{CARDS[idx].icon}</div>
            <h2 className="font-display text-3xl text-gold-shimmer mb-3">
              {CARDS[idx].title}
            </h2>
            <p className="text-cathedral-parchment/90 leading-relaxed font-serif">
              {CARDS[idx].body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6 mt-4">
        {CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? 'w-8 bg-cathedral-gold' : 'w-2 bg-cathedral-parchment/30'
            }`}
            aria-label={`Card ${i + 1}`}
          />
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => (isLast ? onDone() : setIdx(idx + 1))}
        className="w-full max-w-sm bg-gold-gradient text-cathedral-void font-serif font-bold text-lg tracking-wider
                   py-3.5 rounded-lg shadow-gold-glow hover:brightness-110 active:scale-[0.98] transition"
      >
        {isLast ? '✧ ENTER SANCTUARY ✧' : 'CONTINUE →'}
      </button>
    </div>
  )
}
