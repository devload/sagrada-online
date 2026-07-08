import type { ReactElement } from 'react'
import { COLOR_HEX } from '../game/types'

type IconProps = { size?: number }

const die = (x: number, y: number, w: number, h: number, color: string, pip = false) => (
  <>
    <rect x={x} y={y} width={w} height={h} rx={1.5} fill={color} />
    {pip && <circle cx={x + w / 2} cy={y + h / 2} r={1.5} fill="white" />}
  </>
)

/** Grozing Pliers — value ±1 */
export function GrozingIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={13} y={13} width={14} height={14} rx={2} fill={COLOR_HEX.yellow} />
      <circle cx={20} cy={20} r={2} fill="white" />
      <path d="M 6 22 L 6 12 M 3 15 L 6 12 L 9 15" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <text x={6} y={30} fontSize={7} fontWeight="bold" fill="#F5C15E" textAnchor="middle">+1</text>
      <path d="M 34 12 L 34 22 M 31 19 L 34 22 L 37 19" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <text x={34} y={30} fontSize={7} fontWeight="bold" fill="#F5C15E" textAnchor="middle">-1</text>
    </svg>
  )
}

/** Flux Brush — re-roll one drafted die */
export function FluxBrushIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <path d="M 8 20 A 12 12 0 1 1 20 32" stroke="#F5C15E" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d="M 17 30 L 20 32 L 20 28" stroke="#F5C15E" strokeWidth={2} fill="#F5C15E" strokeLinejoin="round" />
      <rect x={14} y={14} width={12} height={12} rx={1.5} fill={COLOR_HEX.blue} />
      <circle cx={18} cy={18} r={1.4} fill="white" />
      <circle cx={22} cy={22} r={1.4} fill="white" />
      <circle cx={18} cy={22} r={1.4} fill="white" />
    </svg>
  )
}

/** Cork-backed Straightedge — place non-adjacent */
export function CorkStraightIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={4} y={13} width={12} height={12} rx={1.5} fill={COLOR_HEX.red} />
      <circle cx={10} cy={19} r={1.5} fill="white" />
      <rect x={17} y={11} width={6} height={18} rx={1} fill="#EFE4C4" opacity={0.9} />
      <line x1={17} y1={14} x2={23} y2={14} stroke="#0A0713" strokeWidth={0.8} />
      <line x1={17} y1={18} x2={23} y2={18} stroke="#0A0713" strokeWidth={0.8} />
      <line x1={17} y1={22} x2={23} y2={22} stroke="#0A0713" strokeWidth={0.8} />
      <line x1={17} y1={26} x2={23} y2={26} stroke="#0A0713" strokeWidth={0.8} />
      <rect x={24} y={13} width={12} height={12} rx={1.5} fill={COLOR_HEX.green} />
      <circle cx={27} cy={16} r={1.3} fill="white" />
      <circle cx={30} cy={19} r={1.3} fill="white" />
      <circle cx={33} cy={22} r={1.3} fill="white" />
    </svg>
  )
}

/** Eglomise Brush — move die, ignore color */
export function EglomiseIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {die(5, 8, 10, 10, COLOR_HEX.red)}
      <path d="M 16 13 L 24 13 M 21 10 L 24 13 L 21 16" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {die(25, 8, 10, 10, COLOR_HEX.blue)}
      <text x={20} y={30} fontSize={7} fontWeight="bold" fill="#F5C15E" textAnchor="middle">≠ COLOR</text>
    </svg>
  )
}

/** Copper Foil Burnisher — move die, ignore value */
export function CopperFoilIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={5} y={8} width={10} height={10} rx={1.5} fill={COLOR_HEX.green} />
      <text x={10} y={16} fontSize={7} fontWeight="bold" fill="white" textAnchor="middle">3</text>
      <path d="M 16 13 L 24 13 M 21 10 L 24 13 L 21 16" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={25} y={8} width={10} height={10} rx={1.5} fill={COLOR_HEX.green} />
      <text x={30} y={16} fontSize={7} fontWeight="bold" fill="white" textAnchor="middle">6</text>
      <text x={20} y={30} fontSize={7} fontWeight="bold" fill="#F5C15E" textAnchor="middle">≠ NUM</text>
    </svg>
  )
}

/** Lathekin — move die respecting all rules */
export function LathekinIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {die(4, 10, 9, 9, COLOR_HEX.purple)}
      <path d="M 14 15 L 22 15 M 19 12 L 22 15 L 19 18" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {die(23, 10, 9, 9, COLOR_HEX.purple, true)}
      <path d="M 5 26 L 15 26 M 25 26 L 35 26" stroke="#F5C15E" strokeWidth={1.5} fill="none" />
      <text x={20} y={35} fontSize={6.5} fill="#F5C15E" textAnchor="middle">MOVE 1</text>
    </svg>
  )
}

/** Lens Cutter — swap draft with round track */
export function LensCutterIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {die(3, 6, 10, 10, COLOR_HEX.blue, true)}
      <text x={8} y={26} fontSize={6} fill="#F5C15E" textAnchor="middle">DRAFT</text>
      <path d="M 15 12 L 25 12 M 22 9 L 25 12 L 22 15" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 25 22 L 15 22 M 18 19 L 15 22 L 18 25" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {die(27, 6, 10, 10, COLOR_HEX.yellow, true)}
      <text x={32} y={26} fontSize={6} fill="#F5C15E" textAnchor="middle">TRACK</text>
    </svg>
  )
}

/** Flux Remover — discard and draw new */
export function FluxRemoverIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {die(4, 12, 12, 12, COLOR_HEX.red)}
      <line x1={4} y1={12} x2={16} y2={24} stroke="#EFE4C4" strokeWidth={1.5} opacity={0.5} />
      <line x1={16} y1={12} x2={4} y2={24} stroke="#EFE4C4" strokeWidth={1.5} opacity={0.5} />
      <path d="M 18 18 L 24 18 M 21 15 L 24 18 L 21 21" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {die(26, 12, 12, 12, COLOR_HEX.green)}
      <text x={32} y={22} fontSize={8} fontWeight="bold" fill="white" textAnchor="middle">?</text>
    </svg>
  )
}

/** Glazing Hammer — reroll all */
export function GlazingHammerIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {die(3, 15, 10, 10, COLOR_HEX.red, true)}
      {die(15, 15, 10, 10, COLOR_HEX.blue, true)}
      {die(27, 15, 10, 10, COLOR_HEX.green, true)}
      <path d="M 8 8 A 14 14 0 1 1 32 12" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M 30 8 L 33 11 L 30 14" stroke="#F5C15E" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={20} y={35} fontSize={6.5} fill="#F5C15E" textAnchor="middle">ALL</text>
    </svg>
  )
}

/** Running Pliers — extra placement */
export function RunningPliersIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={4} y={12} width={10} height={10} rx={1.5} fill={COLOR_HEX.blue} />
      <text x={9} y={20} fontSize={7} fontWeight="bold" fill="white" textAnchor="middle">1</text>
      <rect x={15} y={12} width={10} height={10} rx={1.5} fill={COLOR_HEX.red} />
      <text x={20} y={20} fontSize={7} fontWeight="bold" fill="white" textAnchor="middle">2</text>
      <rect x={26} y={12} width={10} height={10} rx={1.5} fill={COLOR_HEX.yellow} stroke="#F5C15E" strokeWidth={1.5} strokeDasharray="2,1" />
      <text x={31} y={20} fontSize={7} fontWeight="bold" fill="white" textAnchor="middle">+</text>
      <text x={20} y={33} fontSize={7} fontWeight="bold" fill="#F5C15E" textAnchor="middle">BONUS TURN</text>
    </svg>
  )
}

/** Grinding Stone — flip to opposite */
export function GrindingStoneIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <rect x={4} y={14} width={12} height={12} rx={1.5} fill={COLOR_HEX.purple} />
      <text x={10} y={23} fontSize={9} fontWeight="bold" fill="white" textAnchor="middle">2</text>
      <path d="M 18 20 L 26 20" stroke="#F5C15E" strokeWidth={2} strokeDasharray="2,2" />
      <path d="M 22 15 L 22 25" stroke="#F5C15E" strokeWidth={1.5} />
      <rect x={26} y={14} width={12} height={12} rx={1.5} fill={COLOR_HEX.purple} />
      <text x={32} y={23} fontSize={9} fontWeight="bold" fill="white" textAnchor="middle">5</text>
      <text x={20} y={35} fontSize={6.5} fill="#F5C15E" textAnchor="middle">7 - N</text>
    </svg>
  )
}

/** Tap Wheel — move die (basic move) */
export function TapWheelIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <circle cx={20} cy={20} r={11} fill="none" stroke="#F5C15E" strokeWidth={2} />
      <circle cx={20} cy={20} r={4} fill="#F5C15E" />
      <path d="M 20 9 L 20 15 M 20 25 L 20 31 M 9 20 L 15 20 M 25 20 L 31 20" stroke="#F5C15E" strokeWidth={2} strokeLinecap="round" />
      <text x={20} y={38} fontSize={6.5} fill="#F5C15E" textAnchor="middle">MOVE</text>
    </svg>
  )
}

export const TOOL_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  grozing: GrozingIcon,
  fluxBrush: FluxBrushIcon,
  corkStraight: CorkStraightIcon,
  eglomise: EglomiseIcon,
  copperFoil: CopperFoilIcon,
  lathekin: LathekinIcon,
  lensCutter: LensCutterIcon,
  fluxRemover: FluxRemoverIcon,
  glazingHammer: GlazingHammerIcon,
  runningPliers: RunningPliersIcon,
  grindingStone: GrindingStoneIcon,
  tapWheel: TapWheelIcon,
}
