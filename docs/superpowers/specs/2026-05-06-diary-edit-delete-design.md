# Issue #9 编辑日记 + 删除日记设计文档

## PRD 引用

- 来源：GitHub Issue #9 `[M2] 编辑日记 + 删除日记：复用表单 + 二次确认 Modal`
- 依赖：Issue #6（DiaryForm 组件）、Issue #7（单篇日记页）

## 1. 目标

实现日记的编辑和删除功能：
- 编辑页复用新建日记表单，预填充已有数据
- 单篇日记页提供编辑入口
- 删除需要二次确认 Modal，防止误操作

## 2. 范围

### 包含
- 编辑日记页 `/diary/[id]/edit`
- DiaryForm 组件改造（支持 create/edit 双模式）
- 单篇日记页编辑入口（顶部导航栏）
- 删除二次确认 Modal（animal-island-ui Modal）
- 删除成功后跳转 `/diary`

### 不包含
- 撤销删除（P2）
- 批量删除
- 角色权限隐藏（已提取为独立 Issue）

## 3. 架构

```
src/
  app/diary/[id]/edit/page.tsx       # 新增：编辑页 Server Component
  components/DiaryForm.tsx            # 改造：双模式表单
  components/DeleteConfirmModal.tsx   # 新增：删除确认 Modal
```

## 4. 组件设计

### 4.1 DiaryForm 改造

```typescript
interface DiaryFormProps {
  mode?: 'create' | 'edit';
  initialData?: DiaryEntry & { images: DiaryImage[] };
  entryId?: string;
}
```

**模式差异：**

| 行为 | create | edit |
|------|--------|------|
| 草稿 key | `diary-draft` | `diary-draft-edit-${entryId}` |
| 初始值 | 默认空值 | `initialData` 转换 |
| Server Action | `createDiary` | `updateDiary(entryId, data)` |
| 成功后跳转 | `/diary/${newId}` | `/diary/${entryId}` |

**initialData 转换逻辑：**
- `date` → `dayjs(date).format('YYYY-MM-DD')`
- `title` → 原值或空字符串
- `content` → 原值
- `mood` → 原值
- `images` → `images.map(img => img.url)`

### 4.2 编辑页 `/diary/[id]/edit/page.tsx`

Server Component：
1. 接收 `params: Promise<{ id: string }>`
2. 调用 `getDiaryById(id)` 获取数据
3. 日记不存在 → `notFound()`
4. 渲染布局（返回按钮 + "编辑日记"标题 + DiaryForm）

布局与新建页一致：
- 顶部：返回箭头 + "编辑日记"
- 主体：`DiaryForm mode="edit" initialData={entry} entryId={id}`
- 底部：删除按钮（红色）+ `DeleteConfirmModal`

### 4.3 单篇日记页编辑入口

改造 `PageFlipWrapper`，新增可选 `actions` prop：

```tsx
interface PageFlipWrapperProps {
  children: React.ReactNode;
  prevId: string | null;
  nextId: string | null;
  currentId: string;
  actions?: React.ReactNode; // 新增
}
```

`actions` 渲染在顶部导航栏右侧，翻页按钮旁边。

在 `diary/[id]/page.tsx` 中：

```tsx
<PageFlipWrapper
  prevId={prev}
  nextId={next}
  currentId={id}
  actions={
    <Link href={`/diary/${id}/edit`} aria-label="编辑">
      {/* 铅笔图标 */}
    </Link>
  }
>
  <DiaryDetail entry={entry} entryNumber={entryNumber} />
</PageFlipWrapper>
```

### 4.4 DeleteConfirmModal

基于 `animal-island-ui` Modal 组件：

```tsx
interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}
```

**文案：**
- 标题："要删除这篇日记吗？"
- 说明："删除后就不能在这里看到它了"
- 取消按钮："取消"
- 确认按钮："删除"（红色 danger）

**交互：**
- 点击遮罩或取消 → 关闭 Modal，不执行删除
- 点击删除 → 调用 `deleteDiary(id)`，显示 loading
- 成功 → 关闭 Modal，`router.push('/diary')`
- 失败 → Modal 内显示错误文字

## 5. 删除按钮位置

删除按钮放在**编辑页底部**，DiaryForm 表单下方：

```tsx
<div className="mt-6 pt-4 border-t border-border-soft">
  <Button type="danger" block onClick={() => setShowDeleteModal(true)}>
    删除这篇日记
  </Button>
</div>
```

样式：红色系（`#E57373` 或 `animal-island-ui` danger 样式），与保存按钮保持相同宽度。

## 6. 数据流

### 编辑流程
```
用户点击编辑图标
  → 路由跳转 /diary/[id]/edit
  → 编辑页 Server Component 获取日记数据
  → DiaryForm 预填充表单
  → 用户修改内容
  → 点击保存
  → 调用 updateDiary Server Action
  → 成功 → 跳转 /diary/[id]
  → 失败 → 表单显示错误提示
```

### 删除流程
```
用户在编辑页点击"删除这篇日记"
  → 弹出 DeleteConfirmModal
  → 用户点击确认删除
  → 调用 deleteDiary Server Action
  → 成功 → 跳转 /diary
  → 失败 → Modal 显示"删除失败，日记可能已被删除"
```

## 7. 错误处理

| 场景 | 处理方式 |
|------|---------|
| 访问不存在的日记编辑页 | `notFound()` → Next.js 默认 404 |
| 删除时日记已被删除 | 捕获异常，Modal 内显示错误 |
| 保存失败（网络/DB） | 表单顶部红色错误提示 |
| 编辑时取消 | `router.back()`，不保存 |
| 删除过程中关闭 Modal | 不执行删除 |

## 8. UI 规范

- 编辑页整体风格与新建页保持一致（奶油色系、圆角卡片）
- 编辑按钮：顶部导航栏，铅笔 SVG 图标，hover 变主色
- 删除按钮：红色 danger，位于编辑页底部，带顶部边框分隔
- Modal：使用 `animal-island-ui` 有机 blob 形状，红色确认按钮

## 9. 测试要点

- DiaryForm 预填充逻辑正确（日期格式化、图片 URL 提取）
- 编辑模式草稿 key 包含 entryId
- 删除确认流程：取消不删除、确认才删除
- 删除后正确跳转 `/diary`
- 编辑不存在的日记返回 404
- 删除不存在的日记显示错误

## 10. 决策记录

| 决策 | 结论 | 原因 |
|------|------|------|
| DiaryForm 复用方式 | 组件内模式切换（props） | 新建/编辑 UI 和逻辑 95% 相同，复用最自然 |
| 编辑入口位置 | PageFlipWrapper 顶部导航栏 | 浏览时随时可编辑，不破坏翻书体验 |
| 删除按钮位置 | 编辑页底部 | 避免详情页误触，删除需进入编辑页 |
| 草稿 key 策略 | `diary-draft-edit-${id}` | 与新建草稿隔离，每篇日记独立草稿 |
| 删除后跳转目标 | `/diary` 时间线目录 | PRD 要求，符合用户预期 |
