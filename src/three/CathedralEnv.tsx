/**
 * Shared lighting for all 3D scenes: gothic cathedral vibe.
 * Uses only direct lights (no HDR fetch) so it works fully offline.
 */
export function CathedralEnv() {
  return (
    <>
      {/* Warm candle glow from below */}
      <pointLight position={[0, -3, 2]} intensity={5} color="#F5C15E" distance={12} decay={2} />

      {/* Cool moonlight from behind glass */}
      <pointLight position={[0, 2, -5]} intensity={10} color="#8AB4F5" distance={14} decay={2} />

      {/* Rim gold key */}
      <spotLight
        position={[6, 8, 4]}
        angle={0.6}
        penumbra={0.8}
        intensity={5}
        color="#F5D573"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Fill from the front so materials aren't pitch black */}
      <directionalLight position={[0, 2, 6]} intensity={1.2} color="#EFE4C4" />

      {/* Ambient */}
      <ambientLight intensity={0.55} color="#5A3F7A" />

      {/* Simple hemisphere for softer sky/ground blend */}
      <hemisphereLight args={['#3F2A5C', '#0A0713', 0.6]} />
    </>
  )
}
