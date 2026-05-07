'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { gentleEase } from './easing'

type Direction = 'top' | 'bottom' | 'left' | 'right'

interface SlideInProps {
  children: ReactNode
  direction?: Direction
  duration?: number
  className?: string
}

const directionOffset: Record<Direction, { x?: number; y?: number; opacity?: number }> = {
  top: { y: -20, opacity: 0 },
  bottom: { y: 20, opacity: 0 },
  left: { x: -20, opacity: 0 },
  right: { x: 20, opacity: 0 },
}

export function SlideIn({
  children,
  direction = 'top',
  duration = 0.25,
  className,
}: SlideInProps) {
  const reducedMotion = useReducedMotion()
  const offset = directionOffset[direction]

  return (
    <motion.div
      initial={offset}
      animate={{ x: 0, y: 0 }}
      exit={offset}
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
