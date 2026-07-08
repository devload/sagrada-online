/**
 * Seedable PRNG (mulberry32). Same seed → same sequence.
 * Used by multiplayer to derive identical objective/pattern/dice rolls
 * across all clients without a server-authoritative game loop.
 */

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash a string into a 32-bit seed (xmur3). */
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** Derive an rng for a specific sub-scope of a shared seed. */
export function scopedRng(rootSeed: string, scope: string): Rng {
  return mulberry32(hashSeed(`${rootSeed}:${scope}`))
}
