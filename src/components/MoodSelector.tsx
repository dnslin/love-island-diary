'use client';

import { useState, useEffect, useRef } from 'react';

export const MOODS = [
  { value: 'sweet', label: '甜甜的', color: '#F7C8D0' },
  { value: 'happy', label: '开心', color: '#B8DDA8' },
  { value: 'miss', label: '想念', color: '#AFC9F7' },
  { value: 'calm', label: '平静', color: '#D8C7E8' },
  { value: 'sad', label: '小难过', color: '#E8C4A0' },
] as const;

export type MoodValue = (typeof MOODS)[number]['value'];

interface MoodSelectorProps {
  value: MoodValue;
  onChange: (value: MoodValue) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = MOODS.find((m) => m.value === value) ?? MOODS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-soft bg-card"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: selected.color }}
        />
        <span className="text-sm text-text-main">{selected.label}</span>
      </button>

      {open && (
        <div
          className="absolute z-10 mt-1 w-full min-w-[120px] rounded-lg border border-border-soft bg-card shadow-lg overflow-hidden"
          role="listbox"
        >
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              role="option"
              aria-selected={mood.value === value}
              onClick={() => {
                onChange(mood.value);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-cream text-left"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: mood.color }}
              />
              <span className="text-sm text-text-main">{mood.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
