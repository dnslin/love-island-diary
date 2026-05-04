# Issue #8：单篇日记页 + 翻书动画 — 设计文档

## 1. 目标

实现单篇日记阅读页的核心体验：支持上一篇/下一篇导航，带有整页 3D 翻书动画效果，支持左右滑动手势切换。

## 2. 范围

### 包含
- 单篇日记完整内容展示（心情标签、篇数序号、标题、正文、外链图片）
- 上一篇/下一篇导航按钮
- Framer Motion 3D 翻书动画（rotateY + perspective）
- 左右滑动手势切换
- 底部：时间线按钮 + 上一篇/下一篇按钮
- 顶部：返回封面按钮 + 日期

### 不包含
- 编辑功能（Issue #9）
- 删除功能（Issue #9）
- 评论/点赞

## 3. 组件架构

```
src/app/diary/[id]/page.tsx          # Server Component（数据获取）
src/components/PageFlipWrapper.tsx    # Client Component（翻书动画 + 手势）
src/components/DiaryNavigation.tsx    # 底部导航按钮
src/components/DiaryDetail.tsx        # 现有组件复用（日记内容展示）
```

### 3.1 page.tsx（Server Component）

- 调用 `getDiaryById(id)` 获取当前日记
- 调用 `getDiaryNeighbors(id)` 获取上一篇/下一篇 ID
- 将数据传给 `PageFlipWrapper`
- 保留现有 `generateMetadata` 生成页面标题

### 3.2 PageFlipWrapper（Client Component）

状态：
- `direction: 'left' | 'right' | null` — 翻页方向
- `isAnimating: boolean` — 动画锁

职责：
- 3D 透视容器（`perspective: 1200px`）
- `AnimatePresence mode="wait"` 管理 enter/exit 动画
- 触摸事件监听（原生 Touch API）
- 动画完成后 `router.push` 到新 URL

### 3.3 DiaryNavigation

- 接收 `prevId`、`nextId`
- 边界时隐藏对应按钮
- 点击时触发父组件的翻页函数
- 时间线按钮始终显示，跳转 `/diary`

## 4. 数据流

```
page.tsx (Server)
  ├─ entry = getDiaryById(id)
  ├─ { prevId, nextId } = getDiaryNeighbors(id)
  └─ 渲染 <PageFlipWrapper entry={entry} prevId={prevId} nextId={nextId} />

PageFlipWrapper (Client)
  ├─ 初始化 direction = null, isAnimating = false
  ├─ 用户点击/手势触发翻页：
  │   1. 设置 direction（'left' 或 'right'）
  │   2. isAnimating = true
  │   3. AnimatePresence exit 动画（当前页 rotateY 翻走）
  │   4. onAnimationComplete → router.push(`/diary/${targetId}`)
  └─ 新 page.tsx 渲染，新 entry 从相反方向翻入
```

## 5. 翻书动画实现

### 5.1 3D 容器

```tsx
<div
  style={{
    perspective: '1200px',
    transformStyle: 'preserve-3d',
  }}
>
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={entry.id}
      custom={direction}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      onAnimationComplete={() => setIsAnimating(false)}
      style={{
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* 整页内容 */}
    </motion.div>
  </AnimatePresence>
</div>
```

### 5.2 动画 Variants

| 方向 | enter | exit |
|------|-------|------|
| 下一篇（向右翻） | `rotateY: 90`, `x: '50%'` | `rotateY: -90`, `x: '-50%'` |
| 上一篇（向左翻） | `rotateY: -90`, `x: '-50%'` | `rotateY: 90`, `x: '50%'` |
| center | `rotateY: 0`, `x: 0`, `opacity: 1` | — |

所有状态的 `opacity` 在 enter 时为 0，center 时为 1，exit 时为 0。

## 6. 手势检测

使用原生 Touch 事件（不引入额外库）：

```typescript
const touchStartX = useRef<number | null>(null);

const onTouchStart = (e: TouchEvent) => {
  if (isAnimating) return;
  touchStartX.current = e.touches[0].clientX;
};

const onTouchEnd = (e: TouchEvent) => {
  if (isAnimating || touchStartX.current === null) return;
  const diff = e.changedTouches[0].clientX - touchStartX.current;
  if (diff > 80 && prevId) goToPrev();
  if (diff < -80 && nextId) goToNext();
  touchStartX.current = null;
};
```

阈值：80px。

## 7. 边界情况处理

| 场景 | 处理 |
|------|------|
| 第一篇日记 | 隐藏"上一篇"按钮，右滑无效 |
| 最后一篇日记 | 隐藏"下一篇"按钮，左滑无效 |
| 只有一篇日记 | 两个导航按钮都隐藏，手势无效 |
| 快速连续翻页 | `isAnimating` 锁阻止新翻页请求 |
| `prefers-reduced-motion` | 检测后跳过动画，直接 `router.push` |
| 图片加载失败 | 显示占位区域（奶油色背景 + 提示文字） |
| 手势与图片横向滚动冲突 | 图片区域手势不触发翻页 |

## 8. UI 布局

### 8.1 整页结构（从上到下）

```
┌─────────────────────────────────┐
│ ← 返回封面    日期    → 下一篇   │  ← 顶部导航
├─────────────────────────────────┤
│                                 │
│    ┌─────────────────────┐      │
│    │ 心情标签    第 N 篇  │      │
│    │                     │      │
│    │       标题           │      │
│    │                     │      │
│    │    正文内容...       │      │  ← 日记卡片（大圆角 16px）
│    │                     │      │
│    │    [图片]            │      │
│    └─────────────────────┘      │
│                                 │
├─────────────────────────────────┤
│ 时间线          上一篇  下一篇   │  ← 底部导航
└─────────────────────────────────┘
```

### 8.2 样式规范

- 卡片：`bg-card rounded-2xl p-4 shadow-sm`
- 图片：`rounded-xl w-full object-cover`
- 心情标签：使用设计文档中的心情色（开心 `#B8DDA8`、想念 `#AFC9F7` 等）
- 导航按钮：pill 形状，`rounded-full`，hover 轻微上浮

## 9. 技术依赖

- **framer-motion**：已安装，用于翻书动画
- **next/navigation**：`useRouter`，用于路由导航
- **原生 Touch API**：手势检测，无额外依赖

## 10. 与现有代码的集成

### 10.1 复用组件

- `DiaryDetail.tsx`：已有日记内容展示，直接复用
- `BackButton.tsx`：已有返回按钮组件

### 10.2 Server Actions

需要 `getDiaryNeighbors(id)`：

```typescript
async function getDiaryNeighbors(id: string): Promise<{
  prevId: string | null;
  nextId: string | null;
}> {
  // 按 date 排序，找到当前日记的前一篇和后一篇
}
```

## 11. 验收标准

- [ ] 正确展示单篇日记完整内容
- [ ] 显示篇数序号
- [ ] 上一篇/下一篇按钮导航正确
- [ ] 第一篇/最后一篇边界按钮隐藏正确
- [ ] 左右滑动手势切换正常
- [ ] 翻书动画流畅（400ms，3D rotateY）
- [ ] 动画期间禁用交互
- [ ] 支持 `prefers-reduced-motion`
- [ ] 点击"时间线"跳转到 `/diary`
- [ ] 图片加载失败有占位处理
