import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

/**
 * Force-release the WebGL context on unmount so Chrome doesn't hit its
 * per-tab context cap when users navigate between 3D scenes.
 *
 * Without this, r3f only calls renderer.dispose() (which frees GL objects
 * but keeps the context alive), and after ~16 scene mounts Chrome starts
 * emitting THREE.WebGLRenderer: Context Lost errors.
 */
export function CanvasCleanup() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    return () => {
      try {
        gl.forceContextLoss()
        gl.dispose()
      } catch {}
    }
  }, [gl])
  return null
}
