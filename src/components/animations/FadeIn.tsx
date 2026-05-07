'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { gentleEase } from './easing'

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
          : { duration, delay, ease: gentleEase }
      }
      className={className}
    >
      {children}
    </motion.div>
  )
}
