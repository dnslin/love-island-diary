# 日历页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Issue #13 日历页：独立路由 `/calendar`，展示月份日历、标记有日记日期、支持月份切换和当天日记浮层。

**Architecture:** URL Query 驱动月份的 Server Component 方案。`/calendar?month=2025-05` 由 Server Component 读取 searchParams 并调用 Server Action 获取当月数据。日历网格和浮层交互封装在 Client Component 中。月份切换使用 Next.js `<Link>` 实现，配合 `prefetch` 和 `StaggerContainer` stagger 淡入动画达到平滑效果。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, dayjs, animal-island-ui, framer-motion, Prisma + SQLite, Jest + Testing Library

---

## 文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `src/lib/actions.ts` | 新增 `getDiaryDatesInMonth` Server Action | 修改 |
| `src/lib/__tests__/actions-calendar.test.ts` | `getDiaryDatesInMonth` 的集成测试 | 创建 |
| `src/app/diary/page.tsx` | 顶部新增「时间线 \| 日历」切换链接 | 修改 |
| `src/app/calendar/page.tsx` | 日历页 Server Component：获取数据、布局、月份导航 | 创建 |
| `src/components/CalendarGrid.tsx` | 日历网格 Client Component：生成日历网格、标记日记、点击触发浮层或跳转 | 创建 |
| `src/components/DayEntriesModal.tsx` | 当天日记列表浮层 Client Component：基于 animal-island-ui Modal | 创建 |
| `src/components/__tests__/CalendarGrid.test.tsx` | CalendarGrid 渲染、标记、点击测试 | 创建 |
| `src/components/__tests__/DayEntriesModal.test.tsx` | DayEntriesModal 渲染、列表、关闭测试 | 创建 |

---

### Task 1: 新增 Server Action `getDiaryDatesInMonth`

新增一个只读 Server Action，查询指定月份的所有日记并按日期分组。不需要权限验证（与 `getDiaryList` 一致）。

**Files:**
- 修改: `src/lib/actions.ts`
- 测试: `src/lib/__tests__/actions-calendar.test.ts`

- [ ] **Step 1: 写测试**

创建 `src/lib/__tests__/actions-calendar.test.ts`：

```ts
import { prisma } from '../prisma';
import { createDiary, getDiaryDatesInMonth } from '../actions';

jest.mock('../auth', () => ({
  requireAdmin: jest.fn(() => Promise.resolve(null)),
}));

beforeEach(async () => {
  await prisma.diaryImage.deleteMany();
  await prisma.diaryEntry.deleteMany();
});

describe('getDiaryDatesInMonth', () => {
  test('返回当月有日记的日期分组，按日期和创建时间升序', async () => {
    await createDiary({ date: new Date('2025-05-15'), title: '日记2', content: '内容2' });
    await createDiary({ date: new Date('2025-05-08'), title: '日记1', content: '内容1' });

    const result = await getDiaryDatesInMonth(2025, 5);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2025-05-08');
    expect(result[0].entries).toHaveLength(1);
    expect(result[0].entries[0].title).toBe('日记1');
    expect(result[1].date).toBe('2025-05-15');
    expect(result[1].entries[0].title).toBe('日记2');
  });

  test('同一天多篇日记正确分组', async () => {
    await createDiary({ date: new Date('2025-05-08'), title: '日记A', content: '内容A' });
    await createDiary({ date: new Date('2025-05-08'), title: '日记B', content: '内容B' });

    const result = await getDiaryDatesInMonth(2025, 5);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2025-05-08');
    expect(result[0].entries).toHaveLength(2);
  });

  test('当月无日记返回空数组', async () => {
    const result = await getDiaryDatesInMonth(2025, 5);
    expect(result).toEqual([]);
  });

  test('不返回其他月份数据', async () => {
    await createDiary({ date: new Date('2025-04-30'), title: '四月末', content: '内容' });
    await createDiary({ date: new Date('2025-06-01'), title: '六月初', content: '内容' });

    const result = await getDiaryDatesInMonth(2025, 5);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test src/lib/__tests__/actions-calendar.test.ts
```

Expected: FAIL，报错 `getDiaryDatesInMonth is not a function` 或类似。

- [ ] **Step 3: 实现 Server Action**

在 `src/lib/actions.ts` 中，在 `getAllDiaryImages` 函数之后、文件末尾之前，添加：

```ts
export async function getDiaryDatesInMonth(year: number, month: number) {
  const start = dayjs().year(year).month(month - 1).startOf('month').toDate();
  const end = dayjs().year(year).month(month - 1).endOf('month').toDate();

  const entries = await prisma.diaryEntry.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, date: true, title: true },
  });

  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = dayjs(entry.date).format('YYYY-MM-DD');
    const arr = groups.get(key);
    if (arr) arr.push(entry);
    else groups.set(key, [entry]);
  }

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    entries: items,
  }));
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test src/lib/__tests__/actions-calendar.test.ts
```

Expected: PASS（4 个测试全部通过）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions.ts src/lib/__tests__/actions-calendar.test.ts
git commit -m "feat(actions): 添加 getDiaryDatesInMonth Server Action"
```

---

### Task 2: 修改目录页顶部导航

在 `src/app/diary/page.tsx` 顶部新增「时间线 | 日历」切换链接。右侧保留「照片墙」入口。

**Files:**
- 修改: `src/app/diary/page.tsx`

- [ ] **Step 1: 修改顶部导航区域**

将 `src/app/diary/page.tsx` 中的这段代码：

```tsx
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
```

替换为：

```tsx
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-4">
    <BackButton />
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-text-main">时间线</span>
      <span className="text-border-soft">|</span>
      <Link
        href="/calendar"
        className="text-sm text-text-sub hover:text-text-main transition-colors"
      >
        日历
      </Link>
    </div>
  </div>
  <Link
    href="/memories"
    className="text-sm text-primary hover:text-accent transition-colors"
  >
    照片墙
  </Link>
</div>
```

- [ ] **Step 2: 运行相关测试确认通过**

```bash
pnpm test src/components/__tests__/DiaryTimeline.test.tsx
```

Expected: PASS。注意这里不直接测试 page.tsx，而是确保 Timeline 组件测试不受影响。

- [ ] **Step 3: Commit**

```bash
git add src/app/diary/page.tsx
git commit -m "feat(diary): 目录页顶部新增日历入口链接"
```

---

### Task 3: 创建日历页

创建 `src/app/calendar/page.tsx`，作为 Server Component 读取 URL query 中的 `month` 参数，调用 `getDiaryDatesInMonth` 获取数据并渲染布局。

**Files:**
- 创建: `src/app/calendar/page.tsx`

- [ ] **Step 1: 创建页面文件**

创建 `src/app/calendar/page.tsx`：

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDiaryDatesInMonth, getAuthRole } from '@/lib/actions';
import { BackButton } from '@/components/BackButton';
import { CalendarGrid } from '@/components/CalendarGrid';
import dayjs from '@/lib/dayjs';

export const metadata: Metadata = {
  title: '日历',
};

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const { month } = await searchParams;
  const currentMonth =
    month && /^\d{4}-\d{2}$/.test(month)
      ? dayjs(month, 'YYYY-MM')
      : dayjs();

  const year = currentMonth.year();
  const monthNum = currentMonth.month() + 1;

  const [diaryDays] = await Promise.all([
    getDiaryDatesInMonth(year, monthNum),
    getAuthRole(),
  ]);

  const prevMonth = currentMonth.subtract(1, 'month').format('YYYY-MM');
  const nextMonth = currentMonth.add(1, 'month').format('YYYY-MM');
  const monthLabel = currentMonth.format('YYYY年M月');
  const diaryCount = diaryDays.reduce((sum, d) => sum + d.entries.length, 0);

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center gap-3">
              <Link
                href="/diary"
                className="text-sm text-text-sub hover:text-text-main transition-colors"
              >
                时间线
              </Link>
              <span className="text-border-soft">|</span>
              <span className="text-sm font-bold text-text-main">日历</span>
            </div>
          </div>
          <Link
            href="/memories"
            className="text-sm text-primary hover:text-accent transition-colors"
          >
            照片墙
          </Link>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-text-main">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/calendar?month=${prevMonth}`}
                className="p-1 text-text-sub hover:text-text-main transition-colors"
                aria-label="上一月"
                prefetch
              >
                <svg
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
              </Link>
              <Link
                href={`/calendar?month=${nextMonth}`}
                className="p-1 text-text-sub hover:text-text-main transition-colors"
                aria-label="下一月"
                prefetch
              >
                <svg
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
              </Link>
            </div>
          </div>
          <p className="text-sm text-text-sub">
            {diaryCount > 0
              ? `这个月，我们记录了 ${diaryCount} 天。`
              : '这个月还没有记录。'}
          </p>
        </div>

        <CalendarGrid year={year} month={monthNum} diaryDays={diaryDays} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 运行 build 确认通过**

```bash
pnpm build
```

Expected: PASS（此时 CalendarGrid 尚未创建，build 可能会报错组件未找到。如果报错，先创建空组件占位，或跳过此步到 Task 4 完成后再验证）。

**如果 build 因 CalendarGrid 缺失而失败**，先创建一个占位文件：

```bash
echo "export function CalendarGrid() { return null; }" > src/components/CalendarGrid.tsx
```

然后再运行 `pnpm build`。

- [ ] **Step 3: Commit**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat(calendar): 创建日历页 Server Component"
```

---

### Task 4: 创建日历网格组件

创建 `src/components/CalendarGrid.tsx`，负责生成日历网格、标记有日记的日期、处理点击交互。使用 `StaggerContainer` + `StaggerItem` 给日期格子添加 stagger 淡入动画。

**Files:**
- 创建: `src/components/CalendarGrid.tsx`
- 测试: `src/components/__tests__/CalendarGrid.test.tsx`

- [ ] **Step 1: 写测试**

创建 `src/components/__tests__/CalendarGrid.test.tsx`：

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarGrid } from '../CalendarGrid';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('CalendarGrid', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  test('渲染星期标题', () => {
    render(<CalendarGrid year={2025} month={5} diaryDays={[]} />);
    expect(screen.getByText('日')).toBeInTheDocument();
    expect(screen.getByText('一')).toBeInTheDocument();
    expect(screen.getByText('六')).toBeInTheDocument();
  });

  test('渲染当月日期', () => {
    render(<CalendarGrid year={2025} month={5} diaryDays={[]} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  test('有日记的日期显示小圆点', () => {
    render(
      <CalendarGrid
        year={2025}
        month={5}
        diaryDays={[
          { date: '2025-05-08', entries: [{ id: '1', title: '日记' }] },
        ]}
      />
    );
    const dayButton = screen.getByText('8').closest('button');
    expect(dayButton).toBeInTheDocument();
    expect(
      dayButton?.querySelector('[data-testid="diary-dot"]')
    ).toBeInTheDocument();
  });

  test('点击有单篇日记的日期直接跳转', () => {
    render(
      <CalendarGrid
        year={2025}
        month={5}
        diaryDays={[
          { date: '2025-05-08', entries: [{ id: 'entry-1', title: '日记' }] },
        ]}
      />
    );
    const dayButton = screen.getByText('8').closest('button');
    fireEvent.click(dayButton!);
    expect(mockPush).toHaveBeenCalledWith('/diary/entry-1');
  });

  test('点击无日记的日期无反应', () => {
    render(<CalendarGrid year={2025} month={5} diaryDays={[]} />);
    const dayButton = screen.getByText('15').closest('button');
    expect(dayButton).toBeDisabled();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test src/components/__tests__/CalendarGrid.test.tsx
```

Expected: FAIL，`CalendarGrid` 未定义或测试中的选择器找不到元素。

- [ ] **Step 3: 实现 CalendarGrid**

创建 `src/components/CalendarGrid.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from '@/lib/dayjs';
import { StaggerContainer, StaggerItem } from './animations';
import { DayEntriesModal } from './DayEntriesModal';

interface DiaryDay {
  date: string;
  entries: Array<{ id: string; title: string | null }>;
}

interface CalendarGridProps {
  year: number;
  month: number;
  diaryDays: DiaryDay[];
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function CalendarGrid({ year, month, diaryDays }: CalendarGridProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<DiaryDay['entries']>([]);

  const diaryMap = new Map(diaryDays.map((d) => [d.date, d.entries]));

  const firstDayOfMonth = dayjs().year(year).month(month - 1).startOf('month');
  const daysInMonth = firstDayOfMonth.daysInMonth();
  const startWeekday = firstDayOfMonth.day();

  const today = dayjs().format('YYYY-MM-DD');

  const days: Array<{
    day: number;
    dateStr: string | null;
    isCurrentMonth: boolean;
  }> = [];

  const prevMonthDays = firstDayOfMonth.subtract(startWeekday, 'day');
  for (let i = 0; i < startWeekday; i++) {
    const d = prevMonthDays.add(i, 'day');
    days.push({
      day: d.date(),
      dateStr: d.format('YYYY-MM-DD'),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = firstDayOfMonth.date(i);
    days.push({
      day: i,
      dateStr: d.format('YYYY-MM-DD'),
      isCurrentMonth: true,
    });
  }

  const totalCells = days.length <= 35 ? 35 : 42;
  const remaining = totalCells - days.length;
  const nextMonthStart = firstDayOfMonth.add(1, 'month').startOf('month');
  for (let i = 0; i < remaining; i++) {
    const d = nextMonthStart.add(i, 'day');
    days.push({
      day: d.date(),
      dateStr: d.format('YYYY-MM-DD'),
      isCurrentMonth: false,
    });
  }

  const handleDayClick = (dateStr: string, entries: DiaryDay['entries']) => {
    if (entries.length === 1) {
      router.push(`/diary/${entries[0].id}`);
    } else if (entries.length > 1) {
      setSelectedDate(dateStr);
      setSelectedEntries(entries);
    }
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    setSelectedEntries([]);
  };

  return (
    <>
      <StaggerContainer className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <StaggerItem key={wd}>
            <div className="text-center text-xs text-text-sub py-2">{wd}</div>
          </StaggerItem>
        ))}
        {days.map(({ day, dateStr, isCurrentMonth }, idx) => {
          const entries = dateStr ? diaryMap.get(dateStr) ?? [] : [];
          const hasDiary = entries.length > 0;
          const isToday = dateStr === today;

          return (
            <StaggerItem key={idx}>
              <button
                type="button"
                onClick={() => dateStr && handleDayClick(dateStr, entries)}
                disabled={!hasDiary}
                className={[
                  'w-full aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors',
                  isCurrentMonth ? 'text-text-main' : 'text-text-sub/40',
                  isToday ? 'ring-2 ring-primary/50' : '',
                  hasDiary
                    ? 'cursor-pointer hover:bg-card'
                    : 'cursor-default',
                  !isCurrentMonth && !hasDiary
                    ? 'pointer-events-none'
                    : '',
                ].join(' ')}
              >
                <span className="text-sm">{day}</span>
                {hasDiary && (
                  <span
                    data-testid="diary-dot"
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <DayEntriesModal
        open={selectedDate !== null}
        date={selectedDate ?? ''}
        entries={selectedEntries}
        onClose={handleCloseModal}
      />
    </>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test src/components/__tests__/CalendarGrid.test.tsx
```

Expected: PASS（4 个测试全部通过）。

- [ ] **Step 5: Commit**

```bash
git add src/components/CalendarGrid.tsx src/components/__tests__/CalendarGrid.test.tsx
git commit -m "feat(calendar): 添加 CalendarGrid 日历网格组件"
```

---

### Task 5: 创建当天日记浮层组件

创建 `src/components/DayEntriesModal.tsx`，基于 `animal-island-ui` 的 `Modal` 组件，展示当天所有日记列表。

**Files:**
- 创建: `src/components/DayEntriesModal.tsx`
- 测试: `src/components/__tests__/DayEntriesModal.test.tsx`

- [ ] **Step 1: 写测试**

创建 `src/components/__tests__/DayEntriesModal.test.tsx`：

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DayEntriesModal } from '../DayEntriesModal';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) {
    return (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    );
  };
});

jest.mock('@/lib/dayjs', () => {
  return {
    __esModule: true,
    default: (date: string) => ({
      format: (fmt: string) => {
        if (fmt === 'M月D日') return '5月8日';
        return date;
      },
    }),
  };
});

describe('DayEntriesModal', () => {
  test('关闭时不渲染日记内容', () => {
    render(
      <DayEntriesModal
        open={false}
        date="2025-05-08"
        entries={[]}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByText('5月8日的日记')).not.toBeInTheDocument();
  });

  test('打开时渲染日期标题和日记列表', () => {
    render(
      <DayEntriesModal
        open={true}
        date="2025-05-08"
        entries={[
          { id: '1', title: '第一篇' },
          { id: '2', title: '第二篇' },
        ]}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('5月8日的日记')).toBeInTheDocument();
    expect(screen.getByText('第一篇')).toBeInTheDocument();
    expect(screen.getByText('第二篇')).toBeInTheDocument();
  });

  test('点击日记项触发关闭回调', () => {
    const handleClose = jest.fn();
    render(
      <DayEntriesModal
        open={true}
        date="2025-05-08"
        entries={[{ id: '1', title: '第一篇' }]}
        onClose={handleClose}
      />
    );
    const link = screen.getByText('第一篇');
    fireEvent.click(link);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('无标题时显示默认文案', () => {
    render(
      <DayEntriesModal
        open={true}
        date="2025-05-08"
        entries={[{ id: '1', title: null }]}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('5月8日 的心情')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm test src/components/__tests__/DayEntriesModal.test.tsx
```

Expected: FAIL，`DayEntriesModal` 未定义。

- [ ] **Step 3: 实现 DayEntriesModal**

创建 `src/components/DayEntriesModal.tsx`：

```tsx
import { Modal } from 'animal-island-ui';
import Link from 'next/link';
import dayjs from '@/lib/dayjs';

interface DayEntriesModalProps {
  open: boolean;
  date: string;
  entries: Array<{ id: string; title: string | null }>;
  onClose: () => void;
}

export function DayEntriesModal({
  open,
  date,
  entries,
  onClose,
}: DayEntriesModalProps) {
  if (!open || !date) return null;

  const label = dayjs(date).format('M月D日');

  return (
    <Modal
      open={open}
      title={`${label}的日记`}
      maskClosable
      closable
      onClose={onClose}
      typewriter={false}
      footer={null}
    >
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/diary/${entry.id}`}
              onClick={onClose}
              className="block p-3 rounded-lg bg-cream hover:bg-primary/10 transition-colors text-text-main text-sm"
            >
              {entry.title || `${label} 的心情`}
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm test src/components/__tests__/DayEntriesModal.test.tsx
```

Expected: PASS（4 个测试全部通过）。

- [ ] **Step 5: Commit**

```bash
git add src/components/DayEntriesModal.tsx src/components/__tests__/DayEntriesModal.test.tsx
git commit -m "feat(calendar): 添加 DayEntriesModal 当天日记浮层组件"
```

---

### Task 6: 完整验证

运行项目级验证命令，确保没有 lint 错误、所有测试通过、build 成功。

- [ ] **Step 1: 运行 lint**

```bash
pnpm lint
```

Expected: PASS，无错误无警告。

- [ ] **Step 2: 运行全部测试**

```bash
pnpm test
```

Expected: PASS，所有测试通过（包括新增的 calendar 相关测试和既有测试）。

- [ ] **Step 3: 运行 build**

```bash
pnpm build
```

Expected: PASS，生产构建成功。

- [ ] **Step 4: Commit（如果 lint/test 有修复）**

如果 Step 1-3 中发现并修复了问题：

```bash
git add -A
git commit -m "fix(calendar): lint/test/build 修复"
```

---

## Self-Review

### 1. Spec 覆盖度检查

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 独立路由 `/calendar` | Task 3 |
| 目录页顶部「时间线 \| 日历」切换 | Task 2 |
| URL Query 驱动月份 | Task 3 (`searchParams`) |
| 展示当前月份日历 | Task 3 + Task 4 |
| 标记有日记的日期（小圆点） | Task 4 (`diary-dot`) |
| 点击有日记日期 → 浮层/跳转 | Task 4 + Task 5 |
| 月份切换（上一月/下一月） | Task 3 (`Link` + `prefetch`) |
| 文案「这个月，我们记录了 X 天。」 | Task 3 |
| 主色 `#F7C8D0` 标记 | Task 4 (`bg-primary`) |
| 动画平滑 | Task 4 (`StaggerContainer`) |
| 同一天多篇日记浮层 | Task 5 |
| 无日记日期无反应 | Task 4 (`disabled` + `pointer-events-none`) |
| 整体风格一致 | 所有 Task 均使用 cream 主题变量 |

**无遗漏。**

### 2. Placeholder 扫描

- 无 TBD、TODO
- 无 "add appropriate error handling" 等模糊描述
- 每个代码步骤包含完整代码
- 每个测试步骤包含完整测试代码

### 3. 类型一致性检查

- `getDiaryDatesInMonth` 返回类型：`Array<{ date: string; entries: Array<{ id: string; title: string | null }> }>`
- `CalendarGrid.diaryDays` 类型：`Array<{ date: string; entries: Array<{ id: string; title: string | null }> }>` — 一致
- `DayEntriesModal.entries` 类型：`Array<{ id: string; title: string | null }>` — 一致
- `dayjs` 导入路径：所有文件均使用 `@/lib/dayjs` — 一致
