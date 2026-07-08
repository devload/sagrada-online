import { useState } from 'react'
import { useUI, type Scene } from '../store/uiStore'

const SCENES: { key: Scene; label: string }[] = [
  { key: 'lobby', label: 'Lobby' },
  { key: 'privateReveal', label: 'Private' },
  { key: 'publicReveal', label: 'Public' },
  { key: 'waiting', label: 'Pattern' },
  { key: 'game', label: 'Game' },
  { key: 'scoreboard', label: 'Score' },
]

/**
 * Dev-only scene nav. Bottom-right corner so it never overlaps HUD.
 * Very small closed state, expands upward on tap.
 */
export function SceneSwitcher() {
  const scene = useUI((s) => s.scene)
  const setScene = useUI((s) => s.setScene)
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-2 right-2 z-[60] pointer-events-none pb-safe">
      <div className="pointer-events-auto flex flex-col items-end gap-1">
        {open && (
          <div className="flex flex-col-reverse gap-1 items-end mb-1">
            {SCENES.map((s) => (
              <button
                key={s.key}
                onClick={() => setScene(s.key)}
                className={`text-[9px] tracking-wider px-2 py-1 rounded-full backdrop-blur border transition
                  ${scene === s.key
                    ? 'bg-cathedral-gold/90 text-cathedral-void border-cathedral-gold'
                    : 'bg-black/70 text-white/70 border-white/15 hover:bg-black/90'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-black/50 text-white/50 text-[10px] px-2 py-0.5 backdrop-blur border border-white/10 hover:bg-black/70 transition"
          title="Dev scene nav"
          aria-label="Dev nav"
        >
          {open ? '×' : 'dev'}
        </button>
      </div>
    </div>
  )
}
