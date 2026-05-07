# Issue #11 动画系统与插画设计文档

## PRD 引用

- 来源文档：docs/superpowers/specs/2026-04-30-love-diary-design.md
- 关联 Issue：#11

## 背景与目标

动画和插画是提升产品"温柔治愈感"的关键。但动画必须克制——轻、柔、顺、低负担，不能花哨或干扰主要操作。

本设计实现一套集中式的动画工具库和克制的插画装饰系统。

## 范围界定

### 包含范围

- 卡片列表 stagger 淡入动画（Framer Motion）
- 保存成功顶部提示动画
- 空状态插画 + 文案动画
- 5 种心情的 SVG 小图标（面部表情风格）
- 封面 subtle 背景插画动画增强
- 按钮点击反馈（whileTap scale）
- 弹窗出现动画（淡入 + 轻微缩放）
- prefers-reduced-motion 支持

### 不包含范围

- 复杂 3D 动画
- 视频/动图
- 粒子效果

## 架构设计

### 目录结构

在 `src/components/` 下新增两个目录：

```
src/components/
  animations/
    StaggerContainer.tsx    # stagger 动画容器
    FadeIn.tsx              # 淡入动画 wrapper
    SlideIn.tsx             # 滑入动画 wrapper
    ScaleIn.tsx             # 缩放淡入 wrapper（弹窗用）
    Toast.tsx               # 顶部提示组件（保存成功）
    useReducedMotion.ts     # reduced-motion hook
    index.ts                # 统一导出
  illustrations/
    MoodIcons.tsx           # 5 种心情 SVG 图标
    EmptyState.tsx          # 空状态插画 + 文案
    CoverDecorations.tsx    # 封面背景装饰（动画增强现有 SVG）
```

### 动画参数统一约定

- 缓动：`[0.4, 0, 0.2, 1]`（轻柔 ease-out）
- 时长：200-300ms（快速），stagger 延迟 60ms
- 弹窗：scale 0.95→1 + 淡入，200ms
- 按钮：whileTap scale 0.96

### 插画风格统一约定

- 线稿风格，低饱和度
- 心情图标：简单面部表情，SVG，20×20px
- 空状态：线稿 + 轻微浮动呼吸动画
- 封面装饰：现有静态 SVG 加 subtle 浮动动画

## 组件设计

### 1. useReducedMotion Hook

```typescript
// 检测系统是否启用了 reduced-motion
// 返回 boolean，所有动画组件内部读取
export function useReducedMotion(): boolean
```

实现：使用 `window.matchMedia('(prefers-reduced-motion: reduce)')`，SSR 时默认 `false`。

### 2. StaggerContainer + StaggerItem

```typescript
interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number; // 默认 0.06s
  className?: string;
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}
```

用于 `DiaryTimeline` 的月份卡片列表、时间线条目列表。每项淡入 + 上移 8px。

### 3. FadeIn

```typescript
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number; // 默认 0.25s
  className?: string;
}
```

通用淡入包装器，用于页面内容区域。

### 4. SlideIn

```typescript
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'top' | 'bottom' | 'left' | 'right'; // 默认 'top'
  duration?: number;
  className?: string;
}
```

用于 Toast 从顶部滑入。

### 5. ScaleIn

```typescript
interface ScaleInProps {
  children: React.ReactNode;
  duration?: number; // 默认 0.2s
  className?: string;
}
```

用于弹窗（`PasswordModal`、`DeleteConfirmModal`、`AdminPasswordModal`）的淡入 + 轻微缩放。

### 6. Toast

```typescript
interface ToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  autoClose?: number; // 默认 2000ms
}
```

从顶部温柔滑入，2 秒后自动消失。用于替换 `DiaryForm` 中静态的成功提示。

### 7. MoodIcons

每个图标为 20×20px 的线稿风格 SVG，低饱和度，与现有心情颜色对应：

| 心情 | 颜色 | 图标设计 |
|------|------|----------|
| 甜甜的 | `#F7C8D0` | 微笑带腮红 |
| 开心 | `#B8DDA8` | 大笑弯眼 |
| 想念 | `#AFC9F7` | 含情脉脉/闭眼微笑 |
| 平静 | `#D8C7E8` | 平和无表情 |
| 小难过 | `#E8C4A0` | 轻微皱眉 |

接口：

```typescript
interface MoodIconProps {
  mood: 'sweet' | 'happy' | 'miss' | 'calm' | 'sad';
  size?: number; // 默认 20
  className?: string;
}
```

替换现有 `DiaryDetail` 和 `DiaryTimeline` 中的纯色圆点，在 `MoodSelector` 中色块旁也显示图标。

### 8. EmptyState

替换 `DiaryTimeline` 中当前简单的书本 SVG。

设计：一本微微打开的空白日记本，旁边有一支铅笔，整体线稿风格。下方文案"还没有日记呢，翻开第一页吧"。

动画：插画整体有极轻微的上下浮动（呼吸感），周期 4s，幅度 3px。reduced-motion 时静止。

### 9. CoverDecorations

将 `app/(protected)/page.tsx` 中现有的 6 个静态 SVG 装饰（岛屿、云朵、小花、心形、星星）提取为独立组件，并添加 subtle 浮动动画：

- 云朵：缓慢水平飘动（周期 8-12s，幅度 5px）
- 小花：轻微旋转摆动（周期 6s，±5°）
- 心形/星星：轻微缩放脉冲（周期 4s，0.98-1.02）
- 岛屿：保持静态（作为视觉锚点）

所有浮动动画均使用 CSS `@keyframes`（性能更好，不涉及 React 重渲染），并在 `@media (prefers-reduced-motion: reduce)` 中禁用。

## 集成点

| 页面/组件 | 动画应用 | 组件 |
|-----------|----------|------|
| `DiaryTimeline` | 月份条目 stagger 淡入 | `StaggerContainer` + `StaggerItem` |
| `DiaryTimeline` | 空状态插画浮动 | `EmptyState` |
| `DiaryForm` | 保存成功提示滑入 | `Toast` |
| `DiaryForm` | 按钮点击反馈 | `whileTap` |
| `PasswordModal` | 弹窗缩放淡入 | `ScaleIn` |
| `DeleteConfirmModal` | 弹窗缩放淡入 | `ScaleIn` |
| `AdminPasswordModal` | 弹窗缩放淡入 | `ScaleIn` |
| `DiaryDetail` | 心情图标替换圆点 | `MoodIcon` |
| `MoodSelector` | 心情图标 + 按钮 whileTap | `MoodIcon` + `whileTap` |
| `CoverPage` | 装饰浮动动画 | `CoverDecorations` |

## Reduced-Motion 支持

所有动画组件内部统一处理 reduced-motion：

- Framer Motion 组件：如果 `useReducedMotion()` 返回 `true`，则 `transition={{ duration: 0 }}`，初始状态直接等于最终状态
- CSS 动画：在 `@media (prefers-reduced-motion: reduce)` 中禁用所有 `@keyframes`

## 动画原则

- 轻柔：缓动使用 `[0.4, 0, 0.2, 1]`
- 快速：大部分动画 200-300ms
- 不喧宾夺主：动画只增强体验，不强制用户等待
- 仪式感：关键操作（保存、翻页）有温柔反馈

## 测试策略

### 单元测试

- `useReducedMotion` hook 测试（mock matchMedia 返回 true/false）
- 各动画组件在 reduced-motion 下是否正确禁用动画
- `Toast` 自动关闭逻辑（2 秒后触发 onClose）

### 集成测试

- 各动画在真机/浏览器中流畅运行
- stagger 动画延迟是否正确（60ms 每项）

## 验收标准

### 动画验收

- [ ] 卡片列表 stagger 淡入：每项延迟 60ms，淡入 + 上移 8px
- [ ] 保存成功提示：从顶部温柔滑入，2 秒后自动消失
- [ ] 弹窗出现：淡入 + scale 从 0.95 到 1
- [ ] 按钮点击：whileTap scale 0.96
- [ ] 所有动画时长不超过 400ms（除浮动呼吸动画外）
- [ ] prefers-reduced-motion 时所有动画禁用

### 插画验收

- [ ] 空状态插画显示在日记列表为空时
- [ ] 插画为线稿风格，低饱和度
- [ ] 5 种心情各有一个简单 SVG 图标
- [ ] 封面背景有 subtle 线稿装饰动画

## 依赖关系

- 被阻塞于：Issue #4（封面页）、Issue #6（新增日记）、Issue #7（翻书动画已单独实现）
- 阻塞：无

## 风险与注意事项

- 动画过多会影响性能和用户体验，严格控制在清单范围内
- SVG 插画文件大小需要优化
- 不同设备的动画性能差异需要测试
- CSS `@keyframes` 动画不会触发 React 重渲染，性能优于 Framer Motion 的连续动画
