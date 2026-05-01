# 封面页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Issue #4 封面页 — 便签散落感情侣信息展示、翻开日记入口、纪念日计数动画。

**Architecture:** Server Component (`page.tsx`) 并发获取 CoupleProfile 和统计数字，无记录时 redirect 到 `/settings`。天数计数和按钮浮动动画拆分为独立 Client Component。Logo 点击彩蛋逻辑完整保留。

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma + SQLite, dayjs, framer-motion, animal-island-ui

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/page.tsx` | Modify | Server Component：获取数据、布局、组装子组件 |
| `src/components/CoverLogo.tsx` | Create | Client Component：Logo + 点击三次彩蛋 Modal |
| `src/components/AnimatedDays.tsx` | Create | Client Component：天数计数滚动动画 |
| `src/components/FloatingButton.tsx` | Create | Client Component：浮动呼吸动画按钮 |
| `src/lib/actions.ts` | Modify | 新增 `getCoverStats()` Server Action |
| `src/lib/__tests__/actions.test.ts` | Modify | 新增 `getCoverStats` 测试 |
| `src/app/globals.css` | Modify | 新增 `@keyframes float` 动画定义 |

---

## Task 1: 安装依赖 dayjs 和 framer-motion

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
pnpm add dayjs framer-motion
```

- [ ] **Step 2: 验证 package.json**

```bash
grep -E '"dayjs"|"framer-motion"' package.json
```

Expected: 两行输出，分别包含 `"dayjs"` 和 `"framer-motion"`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
if [ -f pnpm-lock.yaml ]; then git add pnpm-lock.yaml; fi
if [ -f bun.lockb ]; then git add bun.lockb; fi
git commit -m "chore(deps): 安装 dayjs 和 framer-motion"
```

---

## Task 2: 新增 getCoverStats Server Action

**Files:**
- Modify: `src/lib/actions.ts`
- Modify: `src/lib/__tests__/actions.test.ts`

- [ ] **Step 1: 在 actions.ts 末尾添加 getCoverStats**

```typescript
export async function getCoverStats() {
  const [diaryCount, memoryCount] = await Promise.all([
    prisma.diaryEntry.count(),
    prisma.diaryImage.count(),
  ]);
  return { diaryCount, memoryCount };
}
```

- [ ] **Step 2: 写测试**

在 `src/lib/__tests__/actions.test.ts` 的 `CoupleProfile Actions` describe 块之后添加：

```typescript
describe('Cover Stats', () => {
  test('getCoverStats returns zero counts when empty', async () => {
    const stats = await getCoverStats();
    expect(stats.diaryCount).toBe(0);
    expect(stats.memoryCount).toBe(0);
  });

  test('getCoverStats returns correct counts', async () => {
    await createDiary({
      date: new Date('2025-01-15'),
      title: '第一篇',
      content: '内容',
      images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    });
    await createDiary({
      date: new Date('2025-01-16'),
      title: '第二篇',
      content: '内容',
    });

    const stats = await getCoverStats();
    expect(stats.diaryCount).toBe(2);
    expect(stats.memoryCount).toBe(2);
  });
});
```

同时需要在文件顶部添加 `getCoverStats` 到 import 列表：

```typescript
import {
  createDiary,
  // ... existing imports
  getCoverStats,
} from '../actions';
```

- [ ] **Step 3: 运行测试**

```bash
pnpm test -- src/lib/__tests__/actions.test.ts
```

Expected: 全部测试通过（包含新增的 2 个 Cover Stats 测试）

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions.ts src/lib/__tests__/actions.test.ts
git commit -m "feat(actions): 新增 getCoverStats Server Action"
```

---

## Task 3: 实现 AnimatedDays 组件

**Files:**
- Create: `src/components/AnimatedDays.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedDaysProps {
  days: number;
}

export default function AnimatedDays({ days }: AnimatedDaysProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const spring = useSpring(0, { duration: 1500 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion) {
      spring.set(days);
    }
  }, [days, prefersReducedMotion, spring]);

  if (prefersReducedMotion) {
    return <span className="text-5xl font-bold text-accent">{days}</span>;
  }

  return (
    <motion.span className="text-5xl font-bold text-accent">
      {display}
    </motion.span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AnimatedDays.tsx
git commit -m "feat(components): AnimatedDays 计数滚动动画组件"
```

---

## Task 4: 实现 FloatingButton 组件

**Files:**
- Create: `src/components/FloatingButton.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
'use client';

import Link from 'next/link';

interface FloatingButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function FloatingButton({ href, children }: FloatingButtonProps) {
  return (
    <Link
      href={href}
      className="inline-block bg-primary text-white rounded-full px-7 py-2.5 text-sm font-medium animate-float"
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: 在 globals.css 中注册 float 动画**

在 `src/app/globals.css` 的 `@theme` 块内添加：

```css
@theme {
  /* ... existing theme variables ... */
  --animate-float: float 3s ease-in-out infinite;
}
```

在 `@theme` 块之后添加 `@keyframes`：

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
    box-shadow: 0 6px 16px rgba(247, 200, 208, 0.35);
  }
  50% {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(247, 200, 208, 0.25);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FloatingButton.tsx src/app/globals.css
git commit -m "feat(components): FloatingButton 呼吸浮动动画组件"
```

---

## Task 5: 实现 CoverLogo 组件（保留彩蛋）

**Files:**
- Create: `src/components/CoverLogo.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
'use client';

import Image from 'next/image';
import { Modal, Typewriter } from 'animal-island-ui';
import { useState } from 'react';

export default function CoverLogo() {
  const [clickCount, setClickCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    if (nextCount >= 3) {
      setIsOpen(true);
      setClickCount(0);
    } else {
      setClickCount(nextCount);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setClickCount(0);
  };

  return (
    <>
      <button
        onClick={handleLogoClick}
        className="cursor-pointer bg-transparent border-none p-0"
        aria-label="恋爱小岛日记 Logo"
      >
        <Image
          src="/logo.svg"
          alt="恋爱小岛日记"
          width={48}
          height={48}
          priority
        />
      </button>

      <Modal
        open={isOpen}
        onClose={handleClose}
        maskClosable
        closable
        footer={null}
        width={320}
        typewriter={false}
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#E8AEB7"/>
          </svg>
          <Typewriter speed={80} trigger={isOpen}>
            <p className="text-base leading-relaxed text-text-main">
              你的眼睛真好看，里面有晴雨，日月，山川，江河，云雾，花鸟。
            </p>
            <p className="text-base leading-relaxed text-text-main">
              但是我的眼睛更好看，因为里面有你。
            </p>
          </Typewriter>
        </div>
      </Modal>
    </>
  );
}
```

注意：这里用自定义 SVG 心形替代了原来的 `❤` emoji，严格遵守项目"No Emoji"规则。

- [ ] **Step 2: Commit**

```bash
git add src/components/CoverLogo.tsx
git commit -m "feat(components): CoverLogo 组件，保留三次点击彩蛋"
```

---

## Task 6: 重写 page.tsx 封面页

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 重写 page.tsx**

完整替换 `src/app/page.tsx` 内容：

```tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import dayjs from 'dayjs';
import { getCoupleProfile, getCoverStats } from '@/lib/actions';
import CoverLogo from '@/components/CoverLogo';
import AnimatedDays from '@/components/AnimatedDays';
import FloatingButton from '@/components/FloatingButton';

export default async function Home() {
  const [profile, stats] = await Promise.all([
    getCoupleProfile(),
    getCoverStats(),
  ]);

  if (!profile) {
    redirect('/settings');
  }

  const days = dayjs().diff(dayjs(profile.anniversaryDate), 'day');
  const formattedDate = dayjs(profile.anniversaryDate).format('YYYY.MM.DD');

  return (
    <div className="min-h-screen bg-cream px-4 relative">
      <div className="mx-auto max-w-[480px] min-h-screen relative">
        {/* 设置按钮 */}
        <Link
          href="/settings"
          className="absolute top-4 right-0 p-2 text-text-sub hover:text-text-main transition-colors"
          aria-label="设置"
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>

        {/* Logo */}
        <div className="absolute top-14 left-2">
          <CoverLogo />
        </div>

        {/* 标题 */}
        <div className="absolute top-16 left-16 text-[10px] text-text-sub tracking-[3px]">
          恋爱小岛日记
        </div>

        {/* 昵称卡片 */}
        <div className="absolute top-[120px] left-2 rotate-[-2deg]">
          <div className="bg-card border border-border-soft rounded-xl px-5 py-3 shadow-sm">
            <div className="text-[15px] font-bold text-text-main">
              {profile.personAName}{' '}
              <span className="text-accent">&</span>{' '}
              {profile.personBName}
            </div>
            <div className="text-[9px] text-text-sub mt-1">
              {formattedDate} — 至今
            </div>
          </div>
        </div>

        {/* 天数 */}
        <div className="absolute top-[200px] right-6 text-right">
          <AnimatedDays days={days} />
          <div className="text-[11px] text-text-sub mt-1">天</div>
        </div>

        {/* 按钮 */}
        <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2">
          <FloatingButton href="/diary">翻开日记</FloatingButton>
        </div>

        {/* 统计 */}
        <div className="absolute bottom-6 right-6 text-[10px] text-text-sub">
          日记 {stats.diaryCount} · 回忆 {stats.memoryCount}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 启动 dev 服务器验证**

```bash
pnpm dev
```

在浏览器中打开 http://localhost:3000，验证：
1. 页面正确显示情侣昵称、日期范围
2. 天数数字有计数滚动动画
3. 按钮有浮动呼吸动画
4. 点击 Logo 三次弹出情话彩蛋
5. 点击齿轮图标跳转到 `/settings`
6. 点击"翻开日记"跳转到 `/diary`
7. 删除 CoupleProfile 后刷新页面，自动跳转到 `/settings`

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(page): 重写封面页 — 便签散落感布局 + 纪念日动画"
```

---

## Task 7: 集成验证与回归测试

**Files:**
- 全部已修改文件

- [ ] **Step 1: 运行全部测试**

```bash
pnpm test
```

Expected: 全部测试通过（无新增失败）

- [ ] **Step 2: 运行 ESLint**

```bash
pnpm lint
```

Expected: 无 error（warning 可以接受）

- [ ] **Step 3: 验证 prefers-reduced-motion**

在浏览器 DevTools 中开启 "Emulate CSS media feature prefers-reduced-motion: reduce"，刷新页面，验证：
- 天数数字直接显示最终值，无滚动动画
- 按钮无浮动动画

- [ ] **Step 4: Commit（如 lint 有修复）**

```bash
git add -A
git commit -m "chore: lint fix" || echo "no changes to commit"
```

---

## Spec Coverage Checklist

对照设计文档 `docs/superpowers/specs/2026-05-01-cover-page-design.md` 逐项确认：

| 需求 | 实现任务 |
|------|----------|
| 单层封面页架构 | Task 6 (page.tsx) |
| 便签散落感布局 | Task 6 (page.tsx 绝对定位 + rotate) |
| 跳跳体字体 | 复用项目现有配置，无需修改 |
| 正确显示双方昵称 | Task 6 |
| 正确显示在一起天数 | Task 6 + Task 3 (AnimatedDays) |
| 正确显示日期范围 | Task 6 |
| 显示日记总数和回忆数 | Task 2 + Task 6 |
| 点击"翻开日记"跳转到 `/diary` | Task 4 + Task 6 |
| 点击齿轮跳转到 `/settings` | Task 6 |
| 无 CoupleProfile 时 redirect `/settings` | Task 6 |
| 移动端最大宽度 480px | Task 6 (max-w-[480px]) |
| 按钮呼吸浮动动画 | Task 4 + globals.css |
| 天数计数滚动动画 | Task 3 (AnimatedDays) |
| prefers-reduced-motion 处理 | Task 3 (AnimatedDays) + Task 4 (float animation) |
| Logo 彩蛋保留 | Task 5 (CoverLogo) |
| 无 Emoji（SVG 心形替代） | Task 5 |

---

## 边界情况速查

| 场景 | 验证方式 |
|------|----------|
| CoupleProfile 不存在 | 清空数据库后访问 `/`，应 redirect 到 `/settings` |
| 在一起 0 天 | 设置 anniversaryDate 为今天，显示 `0` |
| 日记/回忆数为 0 | 显示 `日记 0 · 回忆 0` |
| prefers-reduced-motion | DevTools 模拟，动画应禁用 |
