'use client';

import { useState, useEffect } from 'react';

export function useDiaryDraft<T>(key: string, defaultValue: T) {
  const [draft, setDraft] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setDraft(JSON.parse(saved));
      } catch {
        localStorage.removeItem(key);
      }
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, key]);

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  };

  return [draft, setDraft, clearDraft] as const;
}
