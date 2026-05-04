'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DiaryNavigation } from './DiaryNavigation';

type Direction = 'left' | 'right';

interface PageFlipWrapperProps {
  children: React.ReactNode;
  prevId: string | null;
  nextId: string | null;
  currentId: string;
}

const variants = {
  enter: (dir: Direction | null) => ({
    rotateY: dir === 'right' ? 90 : -90,
    opacity: 0,
    x: dir === 'right' ? '50%' : '-50%',
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    x: 0,
  },
  exit: (dir: Direction | null) => ({
    rotateY: dir === 'right' ? -90 : 90,
    opacity: 0,
    x: dir === 'right' ? '-50%' : '50%',
  }),
};

export function PageFlipWrapper({
  children,
  prevId,
  nextId,
  currentId,
}: PageFlipWrapperProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [direction, setDirection] = useState<Direction | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pageFlipDirection');
      if (saved) {
        sessionStorage.removeItem('pageFlipDirection');
        return saved as Direction;
      }
    }
    return null;
  });
  const touchStartX = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleExitComplete = useCallback(() => {
    if (!direction) return;
    const targetId = direction === 'right' ? nextId : prevId;
    if (targetId) {
      if (prefersReducedMotion) {
        router.push(`/diary/${targetId}`);
      } else {
        sessionStorage.setItem('pageFlipDirection', direction);
        router.push(`/diary/${targetId}`);
      }
    }
  }, [direction, prevId, nextId, router, prefersReducedMotion]);

  const goToPrev = useCallback(() => {
    if (isExiting || prevId === null) return;
    setDirection('left');
    setIsExiting(true);
  }, [isExiting, prevId]);

  const goToNext = useCallback(() => {
    if (isExiting || nextId === null) return;
    setDirection('right');
    setIsExiting(true);
  }, [isExiting, nextId]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isExiting) return;
      touchStartX.current = e.touches[0].clientX;
    },
    [isExiting]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (isExiting || touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (diff > 80) {
        goToPrev();
      } else if (diff < -80) {
        goToNext();
      }
      touchStartX.current = null;
    },
    [isExiting, goToPrev, goToNext]
  );

  return (
    <div
      className="min-h-screen bg-cream"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-[480px] mx-auto px-4 py-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-text-main transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            封面
          </Link>

          <div className="flex gap-2">
            {prevId !== null && (
              <button
                type="button"
                aria-label="上一篇"
                disabled={isExiting}
                onClick={goToPrev}
                className="text-text-sub hover:text-text-main transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}
            {nextId !== null && (
              <button
                type="button"
                aria-label="下一篇"
                disabled={isExiting}
                onClick={goToNext}
                className="text-text-sub hover:text-text-main transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 3D 翻书容器 */}
        <div
          className="mb-6"
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
          <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
            {!isExiting && (
              <motion.div
                key={currentId}
                custom={direction}
                variants={variants}
                initial={direction ? 'enter' : false}
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="bg-card rounded-2xl p-4 shadow-sm">
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部导航 */}
        <DiaryNavigation
          prevId={prevId}
          nextId={nextId}
          onPrev={goToPrev}
          onNext={goToNext}
        />
      </div>
    </div>
  );
}
