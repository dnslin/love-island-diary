# [M3] 移动端响应式适配实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现全局移动端响应式适配：安全区、输入框防放大、动画降级、键盘滚动，同时保持封面页现有设计不变。

**Architecture:** 采用最小侵入式方案，在全局 CSS 集中处理跨页面通用问题（`globals.css` + `layout.tsx`），通过客户端 Hook 处理键盘聚焦滚动，通过 framer-motion 属性处理动画降级。各页面现有 `max-w-[480px]` 约束保持不变。

**Tech Stack:** Next.js 16, Tailwind CSS v4, TypeScript, framer-motion, animal-island-ui

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/app/globals.css` | 修改 | 添加安全区工具类、输入框字号覆盖、prefers-reduced-motion 媒体查询、封面页小屏适配 |
| `src/app/layout.tsx` | 修改 | body 添加底部安全区 padding |
| `src/hooks/useKeyboardScroll.ts` | 新建 | 监听 focusin 事件，输入框聚焦时自动滚动到可视区域 |
| `src/components/DiaryForm.tsx` | 修改 | 集成 useKeyboardScroll hook |
| `src/components/SettingsForm.tsx` | 修改 | 集成 useKeyboardScroll hook |
| `src/app/(protected)/page.tsx` | 修改 | 添加 overflow-x-hidden 防止横向滚动 |
| `src/components/PageFlipWrapper.tsx` | 修改 | 翻书动画添加 reducedMotion="user" 支持 |

---

### Task 1: 全局 CSS 适配

**Files:**
- 修改: `src/app/globals.css`

- [ ] **Step 1: 添加安全区工具类和输入框字号覆盖**

在 `src/app/globals.css` 的 `body` 样式之后、input:focus 样式之前添加以下内容：

```css
/* 安全区适配 */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* 输入框字号 ≥16px，防止 iOS 自动放大 */
input,
textarea,
select {
  font-size: 16px !important;
}
```

- [ ] **Step 2: 添加 prefers-reduced-motion 媒体查询**

在文件末尾添加：

```css
/* 尊重用户减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: 添加封面页小屏高度适配**

在文件末尾（prefers-reduced-motion 之后）添加：

```css
/* 封面页小屏高度适配 */
@media (max-height: 700px) {
  .min-h-screen .absolute {
    /* 预留微调空间，当前保持默认 */
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: 添加全局移动端适配 CSS（安全区、输入框字号、动画降级）"
```

---

### Task 2: Layout 安全区适配

**Files:**
- 修改: `src/app/layout.tsx`

- [ ] **Step 1: body 添加底部安全区 padding**

修改 `src/app/layout.tsx` 中的 body 标签：

```tsx
<body className={`${hyTiaoTiao.variable} antialiased pb-[env(safe-area-inset-bottom)]`}>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(layout): body 添加底部安全区 padding"
```

---

### Task 3: 键盘聚焦滚动 Hook

**Files:**
- 创建: `src/hooks/useKeyboardScroll.ts`

- [ ] **Step 1: 创建 hook 文件**

创建 `src/hooks/useKeyboardScroll.ts`：

```ts
'use client';

import { useEffect } from 'react';

/**
 * 监听输入框聚焦事件，在移动端键盘弹出时自动滚动输入框到可视区域
 */
export function useKeyboardScroll() {
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useKeyboardScroll.ts
git commit -m "feat(hooks): 添加 useKeyboardScroll 键盘聚焦滚动 hook"
```

---

### Task 4: 表单集成键盘滚动

**Files:**
- 修改: `src/components/DiaryForm.tsx`
- 修改: `src/components/SettingsForm.tsx`

- [ ] **Step 1: DiaryForm 集成 hook**

在 `src/components/DiaryForm.tsx` 中：

1. 在现有 import 之后添加：
```ts
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';
```

2. 在 `DiaryForm` 函数体中，在 `useRouter()` 之后添加：
```ts
useKeyboardScroll();
```

- [ ] **Step 2: SettingsForm 集成 hook**

在 `src/components/SettingsForm.tsx` 中：

1. 在现有 import 之后添加：
```ts
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';
```

2. 在 `SettingsForm` 函数体中，在 `useActionState` 之后添加：
```ts
useKeyboardScroll();
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DiaryForm.tsx src/components/SettingsForm.tsx
git commit -m "feat(forms): 集成键盘聚焦滚动到日记表单和设置表单"
```

---

### Task 5: 封面页防溢出保护

**Files:**
- 修改: `src/app/(protected)/page.tsx`

- [ ] **Step 1: 添加 overflow-x-hidden**

修改 `src/app/(protected)/page.tsx` 中的外层 div：

将：
```tsx
<div className="min-h-screen bg-cream px-4 relative">
```

改为：
```tsx
<div className="min-h-screen bg-cream px-4 relative overflow-x-hidden">
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(protected\)/page.tsx
git commit -m "feat(cover): 添加 overflow-x-hidden 防止横向滚动"
```

---

### Task 6: 翻书动画降级支持

**Files:**
- 修改: `src/components/PageFlipWrapper.tsx`

- [ ] **Step 1: 添加 reducedMotion 支持**

修改 `src/components/PageFlipWrapper.tsx`，在 `motion.div` 组件上添加 `reducedMotion="user"` 属性。

找到 `<motion.div>` 或 `<AnimatePresence>` 相关的 motion 组件，添加属性：

```tsx
<motion.div
  reducedMotion="user"
  // ... 其他属性保持不变
>
```

如果文件中有多个 motion 组件，确保所有动画组件都添加此属性。

- [ ] **Step 2: Commit**

```bash
git add src/components/PageFlipWrapper.tsx
git commit -m "feat(PageFlipWrapper): 添加 reducedMotion 支持"
```

---

### Task 7: 验证测试

**Files:**
- 运行: `pnpm lint`
- 运行: `pnpm build`

- [ ] **Step 1: 运行 ESLint 检查**

```bash
pnpm lint
```

Expected: 无错误，无新增警告。

- [ ] **Step 2: 运行生产构建**

```bash
pnpm build
```

Expected: 构建成功，无错误。

- [ ] **Step 3: Chrome DevTools 设备模拟器测试**

1. 运行 `pnpm dev`
2. 打开 Chrome DevTools → Device Toolbar
3. 测试以下宽度：360px、375px、390px、414px、430px
4. 验证：
   - 无横向滚动（检查是否有横向滚动条）
   - 输入框聚焦时页面自动滚动
   - 底部内容不被遮挡

- [ ] **Step 4: Commit（如有修改）**

```bash
git add -A
git commit -m "fix: 修复 lint/build 问题"
```

---

## 自检清单

### 1. 规范覆盖检查

| 规范要求 | 对应任务 |
|---------|---------|
| 全局安全区适配 | Task 1 + Task 2 |
| 输入框字号 ≥16px | Task 1 |
| prefers-reduced-motion | Task 1 + Task 6 |
| 键盘聚焦滚动 | Task 3 + Task 4 |
| 封面页最小微调 | Task 5 |
| 无横向滚动 | Task 5 |

### 2. 占位符检查

- [ ] 无 TBD、TODO、FIXME
- [ ] 无 "implement later"、"fill in details"
- [ ] 无 "add appropriate error handling"
- [ ] 无 "Similar to Task N" 引用
- [ ] 每个代码步骤都有完整代码块

### 3. 类型一致性检查

- [ ] `useKeyboardScroll` 在 Task 3 创建，在 Task 4 中使用，名称一致
- [ ] `pb-safe` 在 Task 1 定义，在 Task 2 中使用 Tailwind 等效写法 `pb-[env(safe-area-inset-bottom)]`
- [ ] `reducedMotion="user"` 在 Task 6 中使用，与规范一致
