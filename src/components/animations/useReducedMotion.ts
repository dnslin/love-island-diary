'use client'

import { useState, useEffect } from 'react'

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mql.addEventListener('change', handleChange)
    return () => {
      mql.removeEventListener('change', handleChange)
    }
  }, [])

  return reducedMotion
}
