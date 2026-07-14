import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { COLOR_HEX } from '../game/types'
import { useGame } from '../store/gameStore'
import { useUI } from '../store/uiStore'
import { OBJECTIVE_ICONS, PrivateIcon } from './MissionIcons'
import { AnimatedNumber } from './AnimatedNumber'
import { playChime } from '../audio/sounds'

export function MissionStrip() {
  const game = useGame((s) => s.game)
  const openOverlay = useUI((s) => s.openOverlay)
  if (!game) return null

  const privates = game.privates?.length ? game.privates : [game.private]

  return (
    <div className="pointer-events-auto w-full border-b border-cathedral-gold/15 bg-cathedral-void/70 backdrop-blur">
      <div className="flex items-stretch gap-1 px-2 py-1">
        {game.publics.map((obj) => {
          const pts = obj.count(game.window) * obj.pointsPer
          const Icon = OBJECTIVE_ICONS[obj.id]
          return (
            <PublicBadge
              key={obj.id}
              id={obj.id}
              name={obj.name}
              pts={pts}
              Icon={Icon}
              onOpen={() => openOverlay('objectives', obj.id)}
            />
          )
        })}

        {privates.map((p) => (
          <PrivateBadge
            key={p.id}
            color={p.color}
            name={p.name}
            pts={p.score(game.window)}
            onOpen={() => openOverlay('objectives', `private-${p.color}`)}
          />
        ))}
      </div>
    </div>
  )
}

function PublicBadge({
  id, name, pts, Icon, onOpen,
}: {
  id: string
  name: string
  pts: number
  Icon: ((p: { size?: number }) => React.ReactElement) | undefined
  onOpen: () => void
}) {
  const [celebrate, setCelebrate] = useState(false)
  const prevPts = useRef(pts)
  useEffect(() => {
    if (pts > prevPts.current) {
      setCelebrate(true)
      playChime()
      const t = setTimeout(() => setCelebrate(false), 900)
      prevPts.current = pts
      return () => clearTimeout(t)
    }
    prevPts.current = pts
  }, [pts])

  return (
    <motion.button
      key={id}
      whileTap={{ scale: 0.9 }}
      animate={
        celebrate
          ? {
              scale: [1, 1.18, 1],
              boxShadow: [
                '0 0 0 rgba(245,193,94,0)',
                '0 0 24px rgba(245,193,94,0.9)',
                '0 0 0 rgba(245,193,94,0)',
              ],
            }
          : { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }
      }
      transition={{ duration: 0.85 }}
      onClick={onOpen}
      className="glass-panel rounded-md flex items-center gap-1 relative flex-1 py-0.5 px-1.5 justify-center"
      title={name}
    >
      {Icon && <Icon size={28} />}
      <div className={`text-[11px] leading-none font-serif font-bold ${pts > 0 ? 'text-cathedral-candle' : 'text-cathedral-parchment/40'}`}>
        {pts > 0 ? <AnimatedNumber value={pts} prefix="+" /> : '·'}
      </div>

      {/* Celebration sparkle burst */}
      {celebrate && (
        <>
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            initial={{ opacity: 1, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.85 }}
            style={{
              background:
                'radial-gradient(circle, rgba(255,240,180,0.9), rgba(245,193,94,0.35) 40%, transparent 70%)',
            }}
          />
          <motion.div
            className="absolute -top-1 right-1 text-cathedral-candle text-sm pointer-events-none"
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -14, scale: 1.2 }}
            transition={{ duration: 0.9 }}
          >
            ✧
          </motion.div>
        </>
      )}
    </motion.button>
  )
}

function PrivateBadge({
  color, name, pts, onOpen,
}: {
  color: keyof typeof COLOR_HEX
  name: string
  pts: number
  onOpen: () => void
}) {
  const [celebrate, setCelebrate] = useState(false)
  const prevPts = useRef(pts)
  useEffect(() => {
    if (pts > prevPts.current) {
      setCelebrate(true)
      playChime()
      const t = setTimeout(() => setCelebrate(false), 900)
      prevPts.current = pts
      return () => clearTimeout(t)
    }
    prevPts.current = pts
  }, [pts])

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      animate={
        celebrate
          ? {
              scale: [1, 1.18, 1],
              boxShadow: [
                `0 0 10px ${COLOR_HEX[color]}55`,
                `0 0 30px ${COLOR_HEX[color]}FF`,
                `0 0 10px ${COLOR_HEX[color]}55`,
              ],
            }
          : { scale: 1, boxShadow: `0 0 10px ${COLOR_HEX[color]}55` }
      }
      transition={{ duration: 0.85 }}
      onClick={onOpen}
      className="rounded-md flex items-center gap-1 relative border flex-1 py-0.5 px-1.5 justify-center"
      style={{
        background: `linear-gradient(160deg, ${COLOR_HEX[color]}55, rgba(22,16,41,0.85))`,
        borderColor: COLOR_HEX[color],
      }}
      title={name}
    >
      <div
        className="absolute -top-0.5 -right-0.5 text-[7px] tracking-widest font-bold text-cathedral-void px-1 rounded-bl-md rounded-tr-md"
        style={{ background: COLOR_HEX[color] }}
      >
        MY
      </div>
      <PrivateIcon color={color} size={28} />
      <div className={`text-[11px] leading-none font-serif font-bold ${pts > 0 ? 'text-cathedral-candle' : 'text-white/60'}`}>
        {pts > 0 ? <AnimatedNumber value={pts} prefix="+" /> : '·'}
      </div>

      {celebrate && (
        <>
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            initial={{ opacity: 1, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.85 }}
            style={{
              background: `radial-gradient(circle, rgba(255,240,180,0.9), ${COLOR_HEX[color]}66 40%, transparent 70%)`,
            }}
          />
          <motion.div
            className="absolute -top-1 right-1 text-cathedral-candle text-sm pointer-events-none"
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -14, scale: 1.2 }}
            transition={{ duration: 0.9 }}
          >
            ✧
          </motion.div>
        </>
      )}
    </motion.button>
  )
}
