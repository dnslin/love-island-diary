# 时间线目录页 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `/diary` 时间线目录页（按月分组 + sticky 月份标签 + 时间轴列表）以及 `/diary/[id]` 单篇页底部"时间线"入口。

**Architecture:** Server-first 实现。`/diary` 页面在服务端获取日记列表、按月分组 Map，传给纯渲染组件 `DiaryTimeline`。`BackButton` 是唯一 Client Component（`router.back()` + `window.history.length` fallback）。`getDiaryList` 增加 `createdAt` 二级排序键，保证目录顺序与翻页顺序一致。

**Tech Stack:** Next.js 16 App Router、React 19、Tailwind CSS v4、animal-island-ui、Jest + ts-jest + React Testing Library、Prisma、dayjs。

**Spec:** `docs/superpowers/specs/2026-05-03-diary-timeline-design.md`

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lib/actions.ts` | 修改 | `getDiaryList` 增加 `createdAt` 二级排序 |
| `src/lib/__tests__/actions.test.ts` | 修改 | 补充同日多篇排序测试用例 |
| `src/lib/dayjs.ts` | 创建 | 集中初始化 dayjs 中文 locale |
| `src/components/BackButton.tsx` | 创建 | Client Component：router.back() + fallback `/` |
| `src/components/__tests__/BackButton.test.tsx` | 创建 | BackButton 单元测试 |
| `src/components/DiaryTimeline.tsx` | 创建 | Server Component：sticky 月份标签 + 时间轴列表 |
| `src/components/__tests__/DiaryTimeline.test.tsx` | 创建 | DiaryTimeline 单元测试 |
| `src/app/diary/page.tsx` | 创建 | Server Component：数据获取、按月分组、空状态分支 |
| `src/app/diary/[id]/page.tsx` | 修改 | 内容卡片下方追加"时间线"入口链接 |

---

## Task 1: 调整 `getDiaryList` 排序 + 补充回归测试

**Files:**
- Modify: `src/lib/actions.ts:41-46`
- Modify: `src/lib/__tests__/actions.test.ts`

**目标:** 将 `getDiaryList` 的 `orderBy` 从单字段 `{ date: 'desc' }` 改为 `[{ date: 'desc' }, { createdAt: 'desc' }]`，并补充测试验证同日多篇按创建时间倒序。

- [ ] **Step 1: 修改 `src/lib/actions.ts`**

```typescript
export async function getDiaryList() {
  return prisma.diaryEntry.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { images: true },
  });
}
```

- [ ] **Step 2: 在 `src/lib/__tests__/actions.test.ts` 的 `describe('Diary Actions')` 内，现有 `getDiaryList` 测试之后追加新测试**

```typescript
  test('getDiaryList sorts same-day entries by createdAt desc', async () => {
    const sameDate = new Date('2025-01-15');
    const first = await createDiary({ date: sameDate, title: 'First', content: 'a' });
    const second = await createDiary({ date: sameDate, title: 'Second', content: 'b' });
    const third = await createDiary({ date: sameDate, title: 'Third', content: 'c' });

    // 手动调整 createdAt 确保顺序可控
    const base = dayjs('2025-01-15T10:00:00.000Z');
    await prisma.diaryEntry.update({ where: { id: first.id }, data: { createdAt: base.toDate() } });
    await prisma.diaryEntry.update({ where: { id: second.id }, data: { createdAt: base.add(1, 'hour').toDate() } });
    await prisma.diaryEntry.update({ where: { id: third.id }, data: { createdAt: base.add(2, 'hour').toDate() } });

    const list = await getDiaryList();
    expect(list.map((d) => d.title)).toEqual(['Third', 'Second', 'First']);
  });
```

- [ ] **Step 3: 运行测试验证通过**

```bash
pnpm test -- --testPathPattern=actions.test.ts
```

Expected: 全部通过，包括新增用例。

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions.ts src/lib/__tests__/actions.test.ts
git commit -m "$(cat <<'EOF'
fix(actions): getDiaryList 增加 createdAt 二级排序(Issue #7)

保证目录顺序与翻页顺序一致。
EOF
)"
```

---

## Task 2: 创建 `src/lib/dayjs.ts`

**Files:**
- Create: `src/lib/dayjs.ts`

**目标:** 集中初始化 dayjs 中文 locale，供需要中文星期的模块统一引入。

- [ ] **Step 1: 创建文件**

```typescript
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export default dayjs;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/dayjs.ts
git commit -m "$(cat <<'EOF'
feat(lib): 集中初始化 dayjs 中文 locale(Issue #7)
EOF
)"
```

---

## Task 3: 创建 `BackButton` 组件 + 测试

**Files:**
- Create: `src/components/BackButton.tsx`
- Create: `src/components/__tests__/BackButton.test.tsx`

**目标:** Client Component，点击时优先 `router.back()`，若浏览器历史栈为空（`window.history.length <= 1`）则 fallback 到 `/`。

- [ ] **Step 1: 写测试**

`src/components/__tests__/BackButton.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BackButton } from '../BackButton';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

describe('BackButton', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
  });

  test('calls router.back when history.length > 1', () => {
    Object.defineProperty(window, 'history', {
      value: { length: 2 },
      writable: true,
    });

    render(<BackButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('falls back to router.push("/") when history.length <= 1', () => {
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
    });

    render(<BackButton />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test -- --testPathPattern=BackButton.test.tsx
```

Expected: FAIL with `BackButton` not found 或相关导入错误。

- [ ] **Step 3: 实现组件**

`src/components/BackButton.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-text-sub hover:text-text-main transition-colors"
      aria-label="返回"
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
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test -- --testPathPattern=BackButton.test.tsx
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/BackButton.tsx src/components/__tests__/BackButton.test.tsx
git commit -m "$(cat <<'EOF'
feat(components): BackButton 返回组件 + fallback 逻辑(Issue #7)
EOF
)"
```

---

## Task 4: 创建 `DiaryTimeline` 组件 + 测试

**Files:**
- Create: `src/components/DiaryTimeline.tsx`
- Create: `src/components/__tests__/DiaryTimeline.test.tsx`

**目标:** Server Component，接收按月分组的日记数据，渲染 sticky 月份标签 + 竖向时间轴 + 日期标题列表。空标题时显示默认标题格式。

- [ ] **Step 1: 写测试**

`src/components/__tests__/DiaryTimeline.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { DiaryTimeline } from '../DiaryTimeline';
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

describe('DiaryTimeline', () => {
  test('renders empty state', () => {
    render(<DiaryTimeline groups={new Map()} />);
    expect(screen.getByText('还没有日记呢，翻开第一页吧')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /写下第一篇/i })).toBeInTheDocument();
  });

  test('renders single month with single entry', () => {
    const groups = new Map<string, Entry[]>();
    groups.set('2025-01', [makeEntry({ id: 'e1', date: new Date('2025-01-15'), title: '初次见面' })]);

    render(<DiaryTimeline groups={groups} />);
    expect(screen.getByText('2025 年 1 月')).toBeInTheDocument();
    expect(screen.getByText('1月15日 周三')).toBeInTheDocument();
    expect(screen.getByText('初次见面')).toBeInTheDocument();
  });

  test('renders default title when title is empty', () => {
    const groups = new Map<string, Entry[]>();
    groups.set('2025-01', [makeEntry({ id: 'e1', date: new Date('2025-01-15'), title: '' })]);

    render(<DiaryTimeline groups={groups} />);
    expect(screen.getByText('2025年1月15日 的心情')).toBeInTheDocument();
  });

  test('renders multiple months in order', () => {
    const groups = new Map<string, Entry[]>();
    groups.set('2025-02', [makeEntry({ id: 'e2', date: new Date('2025-02-10'), title: '二月' })]);
    groups.set('2025-01', [makeEntry({ id: 'e1', date: new Date('2025-01-05'), title: '一月' })]);

    render(<DiaryTimeline groups={groups} />);
    const months = screen.getAllByRole('heading', { level: 2 });
    expect(months[0]).toHaveTextContent('2025 年 2 月');
    expect(months[1]).toHaveTextContent('2025 年 1 月');
  });

  test('renders multiple entries within same month', () => {
    const groups = new Map<string, Entry[]>();
    groups.set('2025-01', [
      makeEntry({ id: 'e1', date: new Date('2025-01-20'), title: 'A' }),
      makeEntry({ id: 'e2', date: new Date('2025-01-10'), title: 'B' }),
    ]);

    render(<DiaryTimeline groups={groups} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test -- --testPathPattern=DiaryTimeline.test.tsx
```

Expected: FAIL with `DiaryTimeline` not found。

- [ ] **Step 3: 实现组件**

`src/components/DiaryTimeline.tsx`:

```tsx
import Link from 'next/link';
import type { DiaryEntry, DiaryImage } from '@prisma/client';
import { Button } from 'animal-island-ui';
import dayjs from '@/lib/dayjs';

interface DiaryTimelineProps {
  groups: Map<string, Array<DiaryEntry & { images: DiaryImage[] }>>;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${year} 年 ${parseInt(month, 10)} 月`;
}

function formatDate(date: Date): string {
  return dayjs(date).format('M月D日 dddd');
}

function defaultTitle(date: Date): string {
  return `${dayjs(date).format('YYYY年M月D日')} 的心情`;
}

export function DiaryTimeline({ groups }: DiaryTimelineProps) {
  if (groups.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-sub"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        <p className="mt-4 text-text-sub">还没有日记呢，翻开第一页吧</p>
        <Link href="/diary/new" className="mt-6">
          <Button type="primary">写下第一篇</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([monthKey, entries]) => (
        <section key={monthKey} className="relative pl-6">
          <h2 className="sticky top-0 bg-cream/95 backdrop-blur z-10 py-2 text-sm font-bold text-text-main">
            {formatMonthLabel(monthKey)}
          </h2>
          <div className="absolute left-[7px] top-10 bottom-0 w-px bg-border-soft" />
          <ul className="space-y-3 py-2">
            {entries.map((entry) => {
              const title = entry.title || defaultTitle(entry.date);
              return (
                <li key={entry.id} className="relative">
                  <span className="absolute left-[-22px] top-2 w-3 h-3 rounded-full bg-primary" />
                  <Link
                    href={`/diary/${entry.id}`}
                    className="block hover:bg-card/60 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <div className="text-xs text-text-sub">{formatDate(entry.date)}</div>
                    <div className="text-base text-text-main">{title}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test -- --testPathPattern=DiaryTimeline.test.tsx
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/DiaryTimeline.tsx src/components/__tests__/DiaryTimeline.test.tsx
git commit -m "$(cat <<'EOF'
feat(components): DiaryTimeline 时间轴列表组件(Issue #7)

包含 sticky 月份标签、竖线时间轴、空状态 CTA。
EOF
)"
```

---

## Task 5: 创建 `/diary` 页面

**Files:**
- Create: `src/app/diary/page.tsx`

**目标:** Server Component，获取日记列表、按月分组、渲染顶部栏 + `DiaryTimeline`。空数组走空状态分支，不抛 `notFound()`。

- [ ] **Step 1: 创建文件**

```tsx
import type { Metadata } from 'next';
import { getDiaryList } from '@/lib/actions';
import { DiaryTimeline } from '@/components/DiaryTimeline';
import { BackButton } from '@/components/BackButton';
import dayjs from '@/lib/dayjs';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

export const metadata: Metadata = {
  title: '目录',
};

type Entry = DiaryEntry & { images: DiaryImage[] };

function groupByMonth(entries: Entry[]) {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = dayjs(entry.date).format('YYYY-MM');
    const arr = groups.get(key);
    if (arr) {
      arr.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }
  return groups;
}

export default async function DiaryPage() {
  const entries = await getDiaryList();
  const groups = groupByMonth(entries);

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <h1 className="text-lg font-bold text-text-main">目录</h1>
        </div>
        <DiaryTimeline groups={groups} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/diary/page.tsx
git commit -m "$(cat <<'EOF'
feat(page): /diary 时间线目录页(Issue #7)
EOF
)"
```

---

## Task 6: 单篇页追加"时间线"入口

**Files:**
- Modify: `src/app/diary/[id]/page.tsx`

**目标:** 在内容卡片下方追加"时间线"链接，纯 `<Link>`，不修改 `DiaryDetail`。

- [ ] **Step 1: 在 `src/app/diary/[id]/page.tsx` 中修改**

找到现有内容卡片的闭合 `</div>`（当前为 line 57 `<DiaryDetail entry={entry} />` 所在 div），在其后追加：

```tsx
        <div className="mt-6 flex justify-center">
          <Link
            href="/diary"
            className="inline-flex items-center gap-2 text-sm text-text-sub hover:text-text-main transition-colors"
            aria-label="返回时间线"
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
        </div>
```

修改后的文件结构应为：

```tsx
// ... imports and page component up to return
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          {/* existing back arrow + title */}
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <DiaryDetail entry={entry} />
        </div>
        <div className="mt-6 flex justify-center">
          <Link ...>时间线</Link>
        </div>
      </div>
    </main>
// ...
```

- [ ] **Step 2: Commit**

```bash
git add src/app/diary/[id]/page.tsx
git commit -m "$(cat <<'EOF'
feat(page): /diary/[id] 底部追加时间线入口(Issue #7)
EOF
)"
```

---

## Task 7: 运行全量测试 + 手动 e2e 自测

**Files:**
- 无新增文件，仅验证。

**目标:** 确保自动化测试全绿，并完成设计文档中的边界自测清单。

- [ ] **Step 1: 运行全量测试**

```bash
pnpm test
```

Expected: 全部通过。

- [ ] **Step 2: 手动 e2e 自测清单**

在本地启动开发服务器验证以下场景：

```bash
pnpm dev
```

逐项检查：
- [ ] `0 篇日记` → 访问 `/diary`，空状态显示"还没有日记呢，翻开第一页吧"，CTA 按钮可跳转 `/diary/new`
- [ ] `1 篇日记` → 单条显示，单组月份标签，无视觉异常
- [ ] `同日 3 篇` → 创建 3 篇同日日记，目录内按创建时间倒序排列
- [ ] `跨年`（如 2025-12 + 2026-01）→ 月份分组按时间倒序正确切换，标签包含年份
- [ ] `空标题` → 显示默认标题 `${YYYY年M月D日} 的心情`
- [ ] `sticky 月份标签` → 滚动时当前月份标签吸顶，切换平滑无闪烁
- [ ] `直接访问 /diary 无来源` → 顶部返回按钮 fallback 到 `/`
- [ ] `从 /diary/[id] 进入 /diary` → 顶部返回按钮回到该日记页
- [ ] `/diary/[id]` 底部"时间线"入口可点击进入 `/diary`
- [ ] `移动端宽度 < 480px` → 布局正确，无横向滚动条
- [ ] `prefers-reduced-motion` → 无动画（本次基本无动画，自然满足）

- [ ] **Step 3: Commit 自测完成标记（可选）**

若自测全部通过，无需额外 commit；如有修复，按 `fix(...)` 单独提交。

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec 要求 | 对应 Task |
|-----------|-----------|
| `getDiaryList` orderBy 改为 `[{ date: 'desc' }, { createdAt: 'desc' }]` | Task 1 |
| 补充 actions 测试（同日多篇排序） | Task 1 |
| 新增 `src/lib/dayjs.ts` 集中初始化 locale | Task 2 |
| `BackButton` Client Component + `router.back()` + fallback `/` | Task 3 |
| `BackButton` 测试（history.length 分支） | Task 3 |
| `DiaryTimeline` sticky 月份标签 + 竖线 + 圆点 | Task 4 |
| `DiaryTimeline` 空状态 CTA 跳转 `/diary/new` | Task 4 |
| `DiaryTimeline` 测试（空数据、单篇、多篇、跨月、默认标题） | Task 4 |
| `/diary` Server Component + 按月分组 Map | Task 5 |
| `/diary/[id]` 底部"时间线"入口 | Task 6 |
| 全量测试 + e2e 自测清单 | Task 7 |

**无遗漏。**

### 2. Placeholder Scan

- 无 "TBD"、"TODO"、"implement later"。
- 无 "Add appropriate error handling" 等模糊描述。
- 每个测试都包含完整断言代码。
- 每个 commit 命令包含完整 message。

### 3. Type Consistency

- `getDiaryList` 返回类型不变（Prisma 推断），调用方无需调整。
- `DiaryTimeline` 的 `groups` prop 使用 `Map<string, Array<DiaryEntry & { images: DiaryImage[] }>>`，与 `getDiaryList` 返回结构一致。
- `defaultTitle` 格式与 `DiaryDetail.tsx:19` 保持一致（`YYYY年M月D日 的心情`）。
- `formatDate` 使用 `M月D日 dddd`，与 spec 要求的 `M月D日 周X` 一致（dayjs zh-cn locale 下 `dddd` 输出"周一"等）。

---
