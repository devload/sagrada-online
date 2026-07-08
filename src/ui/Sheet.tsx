import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  eyebrow?: string
  children: React.ReactNode
  /** Max height ratio (0-1). Default 0.85 */
  maxHeight?: number
}

/**
 * Bottom sheet overlay that preserves the game screen behind it.
 * Used for Objectives, Tools, Rules, etc.
 */
export function Sheet({ open, onClose, title, eyebrow, children, maxHeight = 0.85 }: Props) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-cathedral-void/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className="fixed left-0 right-0 bottom-0 z-50 flex flex-col
                       rounded-t-3xl border-t border-x border-cathedral-gold/40
                       bg-gradient-to-b from-cathedral-nave to-cathedral-void
                       shadow-[0_-24px_60px_rgba(0,0,0,0.6)] pb-safe"
            style={{ maxHeight: `${maxHeight * 100}%` }}
          >
            {/* Drag handle */}
            <button
              onClick={onClose}
              className="mx-auto mt-3 w-14 h-1.5 rounded-full bg-cathedral-parchment/30 hover:bg-cathedral-parchment/50 transition"
              aria-label="Close"
            />

            {/* Header */}
            {(eyebrow || title) && (
              <div className="px-5 pt-3 pb-4 flex items-baseline justify-between">
                <div>
                  {eyebrow && <div className="text-[10px] tracking-widest text-cathedral-gold/70">{eyebrow}</div>}
                  {title && <h2 className="font-display text-2xl text-gold-shimmer mt-0.5">{title}</h2>}
                </div>
                <button
                  onClick={onClose}
                  className="text-cathedral-parchment/50 hover:text-cathedral-parchment text-xl leading-none w-9 h-9 rounded-full border border-cathedral-parchment/20 hover:border-cathedral-parchment/40 transition"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
