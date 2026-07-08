import { Sheet } from './Sheet'
import { useGame } from '../store/gameStore'
import { useUI } from '../store/uiStore'
import { COLOR_HEX } from '../game/types'
import { OBJECTIVE_ICONS, PrivateIcon } from './MissionIcons'

export function ObjectivesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGame((s) => s.game)
  const focusId = useUI((s) => s.overlayFocusId)
  const openOverlay = useUI((s) => s.openOverlay)

  if (!game) return null

  const publics = game.publics
  const priv = game.private
  const focused =
    focusId === `private-${priv.color}` ? { type: 'private' as const } :
    publics.find((p) => p.id === focusId) ? { type: 'public' as const, obj: publics.find((p) => p.id === focusId)! } :
    null

  const eyebrow = focused ? 'MISSION DETAIL' : 'OBJECTIVES'
  const title = focused ? '미션 카드' : 'Sacred Aims'

  return (
    <Sheet open={open} onClose={onClose} eyebrow={eyebrow} title={title}>
      {focused ? (
        // ─── FOCUS MODE — show ONLY the tapped card, big ───────
        <div className="space-y-4 pb-4">
          {focused.type === 'public' ? (
            <BigPublicCard obj={focused.obj} game={game} />
          ) : (
            <BigPrivateCard priv={priv} game={game} />
          )}

          <button
            onClick={() => openOverlay('objectives', null)}
            className="w-full border border-cathedral-gold/40 text-cathedral-gold font-serif tracking-widest text-xs
                       py-2.5 rounded-lg hover:bg-cathedral-gold/10 transition"
          >
            ✦ 다른 미션도 보기
          </button>
        </div>
      ) : (
        // ─── LIST MODE — all objectives ─────────────────────
        <div className="space-y-6">
          <section>
            <div className="text-xs tracking-widest text-cathedral-gold/70 mb-3">
              ✦ PUBLIC · SHARED BY ALL
            </div>
            <div className="space-y-2.5">
              {publics.map((obj) => {
                const cur = obj.count(game.window)
                const currentPts = cur * obj.pointsPer
                const Icon = OBJECTIVE_ICONS[obj.id]
                return (
                  <button
                    key={obj.id}
                    onClick={() => openOverlay('objectives', obj.id)}
                    className="w-full glass-panel rounded-xl p-3 shadow-deep text-left hover:bg-cathedral-gold/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 rounded bg-cathedral-void/60 border border-cathedral-gold/40 flex items-center justify-center flex-shrink-0">
                        {Icon && <Icon size={40} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="font-serif text-cathedral-parchment text-sm font-semibold truncate">
                            {obj.name}
                          </div>
                          <div className="text-cathedral-candle font-serif text-sm shrink-0 ml-2">
                            {currentPts > 0 ? `+${currentPts}pt` : `+${obj.pointsPer}pt`}
                          </div>
                        </div>
                        <div className="text-xs text-cathedral-parchment/70 leading-snug line-clamp-2">
                          {obj.description}
                        </div>
                      </div>
                      <div className="text-cathedral-parchment/40 text-lg">›</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="text-xs tracking-widest text-cathedral-gold/70 mb-3">
              ◈ PRIVATE · YOURS ALONE
            </div>
            <button
              onClick={() => openOverlay('objectives', `private-${priv.color}`)}
              className="w-full rounded-xl p-3 shadow-gold-glow text-left border transition hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${COLOR_HEX[priv.color]}44, rgba(22,16,41,0.85))`,
                borderColor: COLOR_HEX[priv.color],
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-16 rounded flex items-center justify-center flex-shrink-0 border border-white/50" style={{ background: COLOR_HEX[priv.color] + '55' }}>
                  <PrivateIcon color={priv.color} size={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-white text-sm font-semibold mb-0.5">
                    {priv.name}
                  </div>
                  <div className="text-xs text-white/75 leading-snug line-clamp-2">
                    {priv.description}
                  </div>
                  <div className="text-cathedral-candle font-serif text-sm mt-1">
                    현재 +{priv.score(game.window)}pt
                  </div>
                </div>
                <div className="text-white/60 text-lg">›</div>
              </div>
            </button>
          </section>
        </div>
      )}
    </Sheet>
  )
}

function BigPublicCard({ obj, game }: { obj: NonNullable<ReturnType<typeof useGame.getState>['game']>['publics'][number]; game: NonNullable<ReturnType<typeof useGame.getState>['game']> }) {
  const cur = obj.count(game.window)
  const pts = cur * obj.pointsPer
  const Icon = OBJECTIVE_ICONS[obj.id]
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-deep border-cathedral-gold/40">
      <div className="text-[10px] tracking-widest text-cathedral-gold/70 mb-3">
        ✦ PUBLIC OBJECTIVE
      </div>
      <div className="flex justify-center mb-4">
        <div className="w-24 h-32 rounded-lg bg-cathedral-void/70 border-2 border-cathedral-gold flex items-center justify-center shadow-inner">
          {Icon && <Icon size={70} />}
        </div>
      </div>
      <div className="text-center mb-2">
        <div className="font-display text-xl text-gold-shimmer">{obj.name}</div>
      </div>
      <div className="text-sm text-cathedral-parchment/85 font-serif text-center leading-relaxed mb-4">
        {obj.description}
      </div>
      <div className="border-t border-cathedral-gold/20 pt-3 flex items-center justify-between">
        <div className="text-xs text-cathedral-parchment/60">
          현재 만족 횟수 · <b>{cur}</b>
        </div>
        <div className="text-cathedral-candle font-serif text-2xl font-bold">
          {pts > 0 ? `+${pts}` : '0'} pt
        </div>
      </div>
    </div>
  )
}

function BigPrivateCard({ priv, game }: { priv: NonNullable<ReturnType<typeof useGame.getState>['game']>['private']; game: NonNullable<ReturnType<typeof useGame.getState>['game']> }) {
  const hex = COLOR_HEX[priv.color]
  const pts = priv.score(game.window)
  return (
    <div
      className="rounded-2xl p-5 shadow-gold-glow border-2 text-white"
      style={{
        background: `linear-gradient(160deg, ${hex}D9 0%, rgba(22,16,41,0.95) 65%)`,
        borderColor: hex,
      }}
    >
      <div className="text-[10px] tracking-widest text-white/85 mb-3">
        ◈ MY PRIVATE OBJECTIVE
      </div>
      <div className="flex justify-center mb-4">
        <div
          className="w-24 h-32 rounded-lg flex items-center justify-center border-2 border-white/60"
          style={{
            background: hex,
            boxShadow: `0 0 30px ${hex}, inset 0 -6px 12px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.35)`,
          }}
        >
          <PrivateIcon color={priv.color} size={72} />
        </div>
      </div>
      <div className="text-center mb-2">
        <div className="font-display text-xl text-gold-shimmer">{priv.name}</div>
      </div>
      <div className="text-sm text-white/90 font-serif text-center leading-relaxed mb-4">
        {priv.description}
      </div>
      <div className="border-t border-white/20 pt-3 flex items-center justify-between">
        <div className="text-xs text-white/70">
          이 색깔로 배치할 때마다 점수 상승
        </div>
        <div className="text-cathedral-candle font-serif text-2xl font-bold">
          {pts > 0 ? `+${pts}` : '0'} pt
        </div>
      </div>
    </div>
  )
}
