import { Sheet } from './Sheet'
import { useGame } from '../store/gameStore'
import { useUI } from '../store/uiStore'
import { canPayForTool, eligiblePaymentDice, tokenCost, TOOL_DEFS } from '../game/tools'
import { TOOL_ICONS } from './ToolIcons'
import { COLOR_HEX, type Die, type DiceColor } from '../game/types'
import { playCoin } from '../audio/sounds'

export function ToolsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const game = useGame((s) => s.game)
  const focusId = useUI((s) => s.overlayFocusId)
  const openOverlay = useUI((s) => s.openOverlay)
  const activateTool = useGame((s) => s.activateTool)
  const applyTool = useGame((s) => s.applyTool)
  const cancelTool = useGame((s) => s.cancelTool)

  if (!game) return null

  const focusedTool = focusId ? game.tools.find((t) => t.id === focusId) : null

  const eyebrow = focusedTool ? 'TOOL DETAIL' : 'TOOL CARDS'
  const title = focusedTool ? '도구 카드' : "The Artisan's Kit"

  return (
    <Sheet open={open} onClose={onClose} eyebrow={eyebrow} title={title}>
      {focusedTool ? (
        <FocusedToolCard
          tool={focusedTool}
          game={game}
          onClose={onClose}
          activateTool={activateTool}
          applyTool={applyTool}
          cancelTool={cancelTool}
          onBackToList={() => openOverlay('tools', null)}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between glass-panel rounded-xl p-3 shadow-deep">
            {game.soloMode ? (
              <div className="text-xs text-cathedral-parchment/70 font-serif leading-snug">
                <b className="text-cathedral-candle">Solo</b> — 도구는{' '}
                <b className="text-cathedral-gold">색이 같은 주사위 1개</b>로 지불하고,
                한 번 쓰면 게임에서 제외돼요.
              </div>
            ) : (
              <>
                <div className="text-xs text-cathedral-parchment/70 font-serif">
                  Favor Tokens 사용해 도구 발동. 처음 <b className="text-cathedral-gold">1</b>, 이후 <b className="text-cathedral-gold">2</b>.
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <span className="text-cathedral-candle text-2xl leading-none">◈</span>
                  <span className="font-serif text-cathedral-parchment text-xl">{game.favorTokens}</span>
                </div>
              </>
            )}
          </div>
          {game.tools.map((tool) => {
            const used = game.toolsUsed[tool.id]
            const Icon = TOOL_ICONS[tool.id]

            const affordable = game.soloMode
              ? !used && canPayForTool(game.draftPool, tool)
              : game.favorTokens >= tokenCost(used)

            return (
              <button
                key={tool.id}
                onClick={() => openOverlay('tools', tool.id)}
                className={`w-full glass-panel rounded-xl p-3 shadow-deep text-left hover:bg-cathedral-gold/5 transition
                  ${!affordable ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-20 rounded bg-cathedral-void/60 border border-cathedral-gold/40 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    {/* Top-left color band */}
                    <div
                      className="absolute top-0 left-0 w-4 h-4 rounded-br"
                      style={{ background: COLOR_HEX[tool.color] }}
                    />
                    {Icon && <Icon size={44} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-serif text-cathedral-parchment text-sm font-semibold">
                        {tool.name}
                      </div>
                      {used && (
                        <div className="text-[9px] tracking-widest text-cathedral-candle border border-cathedral-candle/40 rounded px-1.5 py-0.5">
                          {game.soloMode ? 'USED · GONE' : 'USED ONCE'}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-cathedral-parchment/70 leading-snug line-clamp-2">
                      {tool.description}
                    </div>
                    <div className="mt-1.5 text-[10px] tracking-widest text-cathedral-candle flex items-center gap-1">
                      {game.soloMode ? (
                        <>
                          <span>PAY · 1</span>
                          <span
                            className="inline-block w-3 h-3 rounded-sm border border-cathedral-parchment/40"
                            style={{ background: COLOR_HEX[tool.color] }}
                          />
                          <span className="uppercase">{tool.color}</span>
                        </>
                      ) : (
                        <>COST · {tokenCost(used)} ◈</>
                      )}
                    </div>
                  </div>
                  <div className="text-cathedral-parchment/40 text-lg">›</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}

function FocusedToolCard({
  tool,
  game,
  onClose,
  activateTool,
  applyTool,
  cancelTool,
  onBackToList,
}: {
  tool: NonNullable<ReturnType<typeof useGame.getState>['game']>['tools'][number]
  game: NonNullable<ReturnType<typeof useGame.getState>['game']>
  onClose: () => void
  activateTool: (id: string) => void
  applyTool: (payload?: unknown) => void
  cancelTool: () => void
  onBackToList: () => void
}) {
  const used = game.toolsUsed[tool.id]
  const Icon = TOOL_ICONS[tool.id]

  const cost = tokenCost(used)
  const isActive = game.activeTool?.toolId === tool.id
  const dieSelected = !!game.selectedDieId

  const affordable = game.soloMode
    ? !used && canPayForTool(game.draftPool, tool)
    : game.favorTokens >= cost

  // Running Pliers is only usable AFTER the first placement of the round
  const runningPliersTimingBad = tool.id === 'runningPliers' && game.placedThisRound !== 1

  const handleUse = () => {
    playCoin()
    // Instant-effect tools: apply immediately
    if (tool.id === 'glazingHammer' || tool.id === 'runningPliers') {
      activateTool(tool.id)
      // Apply requires activateTool to have set activeTool first, so schedule apply
      setTimeout(() => {
        useGame.getState().applyTool()
        onClose()
      }, 50)
      return
    }
    activateTool(tool.id)
    // Cork / window-move / lens cutter close the sheet so player can interact
    if (
      tool.id === 'corkStraight' ||
      tool.id === 'eglomise' ||
      tool.id === 'copperFoil' ||
      tool.id === 'lathekin' ||
      tool.id === 'tapWheel'
    ) {
      onClose()
    }
  }

  const handleFinalApply = (payload?: unknown) => {
    applyTool(payload)
    onClose()
  }

  const payButtonLabel = game.soloMode
    ? `✧ USE · 1 ${tool.color.toUpperCase()} DIE ✧`
    : `✧ USE · ${cost} FAVOR ✧`

  return (
    <div className="space-y-4 pb-4">
      <div className="glass-panel rounded-2xl p-5 shadow-deep border-cathedral-gold/40 relative overflow-hidden">
        {/* Top-left color band (mimics physical card artwork) */}
        <div
          className="absolute top-0 left-0 w-14 h-14 rounded-br-2xl border-b-2 border-r-2 border-cathedral-void/60"
          style={{ background: COLOR_HEX[tool.color] }}
          title={`Solo payment: 1 ${tool.color} die`}
        />
        <div className="text-[10px] tracking-widest text-cathedral-gold/70 mb-3 pl-12">
          ⚒ TOOL CARD
        </div>

        <div className="flex justify-center mb-4">
          <div className="w-28 h-36 rounded-lg bg-cathedral-void/70 border-2 border-cathedral-gold flex items-center justify-center shadow-inner">
            {Icon && <Icon size={90} />}
          </div>
        </div>

        <div className="text-center mb-2">
          <div className="font-display text-xl text-gold-shimmer">{tool.name}</div>
        </div>

        <div className="text-sm text-cathedral-parchment/85 font-serif text-center leading-relaxed mb-4" style={{ wordBreak: 'keep-all' }}>
          {tool.description}
        </div>

        <div className="border-t border-cathedral-gold/20 pt-3 flex items-center justify-between">
          <div className="text-xs text-cathedral-parchment/60">
            {game.soloMode ? '지불 방식' : used ? '재사용 비용' : '첫 사용'}
          </div>
          {game.soloMode ? (
            <div className="text-cathedral-candle font-serif text-sm font-bold flex items-center gap-1">
              <span>1</span>
              <span
                className="inline-block w-4 h-4 rounded border border-cathedral-parchment/40"
                style={{ background: COLOR_HEX[tool.color] }}
              />
              <span className="text-xs text-cathedral-parchment/60 ml-2 uppercase">{tool.color}</span>
            </div>
          ) : (
            <div className="text-cathedral-candle font-serif text-lg font-bold flex items-center gap-1">
              <span>{cost}</span>
              <span className="text-base">◈</span>
              <span className="text-xs text-cathedral-parchment/60 ml-2">/ 보유 {game.favorTokens}</span>
            </div>
          )}
        </div>

        {/* Solo-only warnings */}
        {game.soloMode && !used && !canPayForTool(game.draftPool, tool) && (
          <div className="mt-3 text-[11px] text-dice-red text-center font-serif">
            드래프트 풀에 {tool.color} 주사위가 없어요
          </div>
        )}
        {tool.id === 'runningPliers' && runningPliersTimingBad && !used && (
          <div className="mt-3 text-[11px] text-dice-red text-center font-serif">
            첫 픽 직후에만 사용 가능 (현재 {game.placedThisRound}회 배치)
          </div>
        )}
      </div>

      {!isActive ? (
        <>
          <button
            onClick={handleUse}
            disabled={!affordable || (tool.id === 'runningPliers' && runningPliersTimingBad)}
            className="w-full bg-gold-gradient text-cathedral-void font-serif font-bold text-lg tracking-widest
                       py-3.5 rounded-lg shadow-gold-glow hover:brightness-110 active:scale-[0.98] transition
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {payButtonLabel}
          </button>
          <button
            onClick={onBackToList}
            className="w-full border border-cathedral-parchment/25 text-cathedral-parchment/70 font-serif tracking-widest text-xs
                       py-2.5 rounded-lg hover:bg-cathedral-parchment/10 transition"
          >
            ← 다른 도구 보기
          </button>
        </>
      ) : (
        <div className="space-y-2">
          {(tool.id === 'grozing') && (
            <>
              <div className="text-center text-xs text-cathedral-candle font-serif py-2">
                {dieSelected ? '주사위 값을 조정하세요' : '먼저 트레이에서 주사위를 선택하세요'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFinalApply({ delta: 1 })}
                  disabled={!dieSelected}
                  className="bg-cathedral-candle/25 border border-cathedral-candle text-cathedral-candle font-serif font-bold text-lg tracking-widest
                             py-3 rounded-lg hover:bg-cathedral-candle/40 transition disabled:opacity-40"
                >
                  ▲ +1
                </button>
                <button
                  onClick={() => handleFinalApply({ delta: -1 })}
                  disabled={!dieSelected}
                  className="bg-cathedral-candle/25 border border-cathedral-candle text-cathedral-candle font-serif font-bold text-lg tracking-widest
                             py-3 rounded-lg hover:bg-cathedral-candle/40 transition disabled:opacity-40"
                >
                  ▼ −1
                </button>
              </div>
            </>
          )}

          {(tool.id === 'fluxBrush' || tool.id === 'fluxRemover' || tool.id === 'grindingStone') && (
            <>
              <div className="text-center text-xs text-cathedral-candle font-serif py-2">
                {dieSelected
                  ? tool.id === 'grindingStone' ? '반대 면으로 뒤집기' : '주사위를 다시 굴리기'
                  : '먼저 트레이에서 주사위를 선택하세요'}
              </div>
              <button
                onClick={() => handleFinalApply()}
                disabled={!dieSelected}
                className="w-full bg-cathedral-candle/25 border border-cathedral-candle text-cathedral-candle font-serif font-bold text-lg tracking-widest
                           py-3 rounded-lg hover:bg-cathedral-candle/40 transition disabled:opacity-40"
              >
                {tool.id === 'grindingStone' ? '🪨 FLIP' : '🎲 REROLL'}
              </button>
            </>
          )}

          {tool.id === 'lensCutter' && (
            <LensCutterTrackPicker
              game={game}
              onPick={(trackDieId) => handleFinalApply({ trackDieId })}
              dieSelected={dieSelected}
            />
          )}

          {tool.id === 'tapWheel' && !game.activeTool?.moveColor && (
            <TapWheelColorPicker game={game} />
          )}

          {/* Cancel */}
          <button
            onClick={() => { cancelTool(); onClose() }}
            className="w-full border border-cathedral-parchment/25 text-cathedral-parchment/70 font-serif tracking-widest text-xs
                       py-2.5 rounded-lg hover:bg-cathedral-parchment/10 transition"
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Solo mode: preview the payment die if one is available */}
      {game.soloMode && !used && affordable && !isActive && (
        <PaymentPreview tool={tool} pool={game.draftPool} />
      )}
    </div>
  )
}

function PaymentPreview({
  tool,
  pool,
}: {
  tool: (typeof TOOL_DEFS)[string]
  pool: Die[]
}) {
  const eligible = eligiblePaymentDice(pool, tool)
  if (eligible.length === 0) return null
  return (
    <div className="glass-panel rounded-xl p-3">
      <div className="text-[10px] tracking-widest text-cathedral-gold/70 mb-2 text-center">
        지불 가능한 주사위 · {eligible.length}개
      </div>
      <div className="flex justify-center gap-2 flex-wrap">
        {eligible.map((d) => (
          <div
            key={d.id}
            className="w-9 h-9 rounded flex items-center justify-center border border-cathedral-gold/40"
            style={{ background: COLOR_HEX[d.color] + 'CC' }}
          >
            <span className="text-white font-bold text-sm">{d.value}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-cathedral-parchment/60 text-center mt-2">
        아무 {tool.color} 주사위 1개가 자동 지불돼요
      </div>
    </div>
  )
}

function TapWheelColorPicker({
  game,
}: {
  game: NonNullable<ReturnType<typeof useGame.getState>['game']>
}) {
  const setActiveMoveColor = useGame((s) => s.setActiveMoveColor)
  // Colors present in the entire round track (Tap Wheel's constraint)
  const seen = new Set<DiceColor>()
  game.roundTrack.forEach((round) => round.forEach((d) => seen.add(d.color)))
  const colors = Array.from(seen)

  if (colors.length === 0) {
    return (
      <div className="text-center text-xs text-cathedral-parchment/60 font-serif py-2">
        Tap Wheel: 라운드 트랙에 주사위가 있어야 사용할 수 있어요
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-center text-xs text-cathedral-candle font-serif py-2">
        라운드 트랙에서 색을 하나 골라주세요 (같은 색만 이동)
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setActiveMoveColor(c)}
            className="rounded-lg py-3 border border-cathedral-gold/40 hover:border-cathedral-candle transition"
            style={{ background: COLOR_HEX[c] + '55' }}
          >
            <div className="text-white text-[10px] uppercase tracking-widest">{c}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function LensCutterTrackPicker({
  game,
  onPick,
  dieSelected,
}: {
  game: NonNullable<ReturnType<typeof useGame.getState>['game']>
  onPick: (trackDieId: string) => void
  dieSelected: boolean
}) {
  const allTrackDice: Array<{ round: number; die: Die }> = []
  game.roundTrack.forEach((roundDice, roundIdx) => {
    roundDice.forEach((die) => allTrackDice.push({ round: roundIdx, die }))
  })

  if (!dieSelected) {
    return (
      <div className="text-center text-xs text-cathedral-candle font-serif py-2">
        먼저 트레이에서 주사위를 선택하세요
      </div>
    )
  }

  if (allTrackDice.length === 0) {
    return (
      <div className="text-center text-xs text-cathedral-parchment/60 font-serif py-2">
        아직 라운드 트랙에 주사위가 없어요
      </div>
    )
  }

  return (
    <>
      <div className="text-center text-xs text-cathedral-candle font-serif py-2">
        교환할 라운드 트랙 주사위 선택
      </div>
      <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-1 bg-cathedral-void/40 rounded-lg border border-cathedral-gold/20">
        {allTrackDice.map(({ round, die }) => (
          <button
            key={die.id}
            onClick={() => onPick(die.id)}
            className="rounded flex flex-col items-center py-1 border border-cathedral-gold/30 hover:border-cathedral-candle transition"
            style={{ background: COLOR_HEX[die.color] + '88' }}
          >
            <div className="text-white font-bold text-sm">{die.value}</div>
            <div className="text-[8px] text-white/80">R{round + 1}</div>
          </button>
        ))}
      </div>
    </>
  )
}
