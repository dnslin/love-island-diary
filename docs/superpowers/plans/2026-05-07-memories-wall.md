# Issue #12 回忆照片墙 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现回忆照片墙页面，瀑布流展示所有日记外链图片，支持入场动画、懒加载、双页面入口。

**Architecture:** Server Component (`page.tsx`) 获取 `DiaryImage` 数据并传递给 Client Component (`MasonryGrid`)。`MasonryGrid` 用 ResizeObserver 响应式计算列数（2/3 列），按索引轮询分配图片到各列形成瀑布流效果。每张图片用 `MemoryCard` 包裹，集成 `StaggerItem` 入场动画和 `loading="lazy"` 懒加载。

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Framer Motion, Jest, @testing-library/react

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/actions.ts` | Modify | 新增 `getAllDiaryImages` Server Action |
| `src/lib/__tests__/actions.test.ts` | Modify | 追加 `getAllDiaryImages` 测试 |
| `src/components/MemoryCard.tsx` | Create | 单张图片卡片：懒加载、错误占位、点击跳转、hover 效果 |
| `src/components/__tests__/MemoryCard.test.tsx` | Create | MemoryCard 渲染、点击跳转、错误状态测试 |
| `src/components/MasonryGrid.tsx` | Create | 瀑布流布局：ResizeObserver 响应式列数、轮询分配、StaggerContainer 动画 |
| `src/components/__tests__/MasonryGrid.test.tsx` | Create | MasonryGrid 列数、分配逻辑、空状态测试 |
| `src/components/EmptyMemories.tsx` | Create | 空状态组件（复用 EmptyState） |
| `src/components/__tests__/EmptyMemories.test.tsx` | Create | EmptyMemories 渲染、文案、跳转测试 |
| `src/app/memories/page.tsx` | Create | 照片墙页面 Server Component |
| `src/components/CoverActions.tsx` | Modify | 添加"回忆照片墙"入口链接 |
| `src/app/diary/page.tsx` | Modify | 标题旁添加"照片墙"入口链接 |

---

### Task 1: Server Action `getAllDiaryImages`

**Files:**
- Modify: `src/lib/actions.ts`
- Modify: `src/lib/__tests__/actions.test.ts`

- [ ] **Step 1: 写 failing test**

在 `src/lib/__tests__/actions.test.ts` 的 import 语句中追加 `getAllDiaryImages`：

```typescript
import {
  createDiary,
  getDiaryById,
  getDiaryList,
  updateDiary,
  deleteDiary,
  getDiaryNeighbors,
  getCoupleProfile,
  updateCoupleProfile,
  getCoverStats,
  saveCoupleProfileAction,
  getAllDiaryImages,
} from '../actions';
```

在文件末尾追加测试：

```typescript
describe('getAllDiaryImages', () => {
  test('返回所有图片并按日记日期倒序排列', async () => {
    const entry1 = await createDiary({
      date: new Date('2025-01-15'),
      title: '第一次约会',
      content: '内容1',
      mood: 'happy',
      images: ['https://example.com/photo1.jpg'],
    });

    const entry2 = await createDiary({
      date: new Date('2025-02-20'),
      title: '情人节',
      content: '内容2',
      mood: 'sweet',
      images: ['https://example.com/photo2.jpg', 'https://example.com/photo3.jpg'],
    });

    const images = await getAllDiaryImages();

    expect(images).toHaveLength(3);
    // 按日期倒序：entry2 的图片在前
    expect(images[0].entryId).toBe(entry2.id);
    expect(images[1].entryId).toBe(entry2.id);
    expect(images[2].entryId).toBe(entry1.id);
    expect(images[0].url).toBe('https://example.com/photo2.jpg');
  });

  test('空数据时返回空数组', async () => {
    const images = await getAllDiaryImages();
    expect(images).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/lib/__tests__/actions.test.ts -t "getAllDiaryImages"`
Expected: FAIL with "getAllDiaryImages is not defined" 或类似错误

- [ ] **Step 3: 实现 `getAllDiaryImages`**

在 `src/lib/actions.ts` 的 `getCoverStats` 函数之后追加：

```typescript
export async function getAllDiaryImages() {
  return prisma.diaryImage.findMany({
    orderBy: {
      entry: { date: 'desc' },
    },
    include: { entry: { select: { id: true, date: true } } },
  });
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test -- src/lib/__tests__/actions.test.ts -t "getAllDiaryImages"`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions.ts src/lib/__tests__/actions.test.ts
git commit -m "feat(actions): 添加 getAllDiaryImages Server Action"
```

---

### Task 2: MemoryCard 组件

**Files:**
- Create: `src/components/MemoryCard.tsx`
- Create: `src/components/__tests__/MemoryCard.test.tsx`

- [ ] **Step 1: 写 failing test**

创建 `src/components/__tests__/MemoryCard.test.tsx`：

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryCard } from '../MemoryCard';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../animations', () => ({
  StaggerItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe('MemoryCard', () => {
  const mockImage = {
    id: 'img1',
    url: 'https://example.com/photo.jpg',
    entryId: 'entry1',
  };

  test('渲染图片和链接', () => {
    render(<MemoryCard image={mockImage} />);
    const img = screen.getByAltText('回忆照片');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img.closest('a')).toHaveAttribute('href', '/diary/entry1');
  });

  test('图片加载失败时显示占位符', () => {
    render(<MemoryCard image={mockImage} />);
    const img = screen.getByAltText('回忆照片');
    fireEvent.error(img);
    expect(screen.getByText('图片加载失败')).toBeInTheDocument();
    expect(img).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/components/__tests__/MemoryCard.test.tsx`
Expected: FAIL with "Cannot find module '../MemoryCard'"

- [ ] **Step 3: 实现 MemoryCard**

创建 `src/components/MemoryCard.tsx`：

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { StaggerItem } from './animations';

interface MemoryCardProps {
  image: {
    id: string;
    url: string;
    entryId: string;
  };
}

export function MemoryCard({ image }: MemoryCardProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <StaggerItem>
      <Link href={`/diary/${image.entryId}`} className="block">
        {hasError ? (
          <div className="w-full aspect-4/3 bg-border-soft rounded-xl flex items-center justify-center">
            <span className="text-xs text-text-sub">图片加载失败</span>
          </div>
        ) : (
          <img
            src={image.url}
            alt="回忆照片"
            loading="lazy"
            className="w-full h-auto rounded-xl object-cover hover:scale-[1.02] hover:shadow-md transition-all duration-200"
            onError={() => setHasError(true)}
          />
        )}
      </Link>
    </StaggerItem>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test -- src/components/__tests__/MemoryCard.test.tsx`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/components/MemoryCard.tsx src/components/__tests__/MemoryCard.test.tsx
git commit -m "feat(memories): 添加 MemoryCard 组件"
```

---

### Task 3: MasonryGrid 组件

**Files:**
- Create: `src/components/MasonryGrid.tsx`
- Create: `src/components/__tests__/MasonryGrid.test.tsx`

- [ ] **Step 1: 写 failing test**

创建 `src/components/__tests__/MasonryGrid.test.tsx`：

```typescript
import { render, screen, act } from '@testing-library/react';
import { MasonryGrid } from '../MasonryGrid';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../animations', () => ({
  StaggerContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stagger-container">{children}</div>
  ),
  StaggerItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

let resizeCallback: ((entries: Array<{ contentRect: { width: number } }>) => void) | null = null;

class MockResizeObserver {
  constructor(callback: typeof resizeCallback) {
    resizeCallback = callback;
  }
  observe = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe('MasonryGrid', () => {
  const mockImages = [
    { id: '1', url: 'https://example.com/1.jpg', entryId: 'e1' },
    { id: '2', url: 'https://example.com/2.jpg', entryId: 'e2' },
    { id: '3', url: 'https://example.com/3.jpg', entryId: 'e3' },
    { id: '4', url: 'https://example.com/4.jpg', entryId: 'e4' },
  ];

  test('渲染所有图片卡片', () => {
    render(<MasonryGrid images={mockImages} />);
    expect(screen.getAllByAltText('回忆照片')).toHaveLength(4);
  });

  test('空数组时不渲染图片', () => {
    render(<MasonryGrid images={[]} />);
    expect(screen.queryAllByAltText('回忆照片')).toHaveLength(0);
  });

  test('触发 ResizeObserver 回调后列数变化', () => {
    render(<MasonryGrid images={mockImages} />);
    // 初始宽度默认为 0，列数为 2
    const containers = screen.getAllByTestId('stagger-container');
    expect(containers).toHaveLength(2);

    // 模拟宽度 >= 640px，应变为 3 列
    act(() => {
      resizeCallback?.([{ contentRect: { width: 700 } }]);
    });

    const containersAfter = screen.getAllByTestId('stagger-container');
    expect(containersAfter).toHaveLength(3);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/components/__tests__/MasonryGrid.test.tsx`
Expected: FAIL with "Cannot find module '../MasonryGrid'"

- [ ] **Step 3: 实现 MasonryGrid**

创建 `src/components/MasonryGrid.tsx`：

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { MemoryCard } from './MemoryCard';
import { StaggerContainer } from './animations';

interface ImageItem {
  id: string;
  url: string;
  entryId: string;
}

interface MasonryGridProps {
  images: ImageItem[];
}

function getColumnCount(width: number): number {
  return width >= 640 ? 3 : 2;
}

export function MasonryGrid({ images }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setColumnCount(getColumnCount(entry.contentRect.width));
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const columns: ImageItem[][] = Array.from(
    { length: columnCount },
    () => [],
  );
  images.forEach((image, index) => {
    columns[index % columnCount].push(image);
  });

  return (
    <div ref={containerRef} className="flex gap-2">
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-2">
          <StaggerContainer>
            {col.map((image) => (
              <MemoryCard key={image.id} image={image} />
            ))}
          </StaggerContainer>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test -- src/components/__tests__/MasonryGrid.test.tsx`
Expected: PASS (3 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/components/MasonryGrid.tsx src/components/__tests__/MasonryGrid.test.tsx
git commit -m "feat(memories): 添加 MasonryGrid 瀑布流组件"
```

---

### Task 4: EmptyMemories 组件

**Files:**
- Create: `src/components/EmptyMemories.tsx`
- Create: `src/components/__tests__/EmptyMemories.test.tsx`

- [ ] **Step 1: 写 failing test**

创建 `src/components/__tests__/EmptyMemories.test.tsx`：

```typescript
import { render, screen } from '@testing-library/react';
import { EmptyMemories } from '../EmptyMemories';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('animal-island-ui', () => ({
  Button: ({ children, type }: { children: React.ReactNode; type?: string }) => (
    <button data-type={type}>{children}</button>
  ),
}));

jest.mock('../illustrations', () => ({
  EmptyState: ({
    message,
    children,
  }: {
    message?: string;
    children?: React.ReactNode;
  }) => (
    <div>
      <p>{message}</p>
      {children}
    </div>
  ),
}));

describe('EmptyMemories', () => {
  test('渲染空状态文案和按钮', () => {
    render(<EmptyMemories />);
    expect(
      screen.getByText('还没有照片呢，先写一篇日记配上图片吧'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '去写日记' })).toHaveAttribute(
      'href',
      '/diary/new',
    );
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/components/__tests__/EmptyMemories.test.tsx`
Expected: FAIL with "Cannot find module '../EmptyMemories'"

- [ ] **Step 3: 实现 EmptyMemories**

创建 `src/components/EmptyMemories.tsx`：

```tsx
import Link from 'next/link';
import { Button } from 'animal-island-ui';
import { EmptyState } from './illustrations';

export function EmptyMemories() {
  return (
    <EmptyState message="还没有照片呢，先写一篇日记配上图片吧">
      <div className="mt-4">
        <Link href="/diary/new">
          <Button type="primary">去写日记</Button>
        </Link>
      </div>
    </EmptyState>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test -- src/components/__tests__/EmptyMemories.test.tsx`
Expected: PASS (1 test passed)

- [ ] **Step 5: Commit**

```bash
git add src/components/EmptyMemories.tsx src/components/__tests__/EmptyMemories.test.tsx
git commit -m "feat(memories): 添加 EmptyMemories 空状态组件"
```

---

### Task 5: 照片墙页面

**Files:**
- Create: `src/app/memories/page.tsx`

- [ ] **Step 1: 实现页面**

创建 `src/app/memories/page.tsx`：

```tsx
import type { Metadata } from 'next';
import { getAllDiaryImages } from '@/lib/actions';
import { MasonryGrid } from '@/components/MasonryGrid';
import { EmptyMemories } from '@/components/EmptyMemories';

export const metadata: Metadata = {
  title: '回忆照片墙',
};

export default async function MemoriesPage() {
  const images = await getAllDiaryImages();

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-text-main mb-4">回忆照片墙</h1>
        {images.length === 0 ? (
          <EmptyMemories />
        ) : (
          <MasonryGrid
            images={images.map((img) => ({
              id: img.id,
              url: img.url,
              entryId: img.entryId,
            }))}
          />
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/memories/page.tsx
git commit -m "feat(memories): 添加照片墙页面"
```

---

### Task 6: 封面页入口

**Files:**
- Modify: `src/components/CoverActions.tsx`

- [ ] **Step 1: 修改 CoverActions**

在 `src/components/CoverActions.tsx` 的 import 区域添加 `Link`：

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FloatingButton from './FloatingButton';
```

在按钮组中，"翻开日记"按钮和 FloatingButton 之间插入：

```tsx
<Link
  href="/memories"
  className="text-sm text-text-sub hover:text-text-main transition-colors"
>
  回忆照片墙
</Link>
```

最终按钮组结构：

```tsx
<div className='absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3'>
  <button onClick={handleReadClick} className='...'>翻开日记</button>
  <Link href="/memories" className="text-sm text-text-sub hover:text-text-main transition-colors">
    回忆照片墙
  </Link>
  {showWriteButton && (
    <FloatingButton href='/diary/new'>写下今天</FloatingButton>
  )}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CoverActions.tsx
git commit -m "feat(cover): 添加回忆照片墙入口"
```

---

### Task 7: 日记时间线入口

**Files:**
- Modify: `src/app/diary/page.tsx`

- [ ] **Step 1: 修改 diary/page.tsx**

在 `src/app/diary/page.tsx` 的 import 区域添加 `Link`：

```typescript
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDiaryList } from '@/lib/actions';
```

修改标题区域：

```tsx
<div className="max-w-[480px] mx-auto px-4 py-6">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-4">
      <BackButton />
      <h1 className="text-lg font-bold text-text-main">目录</h1>
    </div>
    <Link
      href="/memories"
      className="text-sm text-primary hover:text-accent transition-colors"
    >
      照片墙
    </Link>
  </div>
  <DiaryTimeline groups={groups} showWriteButton={role === 'admin'} />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/diary/page.tsx
git commit -m "feat(diary): 添加照片墙入口链接"
```

---

### Task 8: 验证

- [ ] **Step 1: 运行全部测试**

Run: `pnpm test`
Expected: All tests pass（包括新增的和已有的）

- [ ] **Step 2: 运行 ESLint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 3: 运行生产构建**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: 提交验证结果**

如果以上全部通过：

```bash
git log --oneline -8
```

将 8 条提交记录作为验证证据。

---

## Spec Coverage Check

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 瀑布流布局展示外链图片 | Task 3 (MasonryGrid) |
| 移动端 2 列、桌面端 3 列 | Task 3 (getColumnCount) |
| 图片圆角 12px、gap 8px | Task 2 (MemoryCard rounded-xl), Task 3 (gap-2) |
| 点击图片跳转对应日记 | Task 2 (MemoryCard Link href) |
| 按时间倒序排列 | Task 1 (orderBy entry.date desc) |
| 空状态处理 | Task 4 (EmptyMemories) |
| 图片加载失败占位符 | Task 2 (hasError fallback) |
| 封面页 + 时间线页双入口 | Task 6, Task 7 |
| 入场动画 | Task 2, 3 (StaggerItem/StaggerContainer) |
| 懒加载 | Task 2 (img loading="lazy") |

## Placeholder Scan

- 无 TBD / TODO / "implement later" / "fill in details"
- 所有步骤包含完整代码
- 所有测试包含实际断言代码
- 无 "Similar to Task N" 引用

## Type Consistency Check

- `getAllDiaryImages` 返回 `(DiaryImage & { entry: ... })[]`，page.tsx 中 map 为 `{ id, url, entryId }`
- `MemoryCardProps.image` 类型 `{ id, url, entryId }` 与 page.tsx 传递的结构一致
- `MasonryGridProps.images` 类型 `ImageItem[]` 与 `MemoryCardProps` 一致
