'use client'

import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { SlideIn } from './SlideIn'

interface ToastProps {
  message: string
  visible: boolean
  onClose?: () => void
  autoClose?: number
}

export function Toast({
  message,
  visible,
  onClose,
  autoClose = 2000,
}: ToastProps) {
  useEffect(() => {
    if (!visible || !onClose) {
      return
    }

    const timer = setTimeout(() => {
      onClose()
    }, autoClose)

    return () => {
      clearTimeout(timer)
    }
  }, [visible, onClose, autoClose])

  return (
    <AnimatePresence>
      {visible && (
        <SlideIn direction="top">
          <div className="px-4 py-3 rounded-lg bg-primary/20 text-text-main text-sm text-center">
            {message}
          </div>
        </SlideIn>
      )}
    </AnimatePresence>
  )
}
