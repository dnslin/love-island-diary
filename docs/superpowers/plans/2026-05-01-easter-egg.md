# 彩蛋：三连点击 Logo 触发情话弹窗 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在封面页实现点击 Logo 三次触发弹窗，弹窗内以打字机效果展示情话文案。

**Architecture:** 封面页 `page.tsx` 升级为客户端组件，通过 `useState` 管理点击计数和弹窗显隐；弹窗使用 `animal-island-ui` 的 `Modal`，文案使用 `Typewriter` 组件实现逐字显示。

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS v4, animal-island-ui

---

## File Structure

| File | Action | Responsibility |
|------|--------|--------------|
| `src/app/page.tsx` | Modify | 封面页：Logo 点击计数 + Modal + Typewriter 彩蛋 |

---

## Important Context

- `page.tsx` 当前是服务端组件（无 `"use client"`），但点击事件和 `useState` 需要客户端运行，因此必须添加 `"use client"` 指令。
- `animal-island-ui` 的 `ICON_LIST` 中没有 `heart` 图标，因此不引入 `Icon` 组件，改用 CSS 绘制或纯文本爱心符号（❤）。
- `Typewriter` 的 `trigger` 传入 `isOpen`，确保每次弹窗打开都重新播放动画。

---

### Task 1: 升级 page.tsx 为客户端组件并添加点击计数逻辑

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 添加 "use client" 和引入依赖**

在文件顶部添加 `"use client"`，并引入 `useState` 以及 `Modal`、`Typewriter`：

```tsx
"use client";

import Image from "next/image";
import { Button, Modal, Typewriter } from "animal-island-ui";
import { useState } from "react";
```

- [ ] **Step 2: 添加点击计数和弹窗状态**

在 `Home` 组件内添加：

```tsx
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
```

- [ ] **Step 3: 为 Logo 添加 onClick 事件**

将 `Image` 组件替换为可点击的 `button` 包裹（保持无障碍和样式）：

```tsx
<button
  onClick={handleLogoClick}
  className="cursor-pointer bg-transparent border-none p-0"
  aria-label="恋爱小岛日记 Logo"
>
  <Image
    src="/logo.svg"
    alt="恋爱小岛日记"
    width={120}
    height={120}
    priority
  />
</button>
```

> 注意：`Image` 本身不原生支持 `onClick`，用 `button` 包裹是最好的做法。

- [ ] **Step 4: 添加 Modal 和 Typewriter**

在 `main` 元素末尾（Button 之后）添加弹窗：

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  maskClosable
  closable
  footer={null}
  width={320}
>
  <div className="flex flex-col items-center gap-4 py-4 text-center">
    <span className="text-2xl">❤</span>
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
```

- [ ] **Step 5: 运行开发服务器验证**

Run: `pnpm dev`

Expected: 开发服务器启动，无编译错误。

- [ ] **Step 6: 浏览器手动验证**

1. 打开 `http://localhost:3000`。
2. 连续点击 Logo 三次。
3. 预期：弹窗出现，文案以打字机效果逐字显示。
4. 关闭弹窗（点击关闭按钮或遮罩）。
5. 再次点击 Logo 三次，预期弹窗重新出现并重新播放打字机动画。

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: 添加 Logo 三连点击彩蛋 — 打字机情话弹窗"
```

---

## Spec Coverage Check

| Spec 需求 | 对应 Task |
|-----------|-----------|
| 封面页点击 Logo 三次触发 | Task 1 Step 2, 3 |
| 弹窗展示 | Task 1 Step 4 |
| 打字机效果 | Task 1 Step 4 (Typewriter) |
| 使用 animal-island-ui | Task 1 Step 1 (Modal, Typewriter) |
| 关闭后重置计数 | Task 1 Step 2 (handleClose) |
| 每次打开重新播放动画 | Task 1 Step 4 (trigger={isOpen}) |

---

## Placeholder Scan

- 无 "TBD", "TODO", "implement later"。
- 所有代码均为可直接粘贴的完整代码。
- 无未定义的类型或方法。
