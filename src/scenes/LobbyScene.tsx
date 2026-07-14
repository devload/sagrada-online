import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Die3D } from '../three/Die3D'
import { CathedralEnv } from '../three/CathedralEnv'
import { CanvasCleanup } from '../three/useCanvasCleanup'
import { useUI } from '../store/uiStore'
import { useGame } from '../store/gameStore'
import { OnboardingCards } from '../ui/OnboardingCards'
import { RulesSheet } from '../ui/RulesSheet'
import { PWAInstallSheet } from '../ui/PWAInstallSheet'
import { StatsSheet } from '../ui/StatsSheet'
import { DifficultySheet } from '../ui/DifficultySheet'
import { usePWA } from '../hooks/usePWA'
import type { DiceColor, DiceValue } from '../game/types'
import { DIFFICULTY_LABEL } from '../game/tools'

const HERO_DICE: { color: DiceColor; value: DiceValue; position: [number, number, number] }[] = [
  { color: 'red', value: 3, position: [-2.4, 0.3, -0.5] },
  { color: 'blue', value: 5, position: [-0.9, -0.2, 0.4] },
  { color: 'yellow', value: 6, position: [0.7, 0.5, -0.3] },
  { color: 'green', value: 2, position: [2.2, -0.1, 0.5] },
  { color: 'purple', value: 4, position: [3.7, 0.4, -0.6] },
]

function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0.5, 5.5], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} frameloop="always">
      <CanvasCleanup />
      <CathedralEnv />
      {HERO_DICE.map((d, i) => (
        <Die3D key={i} color={d.color} value={d.value} size={0.9} position={d.position} hover spin />
      ))}
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.4} radius={0.85} />
        <Vignette offset={0.25} darkness={0.8} eskil={false} />
      </EffectComposer>
    </Canvas>
  )
}

export function LobbyScene() {
  const setScene = useUI((s) => s.setScene)
  const setMode = useUI((s) => s.setMode)
  const onboarded = useUI((s) => s.onboarded)
  const markOnboarded = useUI((s) => s.markOnboarded)
  const startDemo = useUI((s) => s.startDemo)

  const [rulesOpen, setRulesOpen] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [difficultyOpen, setDifficultyOpen] = useState(false)
  const { isInstalled, canInstall, platform } = usePWA()
  const showInstallBanner = !isInstalled && (canInstall || platform === 'ios' || platform === 'android' || platform === 'desktop')

  const rollSetup = useGame((s) => s.rollSetup)
  const soloDifficulty = useUI((s) => s.soloDifficulty)
  const startSolo = () => {
    setMode('solo')
    rollSetup()
    setScene('privateReveal')
  }

  return (
    <div className="relative w-full h-full bg-cathedral-radial overflow-hidden">
      <div className="absolute inset-0 opacity-70">
        <HeroScene />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cathedral-void/60 to-cathedral-void pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-between h-full pt-safe pb-safe px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center pt-4"
        >
          <div className="text-xs tracking-[0.4em] text-cathedral-gold/80 mb-3">A GAME OF DICE DRAFTING</div>
          <h1 className="font-display font-black text-6xl leading-none text-gold-shimmer">SAGRADA</h1>
          <div className="mt-2 text-cathedral-parchment/60 font-serif italic text-sm">crafted in light and glass</div>
          {isInstalled && (
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] tracking-widest text-cathedral-candle/80 border border-cathedral-candle/40 rounded-full px-2 py-0.5">
              ✓ APP MODE
            </div>
          )}
        </motion.div>

        {showInstallBanner && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => setInstallOpen(true)}
            className="w-full max-w-md mt-4 rounded-xl px-4 py-2.5 flex items-center gap-3 text-left border border-cathedral-candle/50 bg-cathedral-candle/10 hover:bg-cathedral-candle/20 transition"
          >
            <div className="text-2xl">📲</div>
            <div className="flex-1">
              <div className="font-serif font-bold tracking-wider text-cathedral-candle text-sm">
                앱으로 설치하기
              </div>
              <div className="text-[10px] text-cathedral-parchment/70 mt-0.5">
                홈 화면에 추가하면 전체화면으로 실행 · 오프라인도 OK
              </div>
            </div>
            <div className="text-cathedral-candle text-lg">›</div>
          </motion.button>
        )}

        <div className="flex-1" />

        <AnimatePresence mode="wait">
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md glass-panel rounded-2xl p-5 shadow-deep space-y-2.5"
          >
            {!onboarded && (
              <button
                onClick={() => { markOnboarded(); startDemo() }}
                className="w-full rounded-xl px-4 py-3 flex items-center gap-3 text-left border border-cathedral-candle/50 bg-cathedral-candle/10 hover:bg-cathedral-candle/20 transition"
              >
                <div className="text-2xl">✧</div>
                <div className="flex-1">
                  <div className="font-serif font-bold tracking-wider text-cathedral-candle">TRY DEMO</div>
                  <div className="text-xs text-cathedral-parchment/70 mt-0.5">3라운드 짧은 튜토리얼</div>
                </div>
                <div className="text-lg text-cathedral-candle">›</div>
              </button>
            )}

            <MenuButton
              icon="🎲"
              title="PLAY SOLO"
              subtitle={`혼자 퍼즐 · 난이도 · ${DIFFICULTY_LABEL[soloDifficulty]} · Tools ${soloDifficulty}`}
              onClick={startSolo}
              primary
            />

            <button
              onClick={() => setDifficultyOpen(true)}
              className="w-full rounded-xl px-4 py-2.5 flex items-center gap-3 text-left border border-cathedral-gold/30 text-cathedral-parchment/85 hover:bg-cathedral-gold/10 transition"
            >
              <div className="text-xl text-cathedral-gold">⚙</div>
              <div className="flex-1">
                <div className="font-serif tracking-wider text-sm">DIFFICULTY</div>
                <div className="text-[10px] text-cathedral-parchment/60 mt-0.5">
                  {DIFFICULTY_LABEL[soloDifficulty]} · 도구 카드 {soloDifficulty}장
                </div>
              </div>
              <div className="text-lg opacity-60">›</div>
            </button>

            <div className="flex items-center justify-center gap-3 pt-1 text-xs text-cathedral-parchment/50 flex-wrap">
              <button onClick={() => setRulesOpen(true)} className="hover:text-cathedral-gold transition">
                ? How to play
              </button>
              <span className="text-cathedral-parchment/20">·</span>
              <button onClick={() => setStatsOpen(true)} className="hover:text-cathedral-gold transition">
                📊 Stats
              </button>
              <span className="text-cathedral-parchment/20">·</span>
              <button onClick={() => startDemo()} className="hover:text-cathedral-gold transition">
                ✧ Try Demo
              </button>
              <span className="text-cathedral-parchment/20">·</span>
              <a href="/manual/" target="_blank" rel="noopener" className="hover:text-cathedral-gold transition">
                📖 Manual
              </a>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="text-[10px] text-cathedral-parchment/40 mt-4 font-serif tracking-widest">
          ⛪ v0.2 · SOLO PLAYABLE
        </div>
      </div>

      <OnboardingCards open={!onboarded} onDone={markOnboarded} />
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <PWAInstallSheet open={installOpen} onClose={() => setInstallOpen(false)} />
      <StatsSheet open={statsOpen} onClose={() => setStatsOpen(false)} />
      <DifficultySheet open={difficultyOpen} onClose={() => setDifficultyOpen(false)} />
    </div>
  )
}

function MenuButton({
  icon, title, subtitle, onClick, primary,
}: {
  icon: string; title: string; subtitle: string; onClick: () => void; primary?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 flex items-center gap-4 text-left transition
        ${primary
          ? 'bg-gold-gradient text-cathedral-void shadow-gold-glow hover:brightness-110'
          : 'border border-cathedral-gold/40 text-cathedral-parchment hover:bg-cathedral-gold/10'
        }`}
    >
      <div className={`text-2xl ${primary ? '' : 'text-cathedral-gold'}`}>{icon}</div>
      <div className="flex-1">
        <div className={`font-serif font-bold tracking-wider ${primary ? '' : 'text-cathedral-parchment'}`}>{title}</div>
        <div className={`text-xs opacity-80 mt-0.5 font-serif`}>{subtitle}</div>
      </div>
      <div className="text-lg opacity-60">›</div>
    </motion.button>
  )
}
