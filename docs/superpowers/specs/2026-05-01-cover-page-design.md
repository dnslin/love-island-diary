# 封面页设计文档 — 便签散落感

## 来源

- Issue #4: [M2] 封面页：情侣信息展示 + 翻开日记入口 + 纪念日动画

## 背景

封面页是用户进入网站后的第一屏，相当于一本手账的"封面"。需要展示情侣信息、在一起天数，并提供进入日记的入口。

## 设计决策

### 架构方案：单层封面页（方案 A）

直接在 `/` 展示全部信息，点击"翻开日记"进入 `/diary`。不采用双层扉页结构，减少跳转层级。

### 布局风格：便签散落感（布局 A）

信息像手账贴纸一样分布在页面上，不对称、有角度，大面积留白，避免制式感。

### 字体：跳跳体（HYTiaoTiao.ttf）

项目当前已配置的字体，霞鹜文楷后续 Issue 再处理。

## 页面结构

```
┌─────────────────────────────┐
│                    [⚙]       │  ← 设置按钮（右上角）
│  [Logo]                     │  ← Logo（保留彩蛋：点击3次弹情话）
│       恋爱小岛日记           │  ← 小标题，letter-spacing 宽
│  ┌──────────────┐           │
│  │ 小兔子 & 大灰狼│           │  ← 昵称卡片（白底、微旋转 -2deg）
│  │ 2024.07.18 — 至今│         │
│  └──────────────┘           │
│                    365      │  ← 天数（大数字，偏右）
│                     天      │
│                             │
│                             │
│        [翻开日记]            │  ← 主按钮（pill，浮动动画）
│                             │
│                   日记 12 · 回忆 34 │  ← 统计（右下角小字）
└─────────────────────────────┘
```

## 组件拆分

| 组件 | 类型 | 职责 |
|------|------|------|
| `CoverPage` | Server Component (`page.tsx`) | 获取数据、处理 redirect |
| `AnimatedDays` | Client Component | 天数计数滚动动画 |
| `FloatingButton` | Client Component | 按钮呼吸浮动动画 |
| `EasterEggModal` | Client Component | Logo 点击彩蛋（复用现有逻辑） |

## 数据流

1. `CoverPage` (Server) 并发调用：
   - `getCoupleProfile()`
   - `prisma.diaryEntry.count()`
   - `prisma.diaryImage.count()`
2. 若 `CoupleProfile` 不存在 → `redirect('/settings')`
3. 数据通过 props 传给 `AnimatedDays` 和 `FloatingButton`
4. `AnimatedDays` 用 `framer-motion` 的 `useSpring` 做 0 → actualDays 的滚动

## 动画规范

### 按钮呼吸浮动

```css
@keyframes float {
  0%, 100% { transform: translateY(0); box-shadow: 0 6px 16px rgba(247,200,208,0.35); }
  50% { transform: translateY(-6px); box-shadow: 0 12px 24px rgba(247,200,208,0.25); }
}
```

周期 3s，ease-in-out，infinite。

### 天数计数滚动

```typescript
const animatedDays = useSpring(0, { duration: 1500 });
useEffect(() => { animatedDays.set(actualDays); }, [actualDays]);
```

`prefers-reduced-motion: reduce` 时直接显示最终数字，不触发动画。

## 样式规范

- 整体：`min-h-screen bg-cream px-4 relative`
- 内容最大宽度：480px，居中
- 昵称卡片：`bg-card border border-border-soft rounded-xl shadow-sm rotate-[-2deg]`
- 天数数字：`text-5xl font-bold text-accent`
- 按钮：`bg-primary text-white rounded-full px-7 py-2`
- 设置按钮：右上角固定，`text-text-sub hover:text-text-main`

## 依赖

- `dayjs` — 计算 `dayjs().diff(anniversaryDate, 'day')`
- `framer-motion` — 天数计数动画

## 边界情况

| 场景 | 行为 |
|------|------|
| CoupleProfile 不存在 | Server Component 内 `redirect('/settings')` |
| 在一起 0 天 | 显示 `0` |
| 日记/回忆数为 0 | 正常显示 `0` |
| prefers-reduced-motion | 跳过所有动画，直接显示最终状态 |
| 字体加载失败 | 回退到系统字体栈（已由 `globals.css` 保证） |

## 测试要求

- 天数计算逻辑正确（闰年场景用 dayjs diff 自然覆盖）
- CoupleProfile 不存在时正确重定向
- prefers-reduced-motion 时无动画

## 验收标准（对应 Issue #4）

- [ ] 正确显示双方昵称
- [ ] 正确显示在一起天数（从 anniversaryDate 计算到今天）
- [ ] 正确显示日期范围
- [ ] 显示日记总数和回忆数
- [ ] 点击"翻开日记"跳转到 `/diary`
- [ ] 点击右上角齿轮跳转到 `/settings`
- [ ] 首次访问无 CoupleProfile 时自动重定向到 `/settings`
- [ ] 整体居中，移动端最大宽度 480px
- [ ] 按钮有浮动呼吸动画
- [ ] 天数数字有计数滚动动画
