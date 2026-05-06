# [M3] 移动端响应式适配设计文档

## PRD 引用

- 来源文档：`docs/superpowers/specs/2026-04-30-love-diary-design.md`
- 对应 Issue：#10

## 背景与目标

### 背景

本项目主要使用场景在手机端，所有页面需要优先考虑移动端体验，同时保证 PC 端正常使用。当前大部分页面已使用 `max-w-[480px] mx-auto px-4` 约束，但缺少全局安全区适配、输入框字号防放大、动画降级等移动端关键优化。

### 目标

确保所有页面在移动端和 PC 端都有良好体验，无横向滚动，触控友好，键盘安全，同时保持封面页现有视觉设计不变。

## 范围界定

### 包含范围

- 全局底部安全区 `env(safe-area-inset-bottom)` 适配
- 输入框字号 ≥ 16px（防止 iOS 自动放大）
- `prefers-reduced-motion` 媒体查询支持
- 表单页面键盘聚焦自动滚动到可视区域
- 封面页最小化微调（不重构绝对定位布局）
- 无横向滚动保障

### 不包含范围

- 封面页绝对定位布局重构
- 平板端特殊适配（按移动端处理即可）
- 桌面端侧边栏布局（P2）
- 新增页面响应式约束（由各页面自行维护）

## 验收标准

### 功能验收

- [ ] 360px、375px、390px、414px、430px 宽度下无横向滚动
- [ ] 所有按钮点击区域 ≥ 48×48px
- [ ] 输入框聚焦时页面自动滚动，输入框不被键盘遮挡
- [ ] iPhone 底部安全区适配正确（底部内容不被 Home Indicator 遮挡）
- [ ] 图片在容器内自适应，不溢出

### UI 验收

- [ ] 内容在移动端占满宽度，PC 端居中
- [ ] 卡片阴影在移动端不过重
- [ ] 文字大小在移动端可读（正文 ≥ 14px，标题 ≥ 18px）

### 性能验收

- [ ] 动画使用 transform/opacity only（GPU 加速）
- [ ] 支持 prefers-reduced-motion 时禁用所有动画

## 技术实现方案

### 方案选择

采用**最小侵入式补充方案**：在全局 CSS 层面集中处理跨页面通用问题，保持各页面现有布局约束不变，封面页不重构。

### 实现步骤

#### 1. 全局安全区适配

在 `src/app/layout.tsx` 的 `<body>` 上添加底部安全区 padding：

```tsx
<body className={`${hyTiaoTiao.variable} antialiased pb-[env(safe-area-inset-bottom)]`}>
```

在 `src/app/globals.css` 中定义备用工具类：

```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

#### 2. 输入框字号防放大

在 `src/app/globals.css` 中全局覆盖输入框字号：

```css
input,
textarea,
select {
  font-size: 16px !important;
}
```

覆盖范围包含 animal-island-ui 的 Input 组件及原生 input/textarea/select 元素。

#### 3. prefers-reduced-motion 支持

在 `src/app/globals.css` 中添加媒体查询：

```css
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

framer-motion 翻书动画通过 `reducedMotion` 属性处理：

```tsx
<motion.div reducedMotion="user" ... />
```

#### 4. 键盘聚焦滚动

在表单页面（new、edit、settings）添加客户端脚本。创建 `src/hooks/useKeyboardScroll.ts`：

```ts
'use client';

import { useEffect } from 'react';

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

在 `DiaryForm` 和 `SettingsForm` 中调用此 hook。

#### 5. 封面页最小微调

保持现有绝对定位设计不变，在 `globals.css` 中添加小屏高度适配：

```css
@media (max-height: 700px) {
  /* 封面页元素间距微调 */
}
```

给封面页容器添加 `overflow-x-hidden` 防止横向滚动：

```tsx
<div className="min-h-screen bg-cream px-4 relative overflow-x-hidden">
```

#### 6. 触控优化验证

animal-island-ui Button `size="middle"` 高度为 48px，已满足 ≥48px 要求。确认现有页面按钮使用正确尺寸。

### 现有约束确认

以下页面已正确使用 `max-w-[480px] mx-auto px-4`，无需改动：

- `src/app/diary/page.tsx`
- `src/app/diary/new/page.tsx`
- `src/app/diary/[id]/edit/page.tsx`
- `src/components/SettingsForm.tsx`

## UI/UX 需求

### 响应式适配

- 移动端（<768px）：单列，内容宽度 100%，padding 16px
- 桌面端（≥1024px）：内容最大宽度 480px，居中，两侧留白

### 触控优化

- 按钮高度 48px
- 点击区域充足
- 滑动手势响应灵敏

## 测试要求

### 集成测试

- [ ] Chrome DevTools 设备模拟器测试各宽度（360px、375px、390px、414px、430px）
- [ ] 真机测试（iOS Safari + Android Chrome）
- [ ] 键盘弹出测试（输入框聚焦时是否自动滚动）
- [ ] 安全区测试（iPhone 底部 Home Indicator 区域）

### 边界情况

- [ ] 超长标题/正文不换行溢出
- [ ] 超大图片不撑破容器
- [ ] 小屏设备（<360px）的适配
- [ ] prefers-reduced-motion 设置下动画是否禁用

## 依赖关系

- 被阻塞于：无
- 阻塞：无

## 风险与注意事项

- iOS Safari 的 100vh 问题：本项目使用 `min-h-screen`，如遇到键盘弹出导致布局异常，可替换为 `-webkit-fill-available`
- 不同手机的键盘高度不同，需要充分测试
- 安全区适配需要真机验证（模拟器可能不准确）
- 输入框字号全局覆盖可能影响 animal-island-ui 的设计意图，但符合移动端可访问性要求
- 封面页的绝对定位在小屏高度下仍可能出现元素拥挤，已通过 `@media (max-height: 700px)` 预留微调空间
