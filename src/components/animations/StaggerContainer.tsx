'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { gentleEase } from './easing'

interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  className?: string
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({
  children,
  staggerDelay = 0.06,
  className,
}: StaggerContainerProps) {
  const reducedMotion = useReducedMotion()

  const variants = reducedMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay },
        },
      }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reducedMotion = useReducedMotion()

  const variants = reducedMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.25, ease: gentleEase },
        },
      }

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  )
}
