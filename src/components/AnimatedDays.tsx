'use client';

import { useEffect, useState } from 'react';
import { useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedDaysProps {
  days: number;
}

export default function AnimatedDays({ days }: AnimatedDaysProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const spring = useSpring(0, { duration: 1500 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion) {
      spring.set(days);
    }
  }, [days, prefersReducedMotion, spring]);

  if (prefersReducedMotion) {
    return <span className="text-5xl font-bold text-accent">{days}</span>;
  }

  return (
    <motion.span className="text-5xl font-bold text-accent">
      {display}
    </motion.span>
  );
}
