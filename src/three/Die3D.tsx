import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLOR_HEX, type DiceColor, type DiceValue } from '../game/types'

/** Pip positions per face value */
const PIP_LAYOUTS: Record<DiceValue, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.28, 0.28], [0.28, -0.28]],
  3: [[-0.3, 0.3], [0, 0], [0.3, -0.3]],
  4: [[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]],
  5: [[-0.3, 0.3], [0.3, 0.3], [0, 0], [-0.3, -0.3], [0.3, -0.3]],
  6: [[-0.3, 0.35], [0.3, 0.35], [-0.3, 0], [0.3, 0], [-0.3, -0.35], [0.3, -0.35]],
}

/**
 * Each face is a plane slightly outside the cube surface,
 * with its own value's pips. Opposite faces sum to 7.
 */
type FaceDef = { value: DiceValue; position: [number, number, number]; rotation: [number, number, number] }

const FACES: FaceDef[] = [
  { value: 1, position: [0, 0.501, 0], rotation: [-Math.PI / 2, 0, 0] },  // +Y (top)
  { value: 6, position: [0, -0.501, 0], rotation: [Math.PI / 2, 0, 0] },  // -Y (bottom)
  { value: 2, position: [0, 0, 0.501], rotation: [0, 0, 0] },             // +Z (front)
  { value: 5, position: [0, 0, -0.501], rotation: [0, Math.PI, 0] },      // -Z (back)
  { value: 3, position: [0.501, 0, 0], rotation: [0, Math.PI / 2, 0] },   // +X (right)
  { value: 4, position: [-0.501, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // -X (left)
]

/** Rotate die so that a particular value face is on top (+Y) */
const VALUE_TO_ROTATION: Record<DiceValue, [number, number, number]> = {
  1: [0, 0, 0],
  2: [-Math.PI / 2, 0, 0],
  3: [0, 0, Math.PI / 2],
  4: [0, 0, -Math.PI / 2],
  5: [Math.PI / 2, 0, 0],
  6: [Math.PI, 0, 0],
}

function DieFace({ value, position, rotation, faceColor }: FaceDef & { faceColor: string }) {
  const pips = PIP_LAYOUTS[value]
  return (
    <group position={position} rotation={rotation}>
      {pips.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.002]}>
          <circleGeometry args={[0.075, 24]} />
          <meshStandardMaterial
            color="#FFF9E6"
            emissive="#FFE9A8"
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      ))}
      {/* Inset face highlight so pips have a backdrop */}
      <mesh>
        <planeGeometry args={[0.94, 0.94]} />
        <meshStandardMaterial
          color={faceColor}
          emissive={faceColor}
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  )
}

type Die3DProps = {
  color: DiceColor
  value: DiceValue
  size?: number
  position?: [number, number, number]
  hover?: boolean
  spin?: boolean
  tilt?: boolean
  onClick?: () => void
}

export function Die3D({ color, value, size = 1, position = [0, 0, 0], hover = false, spin = false, tilt = true, onClick }: Die3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const hex = COLOR_HEX[color]
  const baseRotation = tilt ? VALUE_TO_ROTATION[value] : [0, 0, 0] as [number, number, number]

  useFrame((state, delta) => {
    if (!groupRef.current) return
    if (spin) {
      groupRef.current.rotation.x += delta * 0.5
      groupRef.current.rotation.y += delta * 0.7
    }
    if (hover) {
      const t = state.clock.elapsedTime
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.06
    }
  })

  return (
    <group
      ref={groupRef}
      position={position}
      scale={size}
      onClick={(e) => { if (onClick) { e.stopPropagation(); onClick() } }}
      onPointerOver={(e) => { if (onClick) { document.body.style.cursor = 'pointer'; e.stopPropagation() } }}
      onPointerOut={() => { if (onClick) document.body.style.cursor = 'auto' }}
    >
      {/* rotate whole thing so `value` face is on top */}
      <group rotation={baseRotation}>
        {/* Glass cube */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color={hex}
            transmission={0.35}
            thickness={0.5}
            roughness={0.05}
            metalness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.04}
            ior={1.6}
            attenuationColor={hex}
            attenuationDistance={0.7}
          />
        </mesh>
        {FACES.map((f) => (
          <DieFace key={f.value} {...f} faceColor={hex} />
        ))}
      </group>
    </group>
  )
}
