'use client';

import { useEffect, useState } from 'react';
import { useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedDaysProps {
  days: number;
}

export default function AnimatedDays({ days }: AnimatedDaysProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const spring = useSpring(0, { duration: 1500 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion) {
      spring.set(0);
      spring.set(days);
    }
    return () => {
      spring.stop();
    };
  }, [days, prefersReducedMotion, spring]);

  if (prefersReducedMotion) {
    return (
      <span className="text-5xl font-bold text-accent" aria-live="polite">
        {days}
      </span>
    );
  }

  return (
    <motion.span className="text-5xl font-bold text-accent" aria-live="polite">
      {display}
    </motion.span>
  );
}
