import { animate, useMotionValue, useTransform, motion } from 'framer-motion'
import { useEffect } from 'react'

/**
 * Number that smoothly animates from its previous value to `value`.
 * Used by mission strip badges + score totals.
 */
export function AnimatedNumber({
  value,
  prefix = '',
  className,
  duration = 0.7,
}: {
  value: number
  prefix?: string
  className?: string
  duration?: number
}) {
  const mv = useMotionValue(value)
  const rounded = useTransform(mv, (v) => `${prefix}${Math.round(v)}`)

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: 'easeOut' })
    return () => controls.stop()
  }, [value, mv, duration])

  return <motion.span className={className}>{rounded}</motion.span>
}
