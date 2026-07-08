import { motion } from 'framer-motion'

type Props = {
  onClick: () => void
  disabled?: boolean
  title: string
  subtitle?: string
  variant?: 'primary' | 'ghost'
}

/**
 * Structured step CTA. Uses a card-like layout with room for a subtitle
 * and a proper SVG chevron on the right — solves the "text edge-to-edge"
 * feel of a single-line `NEXT · LABEL →` button.
 */
export function StepCTA({ onClick, disabled, title, subtitle, variant = 'primary' }: Props) {
  const primary = variant === 'primary'
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full rounded-xl shadow-gold-glow transition
        py-3.5 pl-6 pr-4
        flex items-center gap-3
        ${primary
          ? 'bg-gold-gradient text-cathedral-void hover:brightness-110'
          : 'border border-cathedral-gold/50 text-cathedral-parchment bg-cathedral-void/40'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex-1 text-left min-w-0">
        <div className="font-serif font-bold text-base leading-snug tracking-wide">
          {title}
        </div>
        {subtitle && (
          <div className={`text-[11px] mt-0.5 leading-tight ${primary ? 'text-cathedral-void/70' : 'text-cathedral-parchment/60'}`}>
            {subtitle}
          </div>
        )}
      </div>
      <Chevron primary={primary} />
    </motion.button>
  )
}

function Chevron({ primary }: { primary: boolean }) {
  return (
    <div
      className={`
        w-9 h-9 rounded-full flex items-center justify-center shrink-0
        ${primary ? 'bg-cathedral-void/15' : 'bg-cathedral-gold/20'}
      `}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M 5 3 L 10 8 L 5 13"
          stroke={primary ? '#0A0713' : '#F5D573'}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
