# Issue #11 动画系统与插画实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一套集中式动画工具库和克制插画系统，覆盖 stagger、Toast、弹窗动画、心情图标、空状态插画、封面装饰动画及 prefers-reduced-motion 支持。

**Architecture:** 采用集中式动画组件库（`src/components/animations/`）统一封装 Framer Motion 动画，所有组件内部读取 `useReducedMotion()` 自动禁用动画；插画组件（`src/components/illustrations/`）独立管理 SVG 和 CSS 动画；最终通过 index.ts 统一导出供各页面集成。

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Framer Motion v12, animal-island-ui, Jest, React Testing Library

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/components/animations/useReducedMotion.ts` | 检测系统是否开启 reduced-motion |
| `src/components/animations/FadeIn.tsx` | 通用淡入动画 wrapper |
| `src/components/animations/SlideIn.tsx` | 滑入动画 wrapper（Toast 用） |
| `src/components/animations/ScaleIn.tsx` | 缩放淡入 wrapper（弹窗用） |
| `src/components/animations/StaggerContainer.tsx` | Stagger 容器 + 子项 |
| `src/components/animations/Toast.tsx` | 顶部提示组件（保存成功） |
| `src/components/animations/index.ts` | 动画组件统一导出 |
| `src/components/illustrations/MoodIcons.tsx` | 5 种心情 SVG 图标 |
| `src/components/illustrations/EmptyState.tsx` | 空状态插画 + 浮动动画 |
| `src/components/illustrations/CoverDecorations.tsx` | 封面装饰 SVG + CSS 浮动动画 |
| `src/components/illustrations/index.ts` | 插画组件统一导出 |
| `src/components/animations/__tests__/useReducedMotion.test.ts` | useReducedMotion hook 测试 |
| `src/components/animations/__tests__/Toast.test.tsx` | Toast 组件测试 |
| `src/components/illustrations/__tests__/MoodIcons.test.tsx` | MoodIcons 组件测试 |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/DiaryTimeline.tsx` | 导入 StaggerContainer + EmptyState，替换空状态，列表加 stagger |
| `src/components/DiaryDetail.tsx` | 导入 MoodIcon，替换心情圆点 |
| `src/components/DiaryForm.tsx` | 导入 Toast，替换静态成功提示；按钮加 whileTap |
| `src/components/MoodSelector.tsx` | 导入 MoodIcon，色块旁显示图标；按钮加 whileTap |
| `src/components/PasswordModal.tsx` | 导入 ScaleIn，弹窗内容加缩放淡入 |
| `src/components/DeleteConfirmModal.tsx` | 导入 ScaleIn，弹窗内容加缩放淡入 |
| `src/app/(protected)/page.tsx` | 导入 CoverDecorations，替换静态 SVG 装饰 |

---

## Task 1: useReducedMotion Hook

**Files:**
- Create: `src/components/animations/useReducedMotion.ts`
- Test: `src/components/animations/__tests__/useReducedMotion.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
  let matchMediaMock: jest.Mock;

  beforeEach(() => {
    matchMediaMock = jest.fn();
    window.matchMedia = matchMediaMock;
  });

  it('returns false when prefers-reduced-motion is not set', () => {
    matchMediaMock.mockReturnValue({ matches: false });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion is reduce', () => {
    matchMediaMock.mockReturnValue({ matches: true });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('returns false on SSR when window is undefined', () => {
    const originalWindow = global.window;
    // @ts-expect-error - simulate SSR
    global.window = undefined;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    global.window = originalWindow;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/animations/__tests__/useReducedMotion.test.ts`

Expected: FAIL with "useReducedMotion is not defined" or "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```typescript
'use client';

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/animations/__tests__/useReducedMotion.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/animations/useReducedMotion.ts src/components/animations/__tests__/useReducedMotion.test.ts
git commit -m "feat(animations): 添加 useReducedMotion hook"
```

---

## Task 2: FadeIn Component

**Files:**
- Create: `src/components/animations/FadeIn.tsx`

- [ ] **Step 1: Write the component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.25,
  className,
}: FadeInProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration, delay, ease: [0.4, 0, 0.2, 1] }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/animations/FadeIn.tsx
git commit -m "feat(animations): 添加 FadeIn 动画组件"
```

---

## Task 3: SlideIn Component

**Files:**
- Create: `src/components/animations/SlideIn.tsx`

- [ ] **Step 1: Write the component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  duration?: number;
  className?: string;
}

const directionOffset = {
  top: { y: -20 },
  bottom: { y: 20 },
  left: { x: -20 },
  right: { x: 20 },
};

export function SlideIn({
  children,
  direction = 'top',
  duration = 0.25,
  className,
}: SlideInProps) {
  const reducedMotion = useReducedMotion();
  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...offset }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration, ease: [0.4, 0, 0.2, 1] }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/animations/SlideIn.tsx
git commit -m "feat(animations): 添加 SlideIn 动画组件"
```

---

## Task 4: ScaleIn Component

**Files:**
- Create: `src/components/animations/ScaleIn.tsx`

- [ ] **Step 1: Write the component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

interface ScaleInProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export function ScaleIn({
  children,
  duration = 0.2,
  className,
}: ScaleInProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration, ease: [0.4, 0, 0.2, 1] }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/animations/ScaleIn.tsx
git commit -m "feat(animations): 添加 ScaleIn 动画组件"
```

---

## Task 5: StaggerContainer + StaggerItem

**Files:**
- Create: `src/components/animations/StaggerContainer.tsx`

- [ ] **Step 1: Write the component**

```typescript
'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.06,
  className,
}: StaggerContainerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={
        reducedMotion
          ? {}
          : {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: staggerDelay },
              },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: StaggerItemProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={
        reducedMotion
          ? {}
          : {
              hidden: { opacity: 0, y: 8 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
              },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/animations/StaggerContainer.tsx
git commit -m "feat(animations): 添加 StaggerContainer + StaggerItem 组件"
```

---

## Task 6: Toast Component

**Files:**
- Create: `src/components/animations/Toast.tsx`
- Test: `src/components/animations/__tests__/Toast.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen, act } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  it('renders message when visible', () => {
    render(<Toast message="保存成功" visible={true} />);
    expect(screen.getByText('保存成功')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<Toast message="保存成功" visible={false} />);
    expect(screen.queryByText('保存成功')).not.toBeInTheDocument();
  });

  it('calls onClose after autoClose duration', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    render(<Toast message="保存成功" visible={true} onClose={onClose} autoClose={2000} />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/animations/__tests__/Toast.test.tsx`

Expected: FAIL with "Toast is not defined" or "Cannot find module"

- [ ] **Step 3: Write implementation**

```typescript
'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SlideIn } from './SlideIn';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  autoClose?: number;
}

export function Toast({
  message,
  visible,
  onClose,
  autoClose = 2000,
}: ToastProps) {
  useEffect(() => {
    if (!visible || !onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoClose);

    return () => clearTimeout(timer);
  }, [visible, onClose, autoClose]);

  return (
    <AnimatePresence>
      {visible && (
        <SlideIn direction="top" className="px-4 py-3 rounded-lg bg-primary/20 text-text-main text-sm text-center">
          {message}
        </SlideIn>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/animations/__tests__/Toast.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/animations/Toast.tsx src/components/animations/__tests__/Toast.test.tsx
git commit -m "feat(animations): 添加 Toast 顶部提示组件"
```

---

## Task 7: MoodIcons Component

**Files:**
- Create: `src/components/illustrations/MoodIcons.tsx`
- Test: `src/components/illustrations/__tests__/MoodIcons.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import { MoodIcon } from '../MoodIcons';

describe('MoodIcon', () => {
  it('renders svg element', () => {
    render(<MoodIcon mood="sweet" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('applies custom size', () => {
    render(<MoodIcon mood="happy" size={32} />);
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/components/illustrations/__tests__/MoodIcons.test.tsx`

Expected: FAIL with "MoodIcon is not defined"

- [ ] **Step 3: Write implementation**

```typescript
interface MoodIconProps {
  mood: 'sweet' | 'happy' | 'miss' | 'calm' | 'sad';
  size?: number;
  className?: string;
}

const moodConfig = {
  sweet: { color: '#F7C8D0', label: '甜甜的' },
  happy: { color: '#B8DDA8', label: '开心' },
  miss: { color: '#AFC9F7', label: '想念' },
  calm: { color: '#D8C7E8', label: '平静' },
  sad: { color: '#E8C4A0', label: '小难过' },
};

export function MoodIcon({ mood, size = 20, className }: MoodIconProps) {
  const config = moodConfig[mood];

  const icons: Record<string, React.ReactNode> = {
    sweet: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        role="img"
        aria-label={config.label}
        className={className}
      >
        <circle cx="10" cy="10" r="9" stroke={config.color} strokeWidth="1.2" />
        <circle cx="7" cy="8" r="1" fill={config.color} />
        <circle cx="13" cy="8" r="1" fill={config.color} />
        <path d="M6 12 Q10 15 14 12" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <circle cx="5" cy="10" r="1.2" fill={config.color} opacity="0.4" />
        <circle cx="15" cy="10" r="1.2" fill={config.color} opacity="0.4" />
      </svg>
    ),
    happy: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        role="img"
        aria-label={config.label}
        className={className}
      >
        <circle cx="10" cy="10" r="9" stroke={config.color} strokeWidth="1.2" />
        <path d="M5.5 8 Q7 6 8.5 8" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M11.5 8 Q13 6 14.5 8" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M5 11 Q10 16 15 11" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </svg>
    ),
    miss: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        role="img"
        aria-label={config.label}
        className={className}
      >
        <circle cx="10" cy="10" r="9" stroke={config.color} strokeWidth="1.2" />
        <path d="M6 8 Q7 7 8 8" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M12 8 Q13 7 14 8" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M7 11 Q10 13 13 11" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M9 5 Q10 3 11 5" stroke={config.color} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>
    ),
    calm: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        role="img"
        aria-label={config.label}
        className={className}
      >
        <circle cx="10" cy="10" r="9" stroke={config.color} strokeWidth="1.2" />
        <line x1="6" y1="8" x2="8" y2="8" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="12" y1="8" x2="14" y2="8" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7" y1="12" x2="13" y2="12" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    sad: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        role="img"
        aria-label={config.label}
        className={className}
      >
        <circle cx="10" cy="10" r="9" stroke={config.color} strokeWidth="1.2" />
        <circle cx="7" cy="8" r="1" fill={config.color} />
        <circle cx="13" cy="8" r="1" fill={config.color} />
        <path d="M6 14 Q10 11 14 14" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M8 6 Q10 5 12 6" stroke={config.color} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>
    ),
  };

  return <>{icons[mood]}</>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/components/illustrations/__tests__/MoodIcons.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/illustrations/MoodIcons.tsx src/components/illustrations/__tests__/MoodIcons.test.tsx
git commit -m "feat(illustrations): 添加 5 种心情 SVG 图标"
```

---

## Task 8: EmptyState Component

**Files:**
- Create: `src/components/illustrations/EmptyState.tsx`

- [ ] **Step 1: Write the component**

```typescript
interface EmptyStateProps {
  message?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  message = '还没有日记呢，翻开第一页吧',
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="float-animation">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          stroke="#8A7C78"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* 日记本 */}
          <rect x="20" y="15" width="40" height="50" rx="3" />
          <line x1="28" y1="15" x2="28" y2="65" />
          <path d="M32 25 H52" strokeWidth="1" />
          <path d="M32 32 H52" strokeWidth="1" />
          <path d="M32 39 H48" strokeWidth="1" />
          <path d="M32 46 H50" strokeWidth="1" />
          {/* 铅笔 */}
          <line x1="58" y1="55" x2="68" y2="45" />
          <polygon points="68,45 66,47 70,49" fill="#8A7C78" stroke="none" />
        </svg>
      </div>
      <p className="mt-3 text-sm text-text-sub">{message}</p>
      {children && <div className="mt-4">{children}</div>}

      <style jsx>{`
        .float-animation {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .float-animation {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/illustrations/EmptyState.tsx
git commit -m "feat(illustrations): 添加空状态插画组件"
```

---

## Task 9: CoverDecorations Component

**Files:**
- Create: `src/components/illustrations/CoverDecorations.tsx`

- [ ] **Step 1: Write the component**

```typescript
export function CoverDecorations() {
  return (
    <>
      {/* 岛屿线稿 - 静态锚点 */}
      <svg
        className="absolute top-[280px] left-5 w-[220px] h-[140px] opacity-40 pointer-events-none"
        viewBox="0 0 220 140"
        fill="none"
        stroke="#E8AEB7"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M20 115 Q45 70 90 65 Q115 35 150 58 Q185 45 205 115 Z" />
        <circle cx="65" cy="88" r="3.5" fill="#F7C8D0" stroke="none" />
        <circle cx="165" cy="82" r="3" fill="#F7C8D0" stroke="none" />
        <path d="M100 52 Q105 40 110 52 Q115 40 120 52" stroke="#B8DDA8" strokeWidth="1" />
        <path d="M140 62 Q145 50 150 62 Q155 50 160 62" stroke="#AFC9F7" strokeWidth="1" />
      </svg>

      {/* 云朵 1 - 水平飘动 */}
      <svg
        className="absolute top-[260px] right-5 w-[80px] h-[40px] opacity-35 pointer-events-none cloud-drift-1"
        viewBox="0 0 80 40"
        fill="none"
        stroke="#8A7C78"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M10 30 Q10 15 25 15 Q30 5 45 10 Q55 5 65 15 Q75 15 75 30 Z" />
      </svg>

      {/* 云朵 2 - 水平飘动 */}
      <svg
        className="absolute top-[460px] left-10 w-[60px] h-[30px] opacity-45 pointer-events-none cloud-drift-2"
        viewBox="0 0 60 30"
        fill="none"
        stroke="#8A7C78"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M8 22 Q8 12 18 12 Q22 5 32 8 Q40 5 48 12 Q55 12 55 22 Z" />
      </svg>

      {/* 小花 1 - 旋转摆动 */}
      <svg
        className="absolute top-[250px] left-[140px] w-7 h-7 opacity-45 pointer-events-none rotate-sway"
        viewBox="0 0 28 28"
        fill="none"
        stroke="#F7C8D0"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ transformOrigin: 'center' }}
      >
        <circle cx="14" cy="14" r="3.5" fill="#F7C8D0" fillOpacity="0.3" />
        <path d="M14 5 Q14 0 10 4 Q6 0 8 5 Q2 5 6 9 Q0 12 6 12 Q2 16 8 16 Q6 21 10 17 Q14 21 14 16 Q18 21 20 17 Q22 21 20 16 Q26 16 22 12 Q28 9 20 9 Q24 5 18 5 Q14 0 14 5Z" />
      </svg>

      {/* 心形 1 - 缩放脉冲 */}
      <svg
        className="absolute top-[420px] right-16 w-6 h-6 opacity-45 pointer-events-none scale-pulse"
        viewBox="0 0 24 24"
        fill="#E8AEB7"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      {/* 星星 1 - 缩放脉冲 */}
      <svg
        className="absolute top-[480px] left-24 w-5 h-5 opacity-40 pointer-events-none scale-pulse-delayed"
        viewBox="0 0 20 20"
        fill="#B8DDA8"
      >
        <path d="M10 1 L12 7 L18 7 L13 11 L15 17 L10 13 L5 17 L7 11 L2 7 L8 7Z" />
      </svg>

      {/* 心形 2（小）- 缩放脉冲 */}
      <svg
        className="absolute top-[320px] right-10 w-[18px] h-[18px] opacity-40 pointer-events-none scale-pulse"
        viewBox="0 0 24 24"
        fill="#E8AEB7"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>

      {/* 小花 2（小）- 旋转摆动 */}
      <svg
        className="absolute top-[300px] left-24 w-[22px] h-[22px] opacity-35 pointer-events-none rotate-sway-delayed"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#AFC9F7"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ transformOrigin: 'center' }}
      >
        <circle cx="12" cy="12" r="3" fill="#AFC9F7" fillOpacity="0.3" />
        <path d="M12 4 Q12 0 9 3 Q5 0 7 4 Q1 4 5 8 Q0 11 5 11 Q0 15 7 15 Q5 20 9 16 Q12 20 12 15 Q15 20 17 16 Q19 20 17 15 Q23 15 19 11 Q24 8 17 8 Q21 4 15 4 Q12 0 12 4Z" />
      </svg>

      <style jsx>{`
        .cloud-drift-1 {
          animation: drift1 10s ease-in-out infinite;
        }
        .cloud-drift-2 {
          animation: drift2 12s ease-in-out infinite;
        }
        .rotate-sway {
          animation: sway 6s ease-in-out infinite;
        }
        .rotate-sway-delayed {
          animation: sway 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        .scale-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        .scale-pulse-delayed {
          animation: pulse 4s ease-in-out infinite;
          animation-delay: 1.5s;
        }

        @keyframes drift1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-4px); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cloud-drift-1,
          .cloud-drift-2,
          .rotate-sway,
          .rotate-sway-delayed,
          .scale-pulse,
          .scale-pulse-delayed {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/illustrations/CoverDecorations.tsx
git commit -m "feat(illustrations): 添加封面装饰动画组件"
```

---

## Task 10: animations index.ts

**Files:**
- Create: `src/components/animations/index.ts`

- [ ] **Step 1: Write the file**

```typescript
export { useReducedMotion } from './useReducedMotion';
export { FadeIn } from './FadeIn';
export { SlideIn } from './SlideIn';
export { ScaleIn } from './ScaleIn';
export { StaggerContainer, StaggerItem } from './StaggerContainer';
export { Toast } from './Toast';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/animations/index.ts
git commit -m "feat(animations): 添加动画组件统一导出"
```

---

## Task 11: illustrations index.ts

**Files:**
- Create: `src/components/illustrations/index.ts`

- [ ] **Step 1: Write the file**

```typescript
export { MoodIcon } from './MoodIcons';
export { EmptyState } from './EmptyState';
export { CoverDecorations } from './CoverDecorations';
```

- [ ] **Step 2: Commit**

```bash
git add src/components/illustrations/index.ts
git commit -m "feat(illustrations): 添加插画组件统一导出"
```

---

## Task 12: 集成 DiaryTimeline

**Files:**
- Modify: `src/components/DiaryTimeline.tsx`

- [ ] **Step 1: Add imports and update empty state**

修改 `src/components/DiaryTimeline.tsx`：

```typescript
import Link from 'next/link';
import { Button } from 'animal-island-ui';
import dayjs from '@/lib/dayjs';
import type { DiaryEntry, DiaryImage } from '@prisma/client';
import { StaggerContainer, StaggerItem } from './animations';
import { EmptyState } from './illustrations';
```

- [ ] **Step 2: Replace empty state and add stagger to list**

将空状态返回替换为 `EmptyState` 组件：

```typescript
if (groups.size === 0) {
  return (
    <EmptyState>
      {showWriteButton && (
        <Link href="/diary/new">
          <Button type="primary">写下第一篇</Button>
        </Link>
      )}
    </EmptyState>
  );
}
```

将列表包裹在 `StaggerContainer` 中，每个条目用 `StaggerItem`：

```typescript
<StaggerContainer className="space-y-6">
  {Array.from(groups.entries()).map(([monthKey, entries]) => (
    <StaggerItem key={monthKey}>
      <section className="relative pl-6">
        {/* ... 原有内容 ... */}
        <StaggerContainer className="space-y-3 py-2">
          {entries.map((entry) => (
            <StaggerItem key={entry.id}>
              <li className="relative">
                {/* ... 原有内容 ... */}
              </li>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </StaggerItem>
  ))}
</StaggerContainer>
```

注意：需要调整 HTML 结构，将 `<li>` 移到 `StaggerItem` 内部并移除外层 `<ul>` 的包裹冲突。

- [ ] **Step 3: Run tests**

Run: `pnpm test src/components/__tests__/DiaryTimeline.test.tsx`

Expected: PASS（DiaryTimeline 现有测试不应被破坏）

- [ ] **Step 4: Commit**

```bash
git add src/components/DiaryTimeline.tsx
git commit -m "feat(DiaryTimeline): 集成 stagger 动画和空状态插画"
```

---

## Task 13: 集成 DiaryDetail

**Files:**
- Modify: `src/components/DiaryDetail.tsx`

- [ ] **Step 1: Add import and replace mood dot**

```typescript
import dayjs from 'dayjs';
import Image from 'next/image';
import type { DiaryEntry, DiaryImage } from '@prisma/client';
import { MoodIcon } from './illustrations';
```

在心情标签区域，将纯色圆点替换为 `MoodIcon`：

```typescript
<span
  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
  style={{ backgroundColor: mood.color + '33' }}
>
  <MoodIcon mood={entry.mood as 'sweet' | 'happy' | 'miss' | 'calm' | 'sad'} size={16} />
  {mood.label}
</span>
```

- [ ] **Step 2: Run tests**

Run: `pnpm test src/components/__tests__/DiaryDetail.test.tsx`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/DiaryDetail.tsx
git commit -m "feat(DiaryDetail): 心情圆点替换为 SVG 图标"
```

---

## Task 14: 集成 DiaryForm

**Files:**
- Modify: `src/components/DiaryForm.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { Input, Button } from 'animal-island-ui';
import { Toast } from './animations';
import { motion } from 'framer-motion';
```

- [ ] **Step 2: Replace static success message with Toast**

将：
```typescript
{success && (
  <div className="px-4 py-3 rounded-lg bg-primary/20 text-text-main text-sm text-center">
    {mode === 'edit' ? '修改已经收藏好了' : '今天的心情已经收藏好了'}
  </div>
)}
```

替换为：
```typescript
<Toast
  message={mode === 'edit' ? '修改已经收藏好了' : '今天的心情已经收藏好了'}
  visible={success}
  onClose={() => setSuccess(false)}
/>
```

注意：当 `success` 为 true 时 Toast 显示，导航后组件卸载自然消失；也可以让 Toast 的 onClose 在 2 秒后自动调用 `setSuccess(false)`，但由于导航会在 1.5 秒后发生，这个交互可以接受。如需更精确控制，可将 `autoClose` 设为 1500 与导航同步。

- [ ] **Step 3: Add whileTap to save button**

将保存按钮包裹在 `motion.div` 中或直接使用 `motion.button`。由于 Button 来自 animal-island-ui，可能需要在外层包裹：

```typescript
<motion.div whileTap={{ scale: 0.96 }} transition={{ duration: 0.1 }}>
  <Button
    type="primary"
    block
    loading={saving}
    disabled={saving}
    htmlType="button"
    onClick={handleSubmit}
  >
    保存
  </Button>
</motion.div>
```

- [ ] **Step 4: Run tests**

Run: `pnpm test src/components/__tests__/DiaryForm.test.tsx`

Expected: PASS（可能需要更新测试中查找成功提示的断言）

- [ ] **Step 5: Commit**

```bash
git add src/components/DiaryForm.tsx
git commit -m "feat(DiaryForm): 集成 Toast 动画和按钮点击反馈"
```

---

## Task 15: 集成 MoodSelector

**Files:**
- Modify: `src/components/MoodSelector.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { MoodIcon } from './illustrations';
```

- [ ] **Step 2: Add MoodIcon to selected button and dropdown items**

在选中按钮中，将色块替换为 `MoodIcon`：

```typescript
<motion.span
  animate={{ scale: 1.3 }}
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 10,
    repeat: 1,
    repeatType: 'reverse',
  }}
  key={selected.value}
>
  <MoodIcon mood={selected.value} size={16} />
</motion.span>
```

在下拉选项中也添加 `MoodIcon`：

```typescript
<motion.span
  whileTap={{ scale: 0.8 }}
  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
>
  <MoodIcon mood={mood.value} size={16} />
</motion.span>
```

注意：需要保留 `style` 相关的背景色设置或确认 `MoodIcon` 已经包含颜色。由于 `MoodIcon` 内部使用 `moodConfig` 的颜色，可以移除外层手动设置的背景色样式。

- [ ] **Step 3: Add whileTap to trigger button**

```typescript
<motion.button
  type="button"
  onClick={() => setOpen(!open)}
  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-soft bg-card"
  aria-expanded={open}
  aria-haspopup="listbox"
  whileTap={{ scale: 0.96 }}
  transition={{ duration: 0.1 }}
>
  {/* ... */}
</motion.button>
```

- [ ] **Step 4: Run tests**

Run: `pnpm test src/components/__tests__/MoodSelector.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/MoodSelector.tsx
git commit -m "feat(MoodSelector): 集成心情 SVG 图标和按钮点击反馈"
```

---

## Task 16: 集成弹窗动画

**Files:**
- Modify: `src/components/PasswordModal.tsx`
- Modify: `src/components/DeleteConfirmModal.tsx`

- [ ] **Step 1: PasswordModal - add ScaleIn**

```typescript
import { ScaleIn } from './animations';
```

将弹窗内容 div 包裹在 `ScaleIn` 中：

```typescript
<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
  <ScaleIn>
    <div className='w-full max-w-[320px] mx-4 bg-card rounded-2xl border border-border-soft shadow-lg p-6'>
      {/* ... 原有内容 ... */}
    </div>
  </ScaleIn>
</div>
```

- [ ] **Step 2: DeleteConfirmModal - add ScaleIn**

```typescript
import { ScaleIn } from './animations';
```

由于 `DeleteConfirmModal` 使用 `animal-island-ui` 的 `Modal` 组件，可以在外层包裹 `ScaleIn`：

```typescript
<ScaleIn>
  <Modal
    open={open}
    title="要删除这篇日记吗？"
    /* ... */
  >
    <p className="text-text-sub text-sm">删除后就不能在这里看到它了</p>
  </Modal>
</ScaleIn>
```

注意：如果 `Modal` 自带 open/close 动画，`ScaleIn` 可能与内部动画冲突。需要测试确认。如冲突，可以仅对 `PasswordModal` 加 `ScaleIn`，对 `DeleteConfirmModal` 暂不加（因为使用 UI 库组件）。

- [ ] **Step 3: Run tests**

Run:
```bash
pnpm test src/components/__tests__/PasswordModal.test.tsx
pnpm test src/components/__tests__/DeleteConfirmModal.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/PasswordModal.tsx src/components/DeleteConfirmModal.tsx
git commit -m "feat(modals): 集成弹窗缩放淡入动画"
```

---

## Task 17: 集成封面页装饰

**Files:**
- Modify: `src/app/(protected)/page.tsx`

- [ ] **Step 1: Add import and replace decorations**

```typescript
import { CoverDecorations } from '@/components/illustrations';
```

将页面中所有 6 个静态 SVG 装饰块替换为：

```typescript
<CoverDecorations />
```

- [ ] **Step 2: Run tests / build**

Run: `pnpm build`

Expected: PASS（无编译错误）

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/page.tsx
git commit -m "feat(cover): 封面装饰替换为动画增强组件"
```

---

## Task 18: 运行全部测试

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`

Expected: All tests PASS

- [ ] **Step 2: Commit if any test fixes needed**

如果有测试失败，修复后提交：

```bash
git add -A
git commit -m "test: 修复动画集成后的测试"
```

---

## Task 19: Build 验证

- [ ] **Step 1: Run production build**

Run: `pnpm build`

Expected: BUILD SUCCESS（无 TypeScript 错误，无 ESLint 错误）

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "feat: Issue #11 动画系统与插画实现完成"
```

---

## Self-Review

### 1. Spec Coverage

| Spec 要求 | 对应 Task |
|-----------|----------|
| useReducedMotion hook | Task 1 |
| FadeIn | Task 2 |
| SlideIn | Task 3 |
| ScaleIn | Task 4 |
| StaggerContainer | Task 5 |
| Toast | Task 6 |
| 心情图标 | Task 7 |
| 空状态插画 | Task 8 |
| 封面装饰 | Task 9 |
| DiaryTimeline 集成 | Task 12 |
| DiaryDetail 集成 | Task 13 |
| DiaryForm 集成 | Task 14 |
| MoodSelector 集成 | Task 15 |
| 弹窗集成 | Task 16 |
| 封面页集成 | Task 17 |
| reduced-motion 测试 | Task 1, 18 |
| 构建验证 | Task 19 |

无遗漏。

### 2. Placeholder Scan

- 无 TBD/TODO
- 无 "implement later"
- 所有步骤包含完整代码
- 所有步骤包含具体命令和预期输出

### 3. Type Consistency

- `useReducedMotion` 返回 `boolean`，所有动画组件内部一致使用
- `MoodIcon` 的 `mood` prop 类型在 Task 7 和 Task 13 中一致
- `Toast` 的 `visible` prop 类型在 Task 6 和 Task 14 中一致

无类型不一致问题。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-07-animation-system.md`.**

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
