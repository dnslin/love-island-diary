# 日历页设计文档

## 背景

Issue #13 要求实现一个温柔的日历页，以"回忆索引"的形式展示哪些日期写过日记，支持月份切换和日期点击跳转。

## 关键决策

1. **同一天多篇日记**：点击有日记的日期，展开浮层显示当天所有日记列表，再选择具体某篇进入。
2. **日历入口**：在 `/diary` 目录页顶部新增「时间线 | 日历」两个链接切换。
3. **月份切换**：顶部左右箭头切换月份，按需查询当月数据。
4. **路由设计**：独立路由 `/calendar`，目录页顶部放两个链接互相跳转。

## 方案对比

### 方案 A：URL Query 驱动月份（Server Component 为主）— 推荐

- `/calendar?month=2025-05`
- Server Component 读取 `searchParams`，调用 `getDiaryDatesInMonth` 获取当月数据
- 月份切换通过 `<Link href="/calendar?month=...">` 实现
- 日历网格用 `StaggerContainer` 做 stagger 淡入动画
- 当天日记浮层用独立 Client Component + `animal-island-ui` Modal

**优点**：
- 刷新后保持月份状态，可分享特定月份链接
- 符合项目现有 Server Component 优先架构
- 首屏直出，无 hydration 负担
- 实现简单，维护成本低

**缺点**：
- 切换月份有整页导航感（通过 `prefetch` + stagger 动画缓解）

### 方案 B：混合模式（Server + Client）

- `/calendar` Server Component 只渲染首屏当前月份
- 内部包裹 `CalendarView` Client Component
- 月份切换在客户端完成，调用 Server Action 获取数据

**优点**：
- 切换月份可添加左右滑动过渡动画
- 交互更 App-like

**缺点**：
- 需要更多客户端代码
- 状态不可分享
- 实现复杂度稍高
- 与项目现有纯 Server Component 页面风格不一致

## 推荐方案：方案 A

项目现有页面（`memories`、`diary`）均为纯 Server Component，保持架构一致性更重要。URL 驱动的方式还能让用户分享特定月份的回忆索引。

## 架构设计

### 路由

- 新建 `src/app/calendar/page.tsx`
- 在 `src/app/diary/page.tsx` 顶部，将现有的「照片墙」链接区域改为「时间线 | 日历」两个切换链接

### 数据层

新增 Server Action `getDiaryDatesInMonth(year: number, month: number)`：

- 查询当月所有日记，按日期分组
- 返回轻量数据：`{ date: string; entries: { id, title }[] }[]`
- 同时返回当月日记总数，用于顶部文案

### 组件结构

```
src/app/calendar/page.tsx          # Server Component: 获取数据、布局骨架
src/components/CalendarGrid.tsx    # Client Component: 日历网格渲染 + 浮层触发
src/components/DayEntriesModal.tsx # Client Component: 当天日记列表浮层
```

### 日历网格设计

- **星期标题**：日 一 二 三 四 五 六
- **日期格子**：
  - 有日记的日期：底部显示主色小圆点 `#F7C8D0`
  - 今天：特殊边框高亮
  - 其他月份日期（上月/下月填充）：灰色淡化显示
- **月份导航**：顶部显示「2025年5月」，左右箭头切换（`<Link>`）
- **统计文案**：日历上方显示「这个月，我们记录了 X 天。」

### 当天日记浮层

- 基于 `animal-island-ui` 的 `Modal` 组件
- 浮层标题显示日期（如「5月8日的日记」）
- 列表展示当天所有日记的标题，点击跳转 `diary/[id]`
- 如果当天只有一篇日记，可以直接跳转，无需浮层（优化体验）

### 动画

- **日历容器**：`SlideIn direction="bottom"` 轻微上滑进入
- **日期格子**：`StaggerContainer` + `StaggerItem` 依次淡入
- **浮层**：`ScaleIn` 缩放淡入

### 空状态

- 当月无日记时，日历正常展示，但没有任何标记
- 顶部文案显示「这个月还没有记录。」

## 样式规范

- 背景：`bg-cream`
- 容器：`max-w-[480px] mx-auto px-4 py-6`
- 有日记标记：`bg-primary` 小圆点
- 文字颜色：标题 `text-text-main`，副标题 `text-text-sub`
- 边框/分割线：`border-soft`
- 无 emoji，使用 SVG 图标

## 验收标准映射

| 验收项 | 实现方式 |
|--------|----------|
| 正确展示当前月份日历 | dayjs 生成 7xN 网格，填充前后月日期 |
| 有日记的日期有特殊标记 | 底部 `#F7C8D0` 小圆点 |
| 点击有日记的日期跳转到该日记 | 多篇时展开 Modal 列表，单篇直接跳转 |
| 点击无日记的日期无反应或显示提示 | 无反应（不添加点击事件） |
| 月份切换动画平滑 | `StaggerContainer` stagger 淡入 |
| 日历网格清晰，日期数字可读 | Tailwind grid，适当间距和字号 |
| 有日记的日期标记使用主色 `#F7C8D0` | `bg-primary` |
| 整体风格与产品一致 | cream 主题、跳跳体字体、圆角风格 |
