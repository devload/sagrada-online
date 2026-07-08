import { useEffect, useState } from 'react'
import { isMuted, setMuted, unlockAudio, playClick } from '../audio/sounds'

/**
 * Small floating audio toggle. Persists mute state to localStorage.
 * Also unlocks the AudioContext on first user gesture (iOS Safari requirement).
 */
export function AudioButton({ className = '' }: { className?: string }) {
  const [muted, setMutedState] = useState<boolean>(() => isMuted())

  useEffect(() => {
    // Unlock audio once, on the first pointer event anywhere.
    const unlock = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  const toggle = () => {
    unlockAudio()
    const next = !muted
    setMuted(next)
    setMutedState(next)
    if (!next) playClick()
  }

  return (
    <button
      onClick={toggle}
      aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      className={`rounded-full bg-black/40 border border-white/15 text-white/70 hover:text-white text-sm w-8 h-8 flex items-center justify-center backdrop-blur transition ${className}`}
      title={muted ? '소리 켜기' : '소리 끄기'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
