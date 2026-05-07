'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.25,
  className,
}: FadeInProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration, delay, ease: [0.4, 0, 0.2, 1] }
      }
      className={className}
    >
      {children}
    </motion.div>
  )
}
