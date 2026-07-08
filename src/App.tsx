import { motion } from 'framer-motion'
import { useUI } from './store/uiStore'
import { LobbyScene } from './scenes/LobbyScene'
import { PrivateRevealScene } from './scenes/PrivateRevealScene'
import { PublicRevealScene } from './scenes/PublicRevealScene'
import { WaitingScene } from './scenes/WaitingScene'
import { GameScene } from './scenes/GameScene'
import { ScoreboardScene } from './scenes/ScoreboardScene'
import { SceneSwitcher } from './ui/SceneSwitcher'

/**
 * Scenes are swapped immediately (no crossfade) to avoid two R3F Canvases
 * being mounted at once — Chrome caps WebGL contexts per tab and overlap
 * triggers "Context Lost" errors.
 */
export default function App() {
  const scene = useUI((s) => s.scene)

  return (
    <div className="w-full h-full relative">
      <motion.div
        key={scene}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0"
      >
        {scene === 'lobby' && <LobbyScene />}
        {scene === 'privateReveal' && <PrivateRevealScene />}
        {scene === 'publicReveal' && <PublicRevealScene />}
        {scene === 'waiting' && <WaitingScene />}
        {scene === 'game' && <GameScene />}
        {scene === 'scoreboard' && <ScoreboardScene />}
      </motion.div>
      <SceneSwitcher />
    </div>
  )
}
