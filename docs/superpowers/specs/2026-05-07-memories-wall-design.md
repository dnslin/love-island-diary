# Issue #12 回忆照片墙设计文档

## PRD 引用

- 来源文档：docs/superpowers/specs/2026-04-30-love-diary-design.md
- 关联 Issue：#12

## 背景与目标

### 背景

回忆照片墙是 P1 阶段功能，用于展示日记中的外链图片，形成照片墙效果。这是给用户和伴侣回顾照片的重要入口。

### 目标

实现一个简洁的照片墙页面，展示所有日记中的外链图片，采用瀑布流布局，支持入场动画和懒加载。

## 范围界定

### 包含范围

- 瀑布流布局展示所有外链图片
- 点击图片查看关联日记
- 按时间倒序排列
- 空状态处理
- 图片加载失败占位符
- 封面页 + 日记时间线页 双入口
- 图片入场动画（StaggerContainer）
- 图片懒加载

### 不包含范围

- 图片本地上传（P1 仍使用外链 URL）
- 按月份筛选（P2）
- 图片预览弹窗（P2）
- 复杂 3D 动画或粒子效果

## 架构设计

### 目录结构

```
src/
  app/
    memories/
      page.tsx                 # Server Component：获取数据、渲染页面
  components/
    MasonryGrid.tsx            # Client Component：瀑布流布局计算
    MemoryCard.tsx             # 单张图片卡片（点击跳转）
    EmptyMemories.tsx          # 空状态（复用 EmptyState）
  lib/
    actions.ts                 # 新增 getAllDiaryImages()
```

### 现有文件修改

- `src/components/CoverActions.tsx` — 添加"回忆照片墙"入口
- `src/app/diary/page.tsx`（或 DiaryTimeline 附近）— 添加照片墙入口

### 组件职责

| 组件 | 类型 | 职责 |
|------|------|------|
| `page.tsx` | Server Component | 调用 `getAllDiaryImages()`，将图片数组传给 `MasonryGrid` |
| `MasonryGrid` | Client Component | 接收图片数组，用 `useEffect` 计算列高，将图片分配到最短列，渲染多列结构 |
| `MemoryCard` | Client Component | 显示单张图片（`img` 标签 + `loading="lazy"`），包裹在 `StaggerItem` 中，点击跳转 `/diary/[entryId]` |
| `EmptyMemories` | Client Component | 无图片时显示空状态插画 + 文案 |

## 数据流设计

### 新增 Server Action

```typescript
export async function getAllDiaryImages() {
  return prisma.diaryImage.findMany({
    orderBy: {
      entry: { date: 'desc' },
    },
    include: { entry: { select: { id: true, date: true } } },
  });
}
```

返回类型：`(DiaryImage & { entry: { id: string; date: Date } })[]`，按关联日记的 `date` 倒序排列。

### page.tsx 数据流

```tsx
export default async function MemoriesPage() {
  const images = await getAllDiaryImages();
  return (
    <main className="max-w-[480px] mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-text-main mb-4">回忆照片墙</h1>
      {images.length === 0 ? (
        <EmptyMemories />
      ) : (
        <MasonryGrid images={images} />
      )}
    </main>
  );
}
```

全链路 Server Component，首屏直接渲染 HTML，无额外数据请求。

## UI 设计

### 瀑布流算法

用 ResizeObserver 监听容器宽度，计算当前应有几列：
- 容器宽度 < 640px：2 列
- 容器宽度 >= 640px：3 列

每张图片加载后获取其渲染高度，分配到当前**高度最短**的列中。这样形成自然的错落效果。

### 样式约定

- 图片圆角：`rounded-xl`（12px）
- 列间距：`gap-2`（8px）
- 图片填充：`w-full h-auto object-cover`
- 页面标题：`text-xl font-bold text-text-main`
- 页面边距：`px-4 py-6`
- 整体最大宽度：`max-w-[480px] mx-auto`

### 图片加载失败占位符

图片 `onError` 时切换为占位状态——显示一个与主题色一致的圆角色块，中心一个小图标提示加载失败：

```tsx
<div className="w-full aspect-[4/3] bg-border-soft rounded-xl flex items-center justify-center">
  <span className="text-xs text-text-sub">图片加载失败</span>
</div>
```

## 动画与交互

### 入场动画

`MasonryGrid` 内部用 `StaggerContainer` 包裹所有图片卡片，`MemoryCard` 用 `StaggerItem` 包裹。

效果：图片依次淡入 + 轻微上浮（opacity 0→1, y: 8→0），每张间隔 60ms，时长 250ms，使用已有动画系统的 `gentleEase` 缓动。

### 减少动画偏好

复用 `useReducedMotion` hook，系统开启减少动画时直接显示，无过渡。

### 交互

- 点击图片 → 跳转 `/diary/[entryId]`（Next.js `Link` 包裹）
- hover 状态：图片轻微放大 `scale(1.02)` + 阴影加深，过渡 200ms
- 不使用 `whileTap`，因为图片是链接而非按钮

### 懒加载

所有 `img` 标签设置 `loading="lazy"`，滚动到视口附近再加载。

## 错误处理与空状态

### 空状态

无图片时显示 `EmptyMemories`：

```tsx
<EmptyState message="还没有照片呢，先写一篇日记配上图片吧">
  <Link href="/diary/new">
    <Button type="primary">去写日记</Button>
  </Link>
</EmptyState>
```

复用现有的 `EmptyState` 组件，自定义文案和跳转按钮。

### 图片加载失败

单张图片 `onError` 后显示占位，保持卡片占位，不破坏瀑布流布局。

### 服务端错误

`getAllDiaryImages()` 异常时，`page.tsx` 使用 Next.js `error.tsx` 降级处理（项目已有全局 error.tsx）。

## 页面入口设计

### 封面页入口（CoverActions.tsx）

在"翻开日记"按钮旁添加二级入口，用纯文字链接，不抢主按钮的视觉焦点：

```tsx
<div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
  <button onClick={handleReadClick} className="...">翻开日记</button>
  <button onClick={handleMemoriesClick} className="text-sm text-text-sub hover:text-text-main transition-colors">
    回忆照片墙
  </button>
  {showWriteButton && <FloatingButton href='/diary/new'>写下今天</FloatingButton>}
</div>
```

### 日记时间线入口

在 `DiaryTimeline` 顶部、月份分组之前，添加一个 subtle 入口：

```tsx
<div className="flex justify-between items-center mb-4">
  <h1 className="text-xl font-bold">恋爱日记</h1>
  <Link href="/memories" className="text-sm text-primary hover:text-accent">
    照片墙
  </Link>
</div>
```

## 依赖关系

- 依赖：Issue #2（DiaryImage 数据模型，已就绪）
- 阻塞：无

## 风险与注意事项

- 外链图片可能存在跨域问题，已考虑错误处理（占位符）
- 图片数量多时使用原生 `loading="lazy"` 懒加载
- 瀑布流布局依赖客户端 JS 计算，首屏可能有轻微布局偏移（使用 `useEffect` + ResizeObserver 最小化）
