import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { COLOR_HEX } from '../game/types'

type Props = { open: boolean; onDone: () => void }

/**
 * Quick in-game tutorial shown once (localStorage-gated in GameScene).
 * Three animated mini-lessons: color rule, first-die edge rule, adjacency rule.
 */
const TOTAL_STEPS = 6

export function GameTutorialOverlay({ open, onDone }: Props) {
  const [step, setStep] = useState(0)

  if (!open) return null
  const isLast = step === TOTAL_STEPS - 1

  return (
    <AnimatePresence>
      <motion.div
        key="tut"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[65] flex flex-col items-center justify-center px-6 pt-safe pb-safe"
        style={{ backgroundColor: 'rgba(10,7,19,0.94)', backdropFilter: 'blur(20px)' }}
      >
        <button
          onClick={onDone}
          className="absolute top-4 right-4 text-cathedral-parchment/60 hover:text-cathedral-parchment text-xs tracking-widest px-3 py-1.5 rounded-full border border-cathedral-parchment/25 hover:border-cathedral-parchment/50 transition"
        >
          SKIP
        </button>

        <div className="text-xs tracking-[0.3em] text-cathedral-gold/70 mb-2">
          RULES · {step + 1} / {TOTAL_STEPS}
        </div>
        <h2 className="font-display text-2xl text-gold-shimmer mb-4">
          {step < 4 ? '배치 규칙' : step === 4 ? '도구 사용' : '점수 계산'}
        </h2>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === 0 && <ColorRuleCard key="c" />}
            {step === 1 && <EdgeRuleCard key="e" />}
            {step === 2 && <AdjacencyRuleCard key="a" />}
            {step === 3 && <NoRepeatRuleCard key="n" />}
            {step === 4 && <ToolUseCard key="t" />}
            {step === 5 && <ScoringCard key="s" />}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-6 mb-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-8 bg-cathedral-gold' : 'w-2 bg-cathedral-parchment/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onDone() : setStep(step + 1))}
          className="w-full max-w-sm bg-gold-gradient text-cathedral-void font-serif font-bold text-lg tracking-wider
                     py-3 rounded-lg shadow-gold-glow hover:brightness-110 active:scale-[0.98] transition"
        >
          {isLast ? '✧ 시작하기 ✧' : 'CONTINUE →'}
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Rule cards ────────────────────────────────────────── */

function CardShell({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="glass-panel rounded-2xl p-5 shadow-deep text-center"
    >
      <div className="font-display text-lg text-gold-shimmer mb-2">{title}</div>
      {/* wordBreak: keep-all prevents Korean text from breaking mid-word */}
      <div
        className="text-[13px] text-cathedral-parchment/85 mb-5 leading-relaxed"
        style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
      >
        {body}
      </div>
      <div className="flex justify-center">{children}</div>
    </motion.div>
  )
}

/** Rule 1: Color cells accept only that color */
function ColorRuleCard() {
  return (
    <CardShell
      title="1. 색깔 규칙"
      body="색깔이 있는 칸에는 그 색 주사위만 놓을 수 있어요."
    >
      <MiniGrid
        cells={[
          { r: 0, c: 0, colorCell: 'red' },
          { r: 0, c: 1, valueCell: 3 },
          { r: 0, c: 2, colorCell: 'blue' },
          { r: 1, c: 0, empty: true },
          { r: 1, c: 1, empty: true },
          { r: 1, c: 2, empty: true },
        ]}
        overlays={[
          // Die floating above red cell — same red = OK
          { row: -1, col: 0, die: { color: 'red', v: 4 }, badge: '✓', badgeColor: '#6ad699', animate: 'landOnRed' },
          // Die floating above blue cell — wrong color = X
          { row: -1, col: 2, die: { color: 'red', v: 2 }, badge: '✗', badgeColor: '#B8213A', animate: 'bounce' },
        ]}
      />
    </CardShell>
  )
}

/** Rule 2: First die must be on edge/corner */
function EdgeRuleCard() {
  return (
    <CardShell
      title="2. 첫 배치는 테두리"
      body="첫 주사위는 창문 가장자리에만 놓을 수 있어요."
    >
      <MiniGrid
        cells={Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => ({
            r,
            c,
            empty: true,
            highlight: (r === 0 || r === 3 || c === 0 || c === 4 ? 'edge' : undefined) as 'edge' | undefined,
          }))
        ).flat()}
        rows={4}
        cols={5}
        overlays={[
          { row: 1, col: 2, die: { color: 'purple', v: 3 }, badge: '✗', badgeColor: '#B8213A' },
          { row: 0, col: 0, die: { color: 'yellow', v: 5 }, badge: '✓', badgeColor: '#6ad699', animate: 'landOnRed' },
        ]}
        cellSize={22}
      />
    </CardShell>
  )
}

/** Rule 3: Subsequent dice must touch existing die */
function AdjacencyRuleCard() {
  return (
    <CardShell
      title="3. 이후 배치는 인접"
      body="놓인 주사위 옆(대각선 포함) 8칸 중 하나에 놓아요."
    >
      <MiniGrid
        cells={[
          { r: 1, c: 2, placed: { color: 'green', v: 4 } },
          // Highlight 8 neighbors
          { r: 0, c: 1, empty: true, highlight: 'neighbor' },
          { r: 0, c: 2, empty: true, highlight: 'neighbor' },
          { r: 0, c: 3, empty: true, highlight: 'neighbor' },
          { r: 1, c: 1, empty: true, highlight: 'neighbor' },
          { r: 1, c: 3, empty: true, highlight: 'neighbor' },
          { r: 2, c: 1, empty: true, highlight: 'neighbor' },
          { r: 2, c: 2, empty: true, highlight: 'neighbor' },
          { r: 2, c: 3, empty: true, highlight: 'neighbor' },
          // Far cell
          { r: 2, c: 4, empty: true, invalid: true },
        ]}
        rows={3}
        cols={5}
        overlays={[
          { row: 2, col: 4, die: { color: 'blue', v: 2 }, badge: '✗', badgeColor: '#B8213A' },
        ]}
        cellSize={26}
      />
    </CardShell>
  )
}

/**
 * Rule 4: Same color and same value forbidden orthogonally.
 * Diagonal repetition IS allowed (important nuance).
 */
/**
 * Card 5: How to use tools + favor token cost progression.
 * Doesn't explain each tool — just how the action & cost work.
 */
function ToolUseCard() {
  return (
    <CardShell
      title="도구 사용 방법"
      body="주사위 트레이 아래 아이콘을 탭 → 카드 확인 → USE 발동."
    >
      <div className="w-full space-y-3">
        {/* Step visual */}
        <div className="flex items-center justify-around text-cathedral-parchment/85">
          <div className="text-center">
            <div className="w-11 h-11 rounded-lg border border-cathedral-gold/50 bg-cathedral-void/70 flex items-center justify-center mb-1 mx-auto">
              <span className="text-lg">⚒</span>
            </div>
            <div className="text-[9px] tracking-widest">1. TAP</div>
          </div>
          <div className="text-cathedral-gold text-lg">→</div>
          <div className="text-center">
            <div className="w-11 h-14 rounded border-2 border-cathedral-gold bg-cathedral-glow/40 flex items-center justify-center mb-1 mx-auto">
              <span className="text-[9px] text-cathedral-parchment leading-tight">CARD</span>
            </div>
            <div className="text-[9px] tracking-widest">2. READ</div>
          </div>
          <div className="text-cathedral-gold text-lg">→</div>
          <div className="text-center">
            <div className="w-11 h-11 rounded-lg bg-gold-gradient text-cathedral-void flex items-center justify-center font-bold mb-1 mx-auto text-[10px]">
              USE
            </div>
            <div className="text-[9px] tracking-widest">3. USE</div>
          </div>
        </div>

        {/* Favor cost */}
        <div className="border-t border-cathedral-gold/20 pt-3">
          <div className="text-[11px] text-cathedral-parchment/80 mb-2 font-serif">
            <b className="text-cathedral-candle">보석(Favor Token) 소모</b> — 같은 도구 기준
          </div>
          <div className="flex items-center justify-around gap-2 text-[11px]">
            <div className="flex-1 text-center rounded-lg border border-cathedral-gold/40 bg-cathedral-void/50 py-2">
              <div className="text-[9px] tracking-widest text-cathedral-gold/70">FIRST USE</div>
              <div className="mt-1 flex items-center justify-center gap-1">
                <span className="text-cathedral-candle text-lg">◈</span>
              </div>
              <div className="text-[10px] text-cathedral-parchment mt-1">1 favor</div>
            </div>
            <div className="text-cathedral-gold text-lg">→</div>
            <div className="flex-1 text-center rounded-lg border border-cathedral-gold/40 bg-cathedral-void/50 py-2">
              <div className="text-[9px] tracking-widest text-cathedral-gold/70">2ND+ USE</div>
              <div className="mt-1 flex items-center justify-center gap-1">
                <span className="text-cathedral-candle text-lg">◈</span>
                <span className="text-cathedral-candle text-lg">◈</span>
              </div>
              <div className="text-[10px] text-cathedral-parchment mt-1">2 favors</div>
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  )
}

/**
 * Card 6: Final scoring — public objectives + private objective + remaining favors − empty cells.
 */
function ScoringCard() {
  return (
    <CardShell
      title="최종 점수"
      body="10 라운드 끝나면 이 방식으로 합산해요."
    >
      <div className="w-full space-y-1.5 text-left">
        <ScoreRow icon="✦" label="공용 목표 (3장 합계)" value="+ N" note="맞춘 개수 × 카드별 배점" />
        <ScoreRow icon="◈" label="개인 목표" value="+ N" note="내 색깔 주사위 값의 합" />
        <ScoreRow icon="◆" label="남은 보석" value="+ N" note="사용 안 한 favor 하나당 +1" positive />
        <ScoreRow icon="◻" label="빈 칸" value="− N" note="배치 못한 셀 하나당 −1" negative />
        <div className="border-t border-cathedral-gold/30 mt-2 pt-2 flex items-center justify-between">
          <div className="font-serif text-cathedral-parchment font-bold text-sm">TOTAL</div>
          <div className="font-serif text-cathedral-candle font-bold text-lg">= 총점</div>
        </div>
      </div>
    </CardShell>
  )
}

function ScoreRow({
  icon, label, value, note, positive, negative,
}: {
  icon: string; label: string; value: string; note: string; positive?: boolean; negative?: boolean
}) {
  return (
    <div className="flex items-center gap-2 py-1 px-1 rounded bg-cathedral-void/30" style={{ wordBreak: 'keep-all' }}>
      <div className="w-6 h-6 rounded-md bg-cathedral-void/70 border border-cathedral-gold/40 flex items-center justify-center text-cathedral-candle text-sm shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-[11px] text-cathedral-parchment leading-tight">{label}</div>
        <div className="text-[9px] text-cathedral-parchment/55 leading-tight">{note}</div>
      </div>
      <div className={`text-[11px] font-serif font-bold whitespace-nowrap ${
        negative ? 'text-dice-red' : positive ? 'text-cathedral-candle' : 'text-cathedral-parchment/85'
      }`}>
        {value}
      </div>
    </div>
  )
}

function NoRepeatRuleCard() {
  return (
    <CardShell
      title="4. 상하좌우 중복 금지"
      body="같은 색·같은 숫자는 상하좌우 인접 불가. (대각선은 OK)"
    >
      <div className="flex flex-col items-center gap-3 w-full">
        <MiniGrid
          cells={[
            // Center red 4
            { r: 1, c: 2, placed: { color: 'red', v: 4 } },
            // Orthogonal same-color (red on left) = INVALID
            { r: 1, c: 1, empty: true, invalid: true },
            // Orthogonal same-value (blue 4 above) = INVALID
            { r: 0, c: 2, empty: true, invalid: true },
            // Orthogonal different both (blue 2 right) = OK
            { r: 1, c: 3, empty: true, highlight: 'neighbor' },
            // Diagonal same color (red 5 top-left) = OK — key nuance
            { r: 0, c: 1, empty: true, highlight: 'neighbor' },
          ]}
          rows={3}
          cols={4}
          overlays={[
            { row: 1, col: 1, die: { color: 'red', v: 6 }, badge: '✗', badgeColor: '#B8213A' },
            { row: 0, col: 2, die: { color: 'blue', v: 4 }, badge: '✗', badgeColor: '#B8213A' },
            { row: 1, col: 3, die: { color: 'blue', v: 2 }, badge: '✓', badgeColor: '#6ad699' },
            { row: 0, col: 1, die: { color: 'red', v: 5 }, badge: '✓', badgeColor: '#6ad699' },
          ]}
          cellSize={30}
        />

        {/* Legend as a clear stacked list (was cramped inline) */}
        <div
          className="w-full space-y-1 text-left text-[11px]"
          style={{ wordBreak: 'keep-all' }}
        >
          <LegendRow ok={false} label="같은 색이 좌우에 있으면 안 돼요" />
          <LegendRow ok={false} label="같은 숫자가 위·아래에 있으면 안 돼요" />
          <LegendRow ok={true} label="색·숫자 둘 다 다르면 OK" />
          <LegendRow ok={true} label="대각선은 같은 색이어도 OK" />
        </div>
      </div>
    </CardShell>
  )
}

function LegendRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span
        className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
          ok ? 'bg-[#6ad699]/25 text-[#6ad699] border border-[#6ad699]/60' : 'bg-dice-red/25 text-dice-red border border-dice-red/60'
        }`}
      >
        {ok ? '✓' : '✗'}
      </span>
      <span className="text-cathedral-parchment/80 leading-snug">{label}</span>
    </div>
  )
}

/* ─── Mini grid ────────────────────────────────────────── */

type CellSpec = {
  r: number
  c: number
  empty?: boolean
  colorCell?: keyof typeof COLOR_HEX
  valueCell?: number
  placed?: { color: keyof typeof COLOR_HEX; v: number }
  highlight?: 'edge' | 'neighbor'
  invalid?: boolean
}

type Overlay = {
  row: number
  col: number
  die: { color: keyof typeof COLOR_HEX; v: number }
  badge?: string
  badgeColor?: string
  animate?: 'bounce' | 'landOnRed'
}

function MiniGrid({
  cells,
  rows = 2,
  cols = 3,
  overlays = [],
  cellSize = 30,
}: {
  cells: CellSpec[]
  rows?: number
  cols?: number
  overlays?: Overlay[]
  cellSize?: number
}) {
  const gap = 3
  const boardWidth = cols * cellSize + (cols - 1) * gap

  const cellMap = new Map<string, CellSpec>()
  for (const c of cells) cellMap.set(`${c.r}-${c.c}`, c)

  return (
    <div
      className="relative"
      style={{ width: boardWidth, paddingTop: cellSize + gap, paddingBottom: 4 }}
    >
      <div
        className="grid rounded-md border border-cathedral-gold/40 p-1 bg-cathedral-void/70"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap,
        }}
      >
        {Array.from({ length: rows }).flatMap((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const spec = cellMap.get(`${r}-${c}`)
            let bg = '#0F0A1C'
            let border = 'rgba(212,175,55,0.2)'
            let content: React.ReactNode = null
            if (spec?.colorCell) { bg = COLOR_HEX[spec.colorCell]; border = COLOR_HEX[spec.colorCell] }
            if (spec?.valueCell != null) {
              content = <span className="text-[10px] text-cathedral-parchment/70">{spec.valueCell}</span>
            }
            if (spec?.placed) {
              bg = COLOR_HEX[spec.placed.color]
              content = <span className="text-[11px] font-bold text-white">{spec.placed.v}</span>
            }
            if (spec?.highlight === 'edge') {
              border = '#F5C15E'
            }
            if (spec?.highlight === 'neighbor') {
              border = '#6ad699'
              bg = 'rgba(106,214,153,0.15)'
            }
            if (spec?.invalid) {
              border = 'rgba(184,33,58,0.5)'
              bg = 'rgba(184,33,58,0.1)'
            }
            return (
              <div
                key={`${r}-${c}`}
                className="rounded-sm flex items-center justify-center"
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: bg,
                  border: `1.5px solid ${border}`,
                  opacity: spec?.colorCell ? 0.6 : 1,
                }}
              >
                {content}
              </div>
            )
          })
        )}
      </div>

      {/* Overlays (floating dice with badges) */}
      {overlays.map((o, i) => {
        const x = 4 + o.col * (cellSize + gap)
        const y = o.row === -1
          ? 0
          : cellSize + gap + 4 + o.row * (cellSize + gap)
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: x,
              top: y,
              width: cellSize,
              height: cellSize,
            }}
            animate={
              o.animate === 'bounce'
                ? { y: [0, -6, 0], scale: [1, 1.08, 1] }
                : o.animate === 'landOnRed'
                  ? { y: [0, cellSize + gap, cellSize + gap] }
                  : {}
            }
            transition={
              o.animate === 'bounce'
                ? { duration: 1.4, repeat: Infinity }
                : o.animate === 'landOnRed'
                  ? { duration: 2, repeat: Infinity, times: [0, 0.6, 1] }
                  : {}
            }
          >
            <div
              className="rounded-sm flex items-center justify-center relative shadow-lg"
              style={{
                width: cellSize,
                height: cellSize,
                background: COLOR_HEX[o.die.color],
                border: '1.5px solid rgba(255,255,255,0.5)',
              }}
            >
              <span className="text-[11px] font-bold text-white">{o.die.v}</span>
              {o.badge && (
                <div
                  className="absolute -top-2 -right-2 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: o.badgeColor }}
                >
                  {o.badge}
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
