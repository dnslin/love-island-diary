# Issue #8：单篇日记页 + 翻书动画 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现单篇日记阅读页，支持上一篇/下一篇导航、3D 翻书动画、左右滑动手势。

**Architecture:** Server Component 页面获取数据，Client Component `PageFlipWrapper` 管理翻书动画和手势。`DiaryNavigation` 处理底部导航按钮。动画完成后通过 `router.push` 导航到新 URL。

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS v4, Framer Motion, Prisma + SQLite, Jest + React Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/DiaryDetail.tsx` | Modify | 添加篇数序号展示 |
| `src/components/PageFlipWrapper.tsx` | Create | 3D 翻书动画 + 手势检测 + 动画锁 |
| `src/components/DiaryNavigation.tsx` | Create | 底部导航按钮（上一篇/下一篇/时间线） |
| `src/app/diary/[id]/page.tsx` | Modify | 数据获取、篇数计算、组件整合 |
| `src/components/__tests__/DiaryDetail.test.tsx` | Create | DiaryDetail 组件测试 |
| `src/components/__tests__/DiaryNavigation.test.tsx` | Create | DiaryNavigation 组件测试 |
| `src/components/__tests__/PageFlipWrapper.test.tsx` | Create | PageFlipWrapper 组件测试 |

---

## Helper: makeEntry

测试文件中复用以下 helper：

```typescript
import type { DiaryEntry, DiaryImage } from '@prisma/client';

type Entry = DiaryEntry & { images: DiaryImage[] };

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: overrides.id ?? 'id1',
    date: overrides.date ?? new Date('2025-01-15'),
    title: overrides.title ?? 'Test Title',
    content: overrides.content ?? 'content',
    mood: overrides.mood ?? 'sweet',
    weather: overrides.weather ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    images: overrides.images ?? [],
  } as Entry;
}
```

---

## Task 1: DiaryDetail 篇数序号

**Files:**
- Modify: `src/components/DiaryDetail.tsx`
- Test: `src/components/__tests__/DiaryDetail.test.tsx`

### Step 1: 写测试（先失败）

创建 `src/components/__tests__/DiaryDetail.test.tsx`：

```tsx
import { render, screen } from '@testing-library/react';
import { DiaryDetail } from '../DiaryDetail';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

type Entry = DiaryEntry & { images: DiaryImage[] };

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: overrides.id ?? 'id1',
    date: overrides.date ?? new Date('2025-01-15'),
    title: overrides.title ?? 'Test Title',
    content: overrides.content ?? 'content',
    mood: overrides.mood ?? 'sweet',
    weather: overrides.weather ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
    images: overrides.images ?? [],
  } as Entry;
}

describe('DiaryDetail', () => {
  test('renders entry number when provided', () => {
    render(<DiaryDetail entry={makeEntry()} entryNumber={12} />);
    expect(screen.getByText('第 12 篇')).toBeInTheDocument();
  });

  test('does not render entry number when not provided', () => {
    render(<DiaryDetail entry={makeEntry()} />);
    expect(screen.queryByText(/第 \d+ 篇/)).not.toBeInTheDocument();
  });

  test('renders title and content', () => {
    render(<DiaryDetail entry={makeEntry({ title: 'My Day', content: 'Had fun' })} />);
    expect(screen.getByText('My Day')).toBeInTheDocument();
    expect(screen.getByText('Had fun')).toBeInTheDocument();
  });

  test('renders fallback title when title is null', () => {
    render(<DiaryDetail entry={makeEntry({ title: null })} />);
    expect(screen.getByText('2025年1月15日 的心情')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest src/components/__tests__/DiaryDetail.test.tsx`
Expected: FAIL — `entryNumber` prop 不存在

- [ ] **Step 3: 修改 DiaryDetail 添加篇数序号**

修改 `src/components/DiaryDetail.tsx`：

```tsx
interface DiaryDetailProps {
  entry: DiaryEntry & { images: DiaryImage[] };
  entryNumber?: number;
}

export function DiaryDetail({ entry, entryNumber }: DiaryDetailProps) {
  // ... existing code ...

  return (
    <article className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-text-sub">
          <span>{dayjs(entry.date).format('YYYY年M月D日')}</span>
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: mood.color + '33' }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: mood.color }}
            />
            {mood.label}
          </span>
        </div>
        {entryNumber !== undefined && (
          <span className="text-sm text-text-sub">第 {entryNumber} 篇</span>
        )}
      </div>

      <h1 className="text-xl font-bold text-text-main">{displayTitle}</h1>

      <p className="text-base text-text-main whitespace-pre-wrap leading-relaxed">
        {entry.content}
      </p>

      {/* images section remains unchanged */}
    </article>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest src/components/__tests__/DiaryDetail.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/DiaryDetail.tsx src/components/__tests__/DiaryDetail.test.tsx
git commit -m "feat(DiaryDetail): 添加篇数序号展示"
```

---

## Task 2: DiaryNavigation 底部导航组件

**Files:**
- Create: `src/components/DiaryNavigation.tsx`
- Test: `src/components/__tests__/DiaryNavigation.test.tsx`

### Step 1: 写测试（先失败）

创建 `src/components/__tests__/DiaryNavigation.test.tsx`：

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DiaryNavigation } from '../DiaryNavigation';

const mockOnPrev = jest.fn();
const mockOnNext = jest.fn();

describe('DiaryNavigation', () => {
  beforeEach(() => {
    mockOnPrev.mockClear();
    mockOnNext.mockClear();
  });

  test('renders all buttons when both neighbors exist', () => {
    render(<DiaryNavigation prevId="prev1" nextId="next1" onPrev={mockOnPrev} onNext={mockOnNext} />);
    expect(screen.getByRole('link', { name: /时间线/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /上一篇/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下一篇/ })).toBeInTheDocument();
  });

  test('hides prev button when prevId is null', () => {
    render(<DiaryNavigation prevId={null} nextId="next1" onPrev={mockOnPrev} onNext={mockOnNext} />);
    expect(screen.queryByRole('button', { name: /上一篇/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下一篇/ })).toBeInTheDocument();
  });

  test('hides next button when nextId is null', () => {
    render(<DiaryNavigation prevId="prev1" nextId={null} onPrev={mockOnPrev} onNext={mockOnNext} />);
    expect(screen.getByRole('button', { name: /上一篇/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /下一篇/ })).not.toBeInTheDocument();
  });

  test('hides both nav buttons when both ids are null', () => {
    render(<DiaryNavigation prevId={null} nextId={null} onPrev={mockOnPrev} onNext={mockOnNext} />);
    expect(screen.queryByRole('button', { name: /上一篇/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /下一篇/ })).not.toBeInTheDocument();
  });

  test('calls onPrev when prev button clicked', () => {
    render(<DiaryNavigation prevId="prev1" nextId="next1" onPrev={mockOnPrev} onNext={mockOnNext} />);
    fireEvent.click(screen.getByRole('button', { name: /上一篇/ }));
    expect(mockOnPrev).toHaveBeenCalledTimes(1);
  });

  test('calls onNext when next button clicked', () => {
    render(<DiaryNavigation prevId="prev1" nextId="next1" onPrev={mockOnPrev} onNext={mockOnNext} />);
    fireEvent.click(screen.getByRole('button', { name: /下一篇/ }));
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  test('timeline button links to /diary', () => {
    render(<DiaryNavigation prevId="prev1" nextId="next1" onPrev={mockOnPrev} onNext={mockOnNext} />);
    expect(screen.getByRole('link', { name: /时间线/ })).toHaveAttribute('href', '/diary');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest src/components/__tests__/DiaryNavigation.test.tsx`
Expected: FAIL — DiaryNavigation 组件不存在

- [ ] **Step 3: 实现 DiaryNavigation 组件**

创建 `src/components/DiaryNavigation.tsx`：

```tsx
'use client';

import Link from 'next/link';

interface DiaryNavigationProps {
  prevId: string | null;
  nextId: string | null;
  onPrev: () => void;
  onNext: () => void;
}

export function DiaryNavigation({ prevId, nextId, onPrev, onNext }: DiaryNavigationProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      <Link
        href="/diary"
        className="inline-flex items-center gap-1.5 text-sm text-text-sub hover:text-text-main transition-colors"
        aria-label="时间线"
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

      <div className="flex items-center gap-3">
        {prevId && (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-text-sub hover:text-text-main bg-card border border-border-soft rounded-full transition-colors"
            aria-label="上一篇"
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
        {nextId && (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-text-sub hover:text-text-main bg-card border border-border-soft rounded-full transition-colors"
            aria-label="下一篇"
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
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest src/components/__tests__/DiaryNavigation.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/DiaryNavigation.tsx src/components/__tests__/DiaryNavigation.test.tsx
git commit -m "feat(DiaryNavigation): 添加底部上一篇/下一篇/时间线导航"
```

---

## Task 3: PageFlipWrapper 翻书动画组件

**Files:**
- Create: `src/components/PageFlipWrapper.tsx`
- Test: `src/components/__tests__/PageFlipWrapper.test.tsx`

### Step 1: 写测试（先失败）

创建 `src/components/__tests__/PageFlipWrapper.test.tsx`：

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PageFlipWrapper } from '../PageFlipWrapper';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('PageFlipWrapper', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test('renders children content', () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId="next1" currentId="id1">
        <div data-testid="content">Diary Content</div>
      </PageFlipWrapper>
    );
    expect(screen.getByTestId('content')).toHaveTextContent('Diary Content');
  });

  test('calls router.push with prevId when prev button clicked', async () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId="next1" currentId="id1">
        <div>Content</div>
      </PageFlipWrapper>
    );
    const prevBtn = screen.getByRole('button', { name: /上一篇/ });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/diary/prev1');
    });
  });

  test('calls router.push with nextId when next button clicked', async () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId="next1" currentId="id1">
        <div>Content</div>
      </PageFlipWrapper>
    );
    const nextBtn = screen.getByRole('button', { name: /下一篇/ });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/diary/next1');
    });
  });

  test('hides prev button when prevId is null', () => {
    render(
      <PageFlipWrapper prevId={null} nextId="next1" currentId="id1">
        <div>Content</div>
      </PageFlipWrapper>
    );
    expect(screen.queryByRole('button', { name: /上一篇/ })).not.toBeInTheDocument();
  });

  test('hides next button when nextId is null', () => {
    render(
      <PageFlipWrapper prevId="prev1" nextId={null} currentId="id1">
        <div>Content</div>
      </PageFlipWrapper>
    );
    expect(screen.queryByRole('button', { name: /下一篇/ })).not.toBeInTheDocument();
  });

  test('hides both buttons when both are null', () => {
    render(
      <PageFlipWrapper prevId={null} nextId={null} currentId="id1">
        <div>Content</div>
      </PageFlipWrapper>
    );
    expect(screen.queryByRole('button', { name: /上一篇/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /下一篇/ })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest src/components/__tests__/PageFlipWrapper.test.tsx`
Expected: FAIL — PageFlipWrapper 组件不存在

- [ ] **Step 3: 实现 PageFlipWrapper 组件**

创建 `src/components/PageFlipWrapper.tsx`：

```tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type Direction = 'left' | 'right';

interface PageFlipWrapperProps {
  children: React.ReactNode;
  prevId: string | null;
  nextId: string | null;
  currentId: string;
}

export function PageFlipWrapper({ children, prevId, nextId, currentId }: PageFlipWrapperProps) {
  const router = useRouter();
  const [direction, setDirection] = useState<Direction | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const navigate = useCallback(
    (targetId: string, dir: Direction) => {
      if (prefersReducedMotion) {
        router.push(`/diary/${targetId}`);
        return;
      }
      setDirection(dir);
      setIsAnimating(true);
    },
    [router, prefersReducedMotion]
  );

  const handleAnimationComplete = useCallback(() => {
    if (direction === 'left' && prevId) {
      router.push(`/diary/${prevId}`);
    } else if (direction === 'right' && nextId) {
      router.push(`/diary/${nextId}`);
    }
    setIsAnimating(false);
    setDirection(null);
  }, [direction, prevId, nextId, router]);

  const goToPrev = useCallback(() => {
    if (isAnimating || !prevId) return;
    navigate(prevId, 'left');
  }, [isAnimating, prevId, navigate]);

  const goToNext = useCallback(() => {
    if (isAnimating || !nextId) return;
    navigate(nextId, 'right');
  }, [isAnimating, nextId, navigate]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isAnimating) return;
      touchStartX.current = e.touches[0].clientX;
    },
    [isAnimating]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (isAnimating || touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (diff > 80) {
        goToPrev();
      } else if (diff < -80) {
        goToNext();
      }
      touchStartX.current = null;
    },
    [isAnimating, goToPrev, goToNext]
  );

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
            aria-label="返回封面"
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

          <div className="flex items-center gap-3">
            {prevId && (
              <button
                type="button"
                onClick={goToPrev}
                disabled={isAnimating}
                className="text-text-sub hover:text-text-main transition-colors disabled:opacity-50"
                aria-label="上一篇"
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
            {nextId && (
              <button
                type="button"
                onClick={goToNext}
                disabled={isAnimating}
                className="text-text-sub hover:text-text-main transition-colors disabled:opacity-50"
                aria-label="下一篇"
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
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentId}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              onAnimationComplete={handleAnimationComplete}
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="bg-card rounded-2xl p-4 shadow-sm">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部导航 */}
        <div className="mt-6 flex items-center justify-between">
          <Link
            href="/diary"
            className="inline-flex items-center gap-1.5 text-sm text-text-sub hover:text-text-main transition-colors"
            aria-label="时间线"
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

          <div className="flex items-center gap-3">
            {prevId && (
              <button
                type="button"
                onClick={goToPrev}
                disabled={isAnimating}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-text-sub hover:text-text-main bg-card border border-border-soft rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="上一篇"
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
            {nextId && (
              <button
                type="button"
                onClick={goToNext}
                disabled={isAnimating}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-text-sub hover:text-text-main bg-card border border-border-soft rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="下一篇"
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
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest src/components/__tests__/PageFlipWrapper.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/PageFlipWrapper.tsx src/components/__tests__/PageFlipWrapper.test.tsx
git commit -m "feat(PageFlipWrapper): 3D 翻书动画 + 手势检测 + 导航"
```

---

## Task 4: 整合 diary/[id]/page.tsx

**Files:**
- Modify: `src/app/diary/[id]/page.tsx`

### Step 1: 修改 page.tsx

将 `src/app/diary/[id]/page.tsx` 替换为：

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDiaryById, getDiaryNeighbors, getDiaryList } from '@/lib/actions';
import { PageFlipWrapper } from '@/components/PageFlipWrapper';
import { DiaryDetail } from '@/components/DiaryDetail';

interface DiaryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DiaryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDiaryById(id);
  return {
    title: entry?.title || '日记详情',
  };
}

export default async function DiaryDetailPage({
  params,
}: DiaryDetailPageProps) {
  const { id } = await params;
  const [entry, { prev, next }, allEntries] = await Promise.all([
    getDiaryById(id),
    getDiaryNeighbors(id),
    getDiaryList(),
  ]);

  if (!entry) {
    notFound();
  }

  const entryNumber = allEntries.length - allEntries.findIndex((e) => e.id === id);

  return (
    <PageFlipWrapper prevId={prev} nextId={next} currentId={id}>
      <DiaryDetail entry={entry} entryNumber={entryNumber} />
    </PageFlipWrapper>
  );
}
```

- [ ] **Step 2: 运行构建确认无错误**

Run: `pnpm build`
Expected: Build 成功，无 TypeScript 错误

- [ ] **Step 3: Commit**

```bash
git add src/app/diary/[id]/page.tsx
git commit -m "feat(diary/[id]): 整合翻书动画、篇数序号、邻居导航"
```

---

## Task 5: 全量验证

- [ ] **Step 1: 运行全部测试**

Run: `npx jest`
Expected: 所有测试通过（包括新增和已有测试）

- [ ] **Step 2: 运行 ESLint**

Run: `pnpm lint`
Expected: 无错误，无警告

- [ ] **Step 3: 运行构建**

Run: `pnpm build`
Expected: Build 成功

- [ ] **Step 4: Commit（如 lint 或测试有修改）**

```bash
git add -A
git commit -m "fix: lint and test fixes" || echo "No changes to commit"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 篇数序号展示 | Task 1 |
| 上一篇/下一篇导航按钮 | Task 2, Task 3 |
| Framer Motion 翻书动画 | Task 3 |
| 左右滑动手势 | Task 3 |
| 时间线按钮 | Task 2, Task 3 |
| 返回封面按钮 | Task 3 |
| 第一篇/最后一篇边界隐藏 | Task 2, Task 3 |
| prefers-reduced-motion | Task 3 |
| 动画期间禁用交互 | Task 3 |
| 日记卡片大圆角 + 奶油色边框 | Task 3 (bg-card rounded-2xl) |
| 图片自适应 + 圆角 | Task 1 (已有) |

### Placeholder Scan

- [x] 无 "TBD", "TODO", "implement later"
- [x] 无 "Add appropriate error handling" 等模糊描述
- [x] 每个测试都包含具体断言
- [x] 每个代码步骤都包含完整代码块

### Type Consistency

- [x] `getDiaryNeighbors` 返回 `{ prev, next }`（与 actions.ts 一致）
- [x] `DiaryDetailProps.entryNumber` 为 `number`（非 string）
- [x] `PageFlipWrapper` 接收 `currentId: string` 作为 AnimatePresence key
