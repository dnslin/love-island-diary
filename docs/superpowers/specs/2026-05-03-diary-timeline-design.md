# 时间线目录页 — 设计文档

## 来源

- Issue #7: `[M2] 时间线目录页：竖向时间轴 + 日记列表 + 快速跳转`
- 主设计文档: `docs/superpowers/specs/2026-04-30-love-diary-design.md` 第 4.5 节
- 设计决策会议: 2026-05-03

## 背景与目标

时间线目录页 `/diary` 作为辅助导航工具，让用户可以快速定位到任意一天的日记。它从单篇日记页通过"时间线"按钮进入，不作为主导航。第一版重在"快速找到那天的回忆"，不追求高级筛选与搜索能力。

## 关键决策

1. **本 issue 顺手把入口也做了**：在 `/diary/[id]` 单篇日记页底部加"时间线"链接，否则做完目录页用户进不去。
2. **按月分组 + sticky 月份标签**：纯线性时间轴在数据量增长后难以快速定位，按月分组提供"记忆坐标"。
3. **空状态带 CTA 跳转 `/diary/new`**：让首次访问空目录的用户有出路，不是死胡同。
4. **数据复用现有 `getDiaryList()`**：当前数据量小，无需新建轻量 Server Action。
5. **同日多篇排序对齐 `getDiaryNeighbors`**：把 `getDiaryList` 的 `orderBy` 扩展为 `[{ date: 'desc' }, { createdAt: 'desc' }]`，保证目录顺序与翻页顺序一致。
6. **Server-first 实现**：除返回按钮外，整页 Server 渲染。当前无页内交互需求，避免过度 client 化。
7. **返回按钮使用 `router.back()` + fallback `/`**：满足 issue "回到上一页或封面"的语义。

## 页面路由

| 路由 | 用途 | 类型 | 本次操作 |
|------|------|------|----------|
| `/diary` | 时间线目录页 | Server Component | **新增** |
| `/diary/[id]` | 单篇日记详情页 | Server Component | **追加底部"时间线"入口** |

## 新增/修改文件清单

### 新增

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/app/diary/page.tsx` | Server Component | 数据获取、按月分组、传给 `DiaryTimeline` 渲染、空状态分支 |
| `src/components/DiaryTimeline.tsx` | Server Component | 纯渲染：sticky 月份标签 + 圆点 + 日期 + 标题列表 |
| `src/components/BackButton.tsx` | Client Component | `router.back()` + fallback `/`，复用给目录页顶部 |
| `src/lib/dayjs.ts` | 模块 | 集中初始化 `dayjs`：`dayjs.locale('zh-cn')`，输出已配置好的 `dayjs` |

### 修改

| 文件 | 改动 |
|------|------|
| `src/lib/actions.ts` | `getDiaryList` 的 `orderBy` 改为 `[{ date: 'desc' }, { createdAt: 'desc' }]` |
| `src/app/diary/[id]/page.tsx` | 在内容卡片下方追加"时间线"链接(纯 `<Link>` 即可) |

## 数据获取与排序

### `getDiaryList` 调整

```typescript
// 修改前
export async function getDiaryList() {
  return prisma.diaryEntry.findMany({
    orderBy: { date: 'desc' },
    include: { images: true },
  });
}

// 修改后
export async function getDiaryList() {
  return prisma.diaryEntry.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { images: true },
  });
}
```

封面页 `(protected)/page.tsx` 也调用 `getDiaryList()` 取 `[0]` 作为最新日记，二级排序键不影响其行为(同日多篇时取最新创建那一篇，更符合"最新"语义)。

### 按月分组

在 `/diary/page.tsx` Server 端用 `Map` 保留插入顺序：

```typescript
const groupByMonth = (entries: DiaryEntry[]) => {
  const groups = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const key = dayjs(entry.date).format('YYYY-MM');
    const arr = groups.get(key);
    if (arr) arr.push(entry);
    else groups.set(key, [entry]);
  }
  return groups;
};
```

由于 `entries` 已按 `[date desc, createdAt desc]` 排序，`Map` 中月份键自然按时间倒序排列，组内顺序也正确。

## UI 布局

### 整体结构

```
┌─────────────────────────────────┐
│ ←  目录                         │  顶部栏，固定高度，flex 居左
├─────────────────────────────────┤
│ ┌─ 2026 年 5 月 ───── sticky    │  月份标签，sticky top-0，半透明背景 + backdrop-blur
│ │                                │
│ ●─── 5月3日 周一  我们去了海边  │  时间轴项：圆点 + 日期 + 标题
│ │                                │
│ ●─── 5月1日 周六  今天的心情     │
│ │                                │
│ ┌─ 2026 年 4 月 ───── sticky    │
│ │                                │
│ ●─── 4月28日 周二 一起做的蛋糕   │
└─────────────────────────────────┘
```

### 容器与排版

- 外层 `<main className="min-h-screen bg-cream">`
- 内容 `<div className="max-w-[480px] mx-auto px-4 py-6">`
- 顶部栏与新增页保持一致：`flex items-center gap-4 mb-6` + `BackButton` + `<h1>目录</h1>`

### 时间轴绘制

每个月份分组的内部结构：

```tsx
<section className="relative pl-6">
  <h2 className="sticky top-0 bg-cream/95 backdrop-blur z-10 py-2 text-sm font-bold text-text-main">
    2026 年 5 月
  </h2>
  {/* 竖线（绝对定位贯穿整组） */}
  <div className="absolute left-[7px] top-10 bottom-0 w-px bg-border-soft" />
  <ul className="space-y-3 py-2">
    {entries.map((entry) => (
      <li key={entry.id} className="relative">
        <span className="absolute left-[-22px] top-2 w-3 h-3 rounded-full bg-primary" />
        <Link href={`/diary/${entry.id}`} className="block hover:bg-card/60 rounded-lg p-2 -m-2 transition-colors">
          <div className="text-xs text-text-sub">5月3日 周一</div>
          <div className="text-base text-text-main">我们去了海边</div>
        </Link>
      </li>
    ))}
  </ul>
</section>
```

> 圆点定位：列表项 `pl-6`(24px)预留空间，竖线 `left-[7px]`(8px 左缘 + 7px = 15px ≈ 圆点中心)，圆点 `left-[-22px]`(从 li 内文起算往左 22px)对齐。具体像素在实现时按视觉微调。

### 空状态

```tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  <svg /* 简笔本/书本占位插画，30x30 */ />
  <p className="mt-4 text-text-sub">还没有日记呢，翻开第一页吧</p>
  <Link href="/diary/new" className="mt-6">
    <Button type="primary">写下第一篇</Button>
  </Link>
</div>
```

> `animal-island-ui` 的 `Button` 是纯 `<button>` 元素，没有 `href` prop（见 `node_modules/animal-island-ui/dist/types/components/Button/Button.d.ts`）。用 `<Link>` 包裹即可。

### 单篇页时间线入口

在 `src/app/diary/[id]/page.tsx` 的 `<div className="bg-card rounded-2xl p-4 shadow-sm">` 下方追加：

```tsx
<div className="mt-6 flex justify-center">
  <Link
    href="/diary"
    className="inline-flex items-center gap-2 text-sm text-text-sub hover:text-text-main transition-colors"
    aria-label="返回时间线"
  >
    <svg /* 三横线时间轴 SVG，14x14 */ />
    时间线
  </Link>
</div>
```

不修改 `DiaryDetail.tsx`，本入口只属于路由层。

## 视觉与文案默认值

| 项 | 值 |
|----|----|
| 顶部标题 | `目录` |
| 日期格式 | `M月D日 周X`(`dayjs` zh-cn locale，例如 `5月3日 周一`) |
| 月份标签格式 | `YYYY 年 M 月`(例如 `2026 年 5 月`) |
| 默认标题 | `${YYYY年M月D日} 的心情`(沿用 `DiaryDetail.tsx:19`) |
| 空状态文案 | `还没有日记呢，翻开第一页吧` |
| 空状态 CTA 文字 | `写下第一篇` |
| 时间线竖线粗细 | 1px |
| 时间线竖线颜色 | `--color-border-soft` (#F1E4DD) |
| 圆点尺寸 | 12px (w-3 h-3) |
| 圆点颜色 | `--color-primary` (#F7C8D0) |
| 月份标签字号 | `text-sm font-bold` |
| 月份标签颜色 | `text-text-main` (#5B4B49) |
| 月份标签背景 | `bg-cream/95 backdrop-blur` |
| 日期文字 | `text-xs text-text-sub` (#8A7C78) |
| 标题文字 | `text-base text-text-main` (#5B4B49) |
| 列表项 hover | `hover:bg-card/60` |

## dayjs 中文 locale 初始化

新增 `src/lib/dayjs.ts`：

```typescript
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export default dayjs;
```

需要中文星期的页面(本次新增的目录页)从 `@/lib/dayjs` 引入。其他既有页面(`(protected)/page.tsx`、`DiaryDetail.tsx` 等)目前直接 `import dayjs from 'dayjs'` 用法不变——现有页面没有用到中文 weekday，也不会被影响。

## 数据流

```
URL /diary
  ↓
src/app/diary/page.tsx (Server Component)
  ↓
getDiaryList()  →  Prisma  →  SQLite
  ↓
按 YYYY-MM 分组成 Map
  ↓
传给 <DiaryTimeline groups={...} />
  ↓
渲染 sticky 月份标签 + 时间轴列表
```

## 错误处理

- **DB 异常**：交给现有 `src/app/error.tsx` 错误边界，无需新增本页 error.tsx。
- **空数组**：正常分支，渲染空状态，不抛 `notFound()`。
- **无效 entry.date**：理论上数据库已校验，不再防御。
- **直接访问 `/diary` 无来源**：`BackButton` 检测 `window.history.length <= 1` 时 `router.push('/')` 而非 `router.back()`。

## 测试策略

### 新增测试

| 测试目标 | 位置 | 覆盖 |
|----------|------|------|
| `DiaryTimeline` 渲染 | `src/components/__tests__/DiaryTimeline.test.tsx` | 空数据、单篇、多篇、跨月、默认标题 |
| `BackButton` fallback | `src/components/__tests__/BackButton.test.tsx` | history.length > 1 调 back，否则 push('/') |

### 已有测试沿用

- `src/lib/__tests__/actions.test.ts` 中已有 `getDiaryList` 测试。本次需要**新增/修改**一个用例验证：同日多篇按 `createdAt desc` 二级排序。
- 其余 actions 测试不动。

### 边界情况自测清单

- [ ] 0 篇日记 → 空状态显示，CTA 跳 `/diary/new`
- [ ] 1 篇日记 → 单条显示，单组月份标签，无视觉异常
- [ ] 同日 3 篇 → 按 `createdAt desc` 内部排序
- [ ] 跨年(如 2025-12 + 2026-01) → 月份分组按时间倒序正确切换，月份标签包含年份
- [ ] 空标题 → 显示默认标题 `${YYYY年M月D日} 的心情`
- [ ] sticky 月份标签滚动正确替换且不闪烁
- [ ] 直接访问 `/diary` URL 无来源 → 返回按钮 fallback 到 `/`
- [ ] 从 `/diary/[id]` 进入 → 返回回到该日记页
- [ ] `/diary/[id]` 底部"时间线"入口可点击进入 `/diary`
- [ ] 移动端宽度 < 480px 布局正确
- [ ] `prefers-reduced-motion` 下无动画(本次基本无动画，自然满足)

## 不包含范围

- 按月份/年份**筛选**(P2，与按月分组不是一回事)
- 搜索(P2)
- 日历视图(Issue #13)
- 分页 / 虚拟滚动(数据量小，暂不处理；当数据 > 200 条再考虑)
- 编辑/删除日记(Issue #9)
- 翻书动画(Issue #8)
- 多人头像/合作者标记
- 列表项的图片缩略图(目录追求简洁)

## 依赖

- `animal-island-ui`(`Button` 用于空状态 CTA)
- `dayjs` + `dayjs/locale/zh-cn`(项目已安装 `dayjs`，locale 文件随包发布无需新装)
- `next/link`(已有)
- `next/navigation`(已有)
- 已有 Server Action：`getDiaryList`(将做小幅 `orderBy` 调整)

## 风险与注意事项

- **sticky 月份标签穿透**：当列表项 hover 背景色与 sticky 半透明背景叠加可能视觉怪异。已通过 `bg-cream/95 backdrop-blur` 和较高 `z-10` 缓解，开发时实际看一下。
- **`dayjs` locale 全局副作用**：在 `lib/dayjs.ts` 中调用 `dayjs.locale('zh-cn')` 是全局设置。其他文件即使从 `dayjs` 直接 import，导入图加载顺序后也会受影响——这正是想要的，无副作用。
- **`getDiaryList` 排序变更的回归**：封面页只取 `[0]`，二级排序键变化最多影响"同日多篇时取哪一篇为最新"，逻辑上更合理，不构成回归。actions 测试需要补一个用例显式验证。
- **空状态 SVG**：暂用极简 SVG 占位，可在动画系统(Issue #11)统一时再替换为正式插画。
