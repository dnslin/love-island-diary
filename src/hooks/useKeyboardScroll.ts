'use client';

import { useEffect, useRef } from 'react';

const NON_TEXT_INPUT_TYPES = new Set([
  'checkbox',
  'radio',
  'hidden',
  'submit',
  'button',
  'file',
  'color',
  'range',
  'image',
  'reset',
]);

function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function shouldHandleElement(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;

  if (el.tagName === 'TEXTAREA') return true;
  if (el.isContentEditable) return true;

  if (el.tagName === 'INPUT') {
    const type = (el as HTMLInputElement).type.toLowerCase();
    return !NON_TEXT_INPUT_TYPES.has(type);
  }

  return false;
}

/**
 * 监听输入框聚焦事件，在移动端键盘弹出时自动滚动输入框到可视区域
 */
export function useKeyboardScroll() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isMobileDevice()) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target;
      if (!shouldHandleElement(target)) return;

      timerRef.current = setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    };

    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
}
