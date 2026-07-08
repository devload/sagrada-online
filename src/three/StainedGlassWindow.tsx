import { useMemo } from 'react'
import { Die3D } from './Die3D'
import { COLOR_HEX, type PatternCard, type PlacedDie } from '../game/types'

type Props = {
  pattern: PatternCard
  placed: PlacedDie[][]
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

const COLS = 5
const ROWS = 4
const CELL = 0.9
const GAP = 0.05

/**
 * 3D stained glass window: dark stone frame, jewel-toned constraint cells,
 * with placed dice sitting slightly forward.
 */
export function StainedGlassWindow({
  pattern,
  placed,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: Props) {
  const totalW = COLS * CELL + (COLS + 1) * GAP
  const totalH = ROWS * CELL + (ROWS + 1) * GAP

  const cellPositions = useMemo(() => {
    const positions: { x: number; y: number; r: number; c: number }[] = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = -totalW / 2 + GAP + CELL / 2 + c * (CELL + GAP)
        const y = totalH / 2 - GAP - CELL / 2 - r * (CELL + GAP)
        positions.push({ x, y, r, c })
      }
    }
    return positions
  }, [totalW, totalH])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Backlight glow plane */}
      <mesh position={[0, 0, -0.4]}>
        <planeGeometry args={[totalW * 1.2, totalH * 1.2]} />
        <meshBasicMaterial color="#8AB4F5" transparent opacity={0.15} />
      </mesh>

      {/* Stone frame */}
      <mesh position={[0, 0, -0.15]} receiveShadow>
        <boxGeometry args={[totalW + 0.5, totalH + 0.5, 0.15]} />
        <meshStandardMaterial color="#2A2140" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Gold frame edge */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[totalW + 0.28, totalH + 0.28, 0.08]} />
        <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.3} roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Inner void */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[totalW + 0.1, totalH + 0.1, 0.02]} />
        <meshStandardMaterial color="#0A0713" roughness={0.7} />
      </mesh>

      {cellPositions.map(({ x, y, r, c }) => {
        const cell = pattern.grid[r][c]
        const die = placed[r]?.[c]
        const isColor = cell.kind === 'color'
        const isValue = cell.kind === 'value'
        const constraintColor = isColor ? COLOR_HEX[cell.color] : '#1A1029'

        return (
          <group key={`${r}-${c}`} position={[x, y, 0]}>
            {/* Constraint cell (translucent glass) */}
            {isColor && (
              <mesh position={[0, 0, 0.02]}>
                <boxGeometry args={[CELL, CELL, 0.05]} />
                <meshPhysicalMaterial
                  color={constraintColor}
                  transmission={0.7}
                  thickness={0.15}
                  roughness={0.1}
                  clearcoat={0.8}
                  ior={1.5}
                  emissive={constraintColor}
                  emissiveIntensity={0.4}
                  transparent
                  opacity={0.75}
                />
              </mesh>
            )}
            {isValue && (
              <mesh position={[0, 0, 0.02]}>
                <boxGeometry args={[CELL, CELL, 0.05]} />
                <meshStandardMaterial
                  color="#12091E"
                  emissive="#3F2A5C"
                  emissiveIntensity={0.3}
                  roughness={0.6}
                />
              </mesh>
            )}
            {!isColor && !isValue && (
              <mesh position={[0, 0, 0.02]}>
                <boxGeometry args={[CELL, CELL, 0.03]} />
                <meshStandardMaterial color="#0F0A1C" roughness={0.9} />
              </mesh>
            )}

            {/* Value number engraving */}
            {isValue && !die && (
              <ValueMarker value={cell.value} />
            )}

            {/* Placed die */}
            {die && (
              <group position={[0, 0, 0.5]}>
                <Die3D color={die.color} value={die.value} size={CELL * 0.85} tilt={false} />
              </group>
            )}

            {/* Lead cames (thin gold dividers around each cell) */}
            <mesh position={[0, CELL / 2 + GAP / 2, 0.08]}>
              <boxGeometry args={[CELL + GAP, GAP, 0.06]} />
              <meshStandardMaterial color="#8B7332" metalness={0.7} roughness={0.4} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function ValueMarker({ value }: { value: number }) {
  const pipCount = value
  const pips = useMemo(() => {
    const layouts: Record<number, [number, number][]> = {
      1: [[0, 0]],
      2: [[-0.18, 0.18], [0.18, -0.18]],
      3: [[-0.2, 0.2], [0, 0], [0.2, -0.2]],
      4: [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]],
      5: [[-0.2, 0.2], [0.2, 0.2], [0, 0], [-0.2, -0.2], [0.2, -0.2]],
      6: [[-0.2, 0.25], [0.2, 0.25], [-0.2, 0], [0.2, 0], [-0.2, -0.25], [0.2, -0.25]],
    }
    return layouts[pipCount] || []
  }, [pipCount])

  return (
    <group position={[0, 0, 0.06]}>
      {pips.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <circleGeometry args={[0.05, 20]} />
          <meshStandardMaterial
            color="#D4AF37"
            emissive="#D4AF37"
            emissiveIntensity={0.6}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}
