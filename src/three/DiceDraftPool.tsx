import { Die3D } from './Die3D'
import type { Die } from '../game/types'

type Props = {
  dice: Die[]
  onPick?: (dieId: string) => void
}

/**
 * Circular tray of drafted dice (like fabric draft pool),
 * arranged on a gold platter with candle lighting.
 */
export function DiceDraftPool({ dice, onPick }: Props) {
  const rows = 2
  const cols = Math.ceil(dice.length / rows)
  const cellSize = 1.1
  const trayW = cols * cellSize + 0.6
  const trayH = rows * cellSize + 0.6

  return (
    <group position={[0, 0, 0]}>
      {/* Gold tray base */}
      <mesh position={[0, 0, -0.05]} receiveShadow>
        <boxGeometry args={[trayW, trayH, 0.08]} />
        <meshStandardMaterial
          color="#8B7332"
          metalness={0.9}
          roughness={0.35}
          emissive="#3F2A1C"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[trayW + 0.12, trayH + 0.12, 0.05]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.2} emissive="#D4AF37" emissiveIntensity={0.3} />
      </mesh>
      {/* Inner surface (velvet feel) */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[trayW - 0.15, trayH - 0.15]} />
        <meshStandardMaterial color="#1A0F26" roughness={0.9} />
      </mesh>

      {dice.map((die, i) => {
        const r = Math.floor(i / cols)
        const c = i % cols
        const x = -trayW / 2 + 0.3 + cellSize / 2 + c * cellSize
        const y = trayH / 2 - 0.3 - cellSize / 2 - r * cellSize
        return (
          <group key={die.id} position={[x, y, 0.5]}>
            <Die3D
              color={die.color}
              value={die.value}
              size={0.75}
              hover
              onClick={onPick ? () => onPick(die.id) : undefined}
            />
          </group>
        )
      })}
    </group>
  )
}
