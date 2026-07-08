import { COLOR_HEX } from '../game/types'
import { useGame } from '../store/gameStore'
import { useUI } from '../store/uiStore'
import { OBJECTIVE_ICONS, PrivateIcon } from './MissionIcons'

/**
 * Compact 4-mission strip for the pattern-selection screen.
 * Shows all 4 (3 public + 1 private) so the player can pick a pattern that
 * plays well with their goals. Tapping any opens the focused ObjectivesSheet.
 */
export function WaitingMissions() {
  const setup = useGame((s) => s.setup)
  const openOverlay = useUI((s) => s.openOverlay)
  if (!setup) return null

  const priv = setup.private
  const publics = setup.publics

  return (
    <div className="glass-panel rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-[10px] tracking-widest">
        <span className="text-cathedral-gold/80">YOUR MISSIONS</span>
        <span className="text-cathedral-parchment/50">탭하여 카드 확인</span>
      </div>
      <div className="flex items-stretch gap-1.5">
        {publics.map((obj) => {
          const Icon = OBJECTIVE_ICONS[obj.id]
          return (
            <button
              key={obj.id}
              onClick={() => openOverlay('objectives', obj.id)}
              className="bg-cathedral-void/60 rounded-md p-1.5 flex flex-col items-center justify-center gap-1 flex-1 border border-cathedral-gold/25 hover:border-cathedral-gold/50 transition active:scale-95"
              title={obj.name}
            >
              {Icon && <Icon size={30} />}
              <div className="text-[9px] tracking-widest text-cathedral-candle/80">+{obj.pointsPer}pt</div>
            </button>
          )
        })}
        <button
          onClick={() => openOverlay('objectives', `private-${priv.color}`)}
          className="rounded-md p-1.5 flex flex-col items-center justify-center gap-1 flex-1 border relative"
          style={{
            background: `linear-gradient(160deg, ${COLOR_HEX[priv.color]}55, rgba(22,16,41,0.85))`,
            borderColor: COLOR_HEX[priv.color],
            boxShadow: `0 0 10px ${COLOR_HEX[priv.color]}55`,
          }}
          title={priv.name}
        >
          <div
            className="absolute -top-0.5 -right-0.5 text-[7px] tracking-widest font-bold text-cathedral-void px-1 rounded-bl-md rounded-tr-md"
            style={{ background: COLOR_HEX[priv.color] }}
          >
            MY
          </div>
          <PrivateIcon color={priv.color} size={30} />
          <div className="text-[9px] tracking-widest text-white/85 truncate max-w-[60px]">
            {priv.name}
          </div>
        </button>
      </div>
    </div>
  )
}
