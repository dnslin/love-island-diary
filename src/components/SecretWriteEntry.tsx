'use client';

import { useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';

interface SecretWriteEntryProps {
  children: React.ReactNode;
}

export default function SecretWriteEntry({ children }: SecretWriteEntryProps) {
  const router = useRouter();
  const clickCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    clickCountRef.current += 1;

    if (clickCountRef.current === 1) {
      timerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 500);
    }

    if (clickCountRef.current >= 3) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      clickCountRef.current = 0;
      router.push('/diary/new');
    }
  }, [router]);

  return (
    <div
      onClick={handleClick}
      className="cursor-default select-none"
      title=""
    >
      {children}
    </div>
  );
}
