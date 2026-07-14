import { motion } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { useUI } from '../store/uiStore'
import { canPayForTool, tokenCost } from '../game/tools'
import { TOOL_ICONS } from './ToolIcons'
import { COLOR_HEX } from '../game/types'

/**
 * Always-visible tools rail placed just below the dice tray.
 * Icons only. Tapping opens the ToolsSheet focused on that specific tool.
 */
export function ToolsRail() {
  const game = useGame((s) => s.game)
  const openOverlay = useUI((s) => s.openOverlay)
  if (!game) return null

  return (
    <div className="pointer-events-auto rounded-2xl bg-cathedral-void/50 border border-cathedral-gold/25 px-2 py-1.5">
      <div className="flex items-stretch justify-around gap-1.5">
        {game.tools.map((tool) => {
          const used = game.toolsUsed[tool.id]
          const isActive = game.activeTool?.toolId === tool.id
          const Icon = TOOL_ICONS[tool.id]

          // Affordability: Solo = has matching color die in pool AND not yet used.
          //                Standard = enough favor tokens.
          const affordable = game.soloMode
            ? !used && canPayForTool(game.draftPool, tool)
            : game.favorTokens >= tokenCost(used)

          const disabled = used && game.soloMode // Solo tools are single-use

          return (
            <motion.button
              key={tool.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => openOverlay('tools', tool.id)}
              disabled={(!affordable && !isActive) || disabled}
              className={`
                flex-1 rounded-lg flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 relative
                border transition
                ${isActive
                  ? 'bg-cathedral-candle/20 border-cathedral-candle shadow-[0_0_16px_rgba(245,193,94,0.5)]'
                  : affordable
                    ? 'bg-cathedral-nave/60 border-cathedral-gold/40 hover:border-cathedral-gold/70'
                    : 'bg-cathedral-nave/30 border-cathedral-parchment/15 opacity-50'}
              `}
              title={tool.name}
            >
              {isActive && (
                <div className="absolute top-0.5 right-0.5 text-[8px] tracking-widest text-cathedral-candle font-bold animate-pulse">
                  ACTIVE
                </div>
              )}
              {used && !isActive && (
                <div className="absolute top-0.5 right-0.5 text-[7px] tracking-widest text-cathedral-candle/70 font-bold">
                  USED
                </div>
              )}
              {/* Top-left color band (Solo payment color) */}
              {game.soloMode && (
                <div
                  className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full border border-cathedral-void/40"
                  style={{ background: COLOR_HEX[tool.color] }}
                  title={`Pay with 1 ${tool.color} die`}
                />
              )}
              {Icon && <Icon size={30} />}
              {game.soloMode ? (
                <div className="flex items-center gap-1 text-[9px] leading-none">
                  <div
                    className="w-2.5 h-2.5 rounded-sm border border-cathedral-parchment/40"
                    style={{ background: COLOR_HEX[tool.color] }}
                  />
                  <span className={affordable ? 'text-cathedral-parchment/80' : 'text-cathedral-parchment/40'}>
                    1
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] leading-none">
                  <span className="text-cathedral-candle">◈</span>
                  <span className={affordable ? 'text-cathedral-parchment/80' : 'text-cathedral-parchment/40'}>
                    {tokenCost(used)}
                  </span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
