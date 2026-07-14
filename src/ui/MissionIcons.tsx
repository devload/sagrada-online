import type { ReactElement } from 'react'
import type { DiceColor } from '../game/types'
import { COLOR_HEX } from '../game/types'

/**
 * Iconic mini SVGs for each objective type — inspired by Sagrada's card art.
 * Each icon is a 40×40 SVG that visually hints at what the objective checks.
 */

type IconProps = { size?: number }

const dot = (cx: number, cy: number, color: string, r = 4, key?: string | number) => (
  <circle key={key} cx={cx} cy={cy} r={r} fill={color} />
)
const cell = (x: number, y: number, color: string, w = 8, h = 8, opacity = 1, key?: string | number) => (
  <rect key={key} x={x} y={y} width={w} height={h} rx={1.5} fill={color} opacity={opacity} />
)

/** All 5 dice colors */
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'] as const

export function RowColorIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={2} y={16} width={36} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
      {COLORS.map((c, i) => cell(4 + i * 7, 17, COLOR_HEX[c], 8, 8, 1, c))}
    </svg>
  )
}

export function ColumnColorIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={16} y={2} width={8} height={36} rx={2} fill="rgba(255,255,255,0.06)" />
      {(['red', 'blue', 'green', 'yellow'] as DiceColor[]).map((c, i) =>
        cell(17, 4 + i * 8.5, COLOR_HEX[c], 8, 8, 1, c)
      )}
    </svg>
  )
}

export function RowShadeIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={2} y={14} width={36} height={12} rx={2} fill="rgba(255,255,255,0.06)" />
      {[1, 2, 3, 4, 5].map((n, i) => (
        <g key={n}>
          {cell(4 + i * 7, 15, '#EFE4C4', 6, 10, 0.15)}
          <text
            x={7 + i * 7}
            y={22}
            fontSize={7}
            fontWeight="bold"
            fill="#EFE4C4"
            textAnchor="middle"
          >
            {n}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function ColumnShadeIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={14} y={2} width={12} height={36} rx={2} fill="rgba(255,255,255,0.06)" />
      {[1, 2, 3, 4].map((n, i) => (
        <g key={n}>
          {cell(15, 4 + i * 8.5, '#EFE4C4', 10, 6, 0.15)}
          <text
            x={20}
            y={10 + i * 8.5}
            fontSize={6}
            fontWeight="bold"
            fill="#EFE4C4"
            textAnchor="middle"
          >
            {n}
          </text>
        </g>
      ))}
    </svg>
  )
}

function PairIcon({ a, b, size = 40 }: { a: number; b: number; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {/* Two dice showing a and b, side by side */}
      <rect x={4} y={12} width={14} height={14} rx={2} fill="#EFE4C4" />
      <rect x={22} y={12} width={14} height={14} rx={2} fill="#EFE4C4" />
      <text x={11} y={22} fontSize={11} fontWeight="bold" fill="#0A0713" textAnchor="middle">
        {a}
      </text>
      <text x={29} y={22} fontSize={11} fontWeight="bold" fill="#0A0713" textAnchor="middle">
        {b}
      </text>
    </svg>
  )
}

export const LightShadesIcon = (p: IconProps) => <PairIcon a={1} b={2} {...p} />
export const MediumShadesIcon = (p: IconProps) => <PairIcon a={3} b={4} {...p} />
export const DeepShadesIcon = (p: IconProps) => <PairIcon a={5} b={6} {...p} />

export function ShadeVarietyIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {[1, 2, 3, 4, 5, 6].map((n, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        return (
          <g key={n}>
            <rect x={4 + col * 11} y={8 + row * 12} width={9} height={9} rx={1.5} fill="#EFE4C4" />
            <text
              x={8.5 + col * 11}
              y={15 + row * 12}
              fontSize={7}
              fontWeight="bold"
              fill="#0A0713"
              textAnchor="middle"
            >
              {n}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function ColorVarietyIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {COLORS.map((c, i) => dot(8 + (i % 3) * 12, 12 + Math.floor(i / 3) * 12, COLOR_HEX[c], 4.5, c))}
    </svg>
  )
}

export function DiagonalsIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {[0, 1, 2, 3].map((i) => cell(4 + i * 8, 4 + i * 8, COLOR_HEX.red, 8, 8, 1, i))}
    </svg>
  )
}

/** Private objective — a single colored die */
export function PrivateIcon({ color, size = 40 }: { color: DiceColor; size?: number }) {
  const hex = COLOR_HEX[color]
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={8} y={8} width={24} height={24} rx={4} fill={hex} />
      {/* Sparkle to indicate "your" */}
      <rect x={8} y={8} width={24} height={24} rx={4} fill="url(#privateShine)" />
      <defs>
        <linearGradient id="privateShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Small pip-count dots as visual dice face */}
      {dot(14, 14, 'white', 2)}
      {dot(20, 20, 'white', 2)}
      {dot(26, 26, 'white', 2)}
    </svg>
  )
}

/** Map objective id → icon component */
export const OBJECTIVE_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  rowColorVariety: RowColorIcon,
  columnColorVariety: ColumnColorIcon,
  rowShadeVariety: RowShadeIcon,
  columnShadeVariety: ColumnShadeIcon,
  lightShades: LightShadesIcon,
  mediumShades: MediumShadesIcon,
  deepShades: DeepShadesIcon,
  shadeVariety: ShadeVarietyIcon,
  colorVariety: ColorVarietyIcon,
  diagonalsSameColor: DiagonalsIcon,
}
