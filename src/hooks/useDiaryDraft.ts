'use client';

import { useState, useEffect, useRef } from 'react';

export function useDiaryDraft<T>(key: string, defaultValue: T) {
  const [draft, setDraft] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem(key);
      }
    }
    return defaultValue;
  });

  const defaultValueRef = useRef(defaultValue);

  useEffect(() => {
    defaultValueRef.current = defaultValue;
  }, [defaultValue]);

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
    setDraft(defaultValueRef.current);
  };

  return [draft, setDraft, clearDraft] as const;
}
