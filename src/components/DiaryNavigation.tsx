'use client';

import Link from 'next/link';

export interface DiaryNavigationProps {
  prevId: string | null;
  nextId: string | null;
  onPrev: () => void;
  onNext: () => void;
}

export function DiaryNavigation({ prevId, nextId, onPrev, onNext }: DiaryNavigationProps) {
  const showNav = prevId !== null || nextId !== null;

  return (
    <div className="flex items-center justify-between">
      <Link
        href="/diary"
        className="inline-flex items-center gap-1.5 text-sm text-text-sub hover:text-text-main transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="21" y1="10" x2="3" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="21" y1="18" x2="3" y2="18" />
        </svg>
        时间线
      </Link>

      {showNav && (
        <div className="flex gap-3">
          {prevId !== null && (
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-text-sub hover:text-text-main bg-card border border-border-soft rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              上一篇
            </button>
          )}
          {nextId !== null && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-text-sub hover:text-text-main bg-card border border-border-soft rounded-full transition-colors"
            >
              下一篇
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
      )}
    </div>
  );
}
