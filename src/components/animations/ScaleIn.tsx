'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { gentleEase } from './easing'

interface ScaleInProps {
  children: ReactNode
  duration?: number
  className?: string
}

export function ScaleIn({
  children,
  duration = 0.2,
  className,
}: ScaleInProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration, ease: gentleEase }
      }
      className={className}
    >
      {children}
    </motion.div>
  )
}
