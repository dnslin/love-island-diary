# 新增日记页 + 极简详情页 — 设计文档

## 来源

- Issue #6: `[M2] 新增日记页：表单 + 心情选择器 + 外链图片 + 草稿自动保存`
- 设计决策会议：2026-05-03

## 背景与目标

写日记是产品的核心功能。第一版需要支持日期、标题、心情、正文和外链图片 URL。表单设计要简洁低负担，减少用户记录时的心理压力。

## 关键决策

1. **同时实现极简详情页占位**：Issue #7（单篇日记页）尚未开发，在 Issue #6 中同步实现一个极简 `/diary/[id]` 页面，确保保存后有地方跳转。
2. **心情选择器采用下拉形式**：新增页是后台记录场景，简洁高效优先，不追求趣味性。
3. **实现方案采用轻量受控组件**：使用 `useState` + 自定义 `useDiaryDraft` hook，不引入 `react-hook-form` 或 `useActionState`。

## 页面路由

| 路由 | 用途 | 类型 |
|------|------|------|
| `/diary/new` | 新增日记表单 | Client Component |
| `/diary/[id]/page.tsx` | 极简日记详情页占位 | Server Component |

## 新增组件清单

### `src/components/DiaryForm.tsx`

新增日记表单主组件。职责：
- 管理所有表单字段的受控状态
- 集成 `useDiaryDraft` 实现草稿自动保存
- 调用 `createDiary` Server Action 提交
- 保存成功后清草稿、显示提示、跳转详情页
- 客户端表单校验（正文非空、长度限制）

### `src/components/MoodSelector.tsx`

心情下拉选择器。职责：
- 展示 5 种心情选项的下拉面板
- 当前选中项显示色块圆点 + 文字
- 触发器与下拉面板均为自定义样式（非原生 `<select>`）

**心情数据：**

```typescript
const MOODS = [
  { value: 'sweet', label: '甜甜的', color: '#F7C8D0' },
  { value: 'happy', label: '开心', color: '#B8DDA8' },
  { value: 'miss',  label: '想念',  color: '#AFC9F7' },
  { value: 'calm',  label: '平静',  color: '#D8C7E8' },
  { value: 'sad',   label: '小难过', color: '#E8C4A0' },
] as const;
```

### `src/components/ImageUrlInput.tsx`

图片 URL 动态列表。职责：
- 显示已添加的 URL 列表，每项带删除按钮
- "添加图片"按钮，点击后展开输入框 + 确认/取消
- 前端用 `URL` 构造函数简单校验格式，无效 URL 不被添加

### `src/components/DiaryDetail.tsx`

极简详情页展示组件。职责：
- 接收 `DiaryEntry` + `DiaryImage[]` 数据
- 展示日期、心情标签、标题、正文、图片网格
- 标题为空时显示默认格式：`${formattedDate} 的心情`

### `src/hooks/useDiaryDraft.ts`

草稿自动保存 hook。职责：
- 初始化时从 `localStorage` 读取草稿
- 数据变化后 500ms 防抖自动保存
- 提供 `clearDraft` 方法供提交成功后调用

```typescript
function useDiaryDraft<T>(key: string, defaultValue: T) {
  const [draft, setDraft] = useState<T>(defaultValue);

  // 仅在客户端挂载后读取 localStorage，避免 SSR hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setDraft(JSON.parse(saved));
      } catch {
        localStorage.removeItem(key);
      }
    }
  }, [key]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, key]);

  const clearDraft = () => localStorage.removeItem(key);

  return [draft, setDraft, clearDraft] as const;
}
```

## 表单布局设计

从上到下依次为：

1. **顶部栏**：左侧返回按钮，中间标题"写下今天"
2. **日期行**：日期 `input[type="date"]`（默认今天）+ 心情选择器并排；移动端上下堆叠
3. **标题输入**：单行文本，placeholder"给今天起个名字（可选）"
4. **正文输入**：多行 textarea，最小 8 行高，placeholder"今天发生了什么？"
5. **字符计数**：textarea 右下角显示 `当前长度 / 10000`，超限后文字变红
6. **图片 URL 区域**：已添加 URL 列表（带删除）+ 添加按钮
7. **底部保存按钮**：`position: sticky`，移动端避免被键盘遮挡

## 数据流

```
用户输入 → DiaryForm (useState)
    ↓ (防抖 500ms)
localStorage.setItem('diary-draft', JSON.stringify(formData))
    ↓ (用户点击保存)
createDiary Server Action → Prisma → SQLite
    ↓ (成功)
localStorage.removeItem('diary-draft')
useRouter().push(`/diary/${id}`)
```

## 表单校验规则

| 规则 | 校验时机 | 处理方式 |
|------|----------|----------|
| 正文非空 | 提交时 | 阻止提交，显示提示"写点什么吧" |
| 正文 ≤ 10000 字符 | 实时 + 提交时 | 超限时保存按钮禁用，字符计数变红 |
| 图片 URL 格式 | 添加时 | 无效 URL 不加入列表 |
| 日期必填 | 提交时 | 日期 input 默认今天，理论上不会为空 |

## 错误处理

- **服务端校验失败**（如 content 超 10000）：显示通用错误提示"保存失败，请检查内容"
- **服务端异常**（数据库错误）：显示"保存失败，请稍后重试"
- **重复提交**：保存按钮 loading 态 + 禁用
- **草稿恢复异常**（localStorage 数据损坏）：静默回退到默认值，不阻断用户使用

## 极简详情页设计

**页面结构：**

1. **顶部栏**：返回按钮 + 日期标题（如"2025年1月15日"）
2. **内容卡片**：
   - 标题（空时显示 `${date} 的心情`）
   - 心情标签（色块圆点 + 文字）
   - 正文
   - 图片网格：1 张时全宽，多张时 2 列网格

**响应式：**

- 移动端：图片单列
- 桌面端：内容区 max-width 480px 居中，图片最多 2 列

## 测试策略

### 新增测试文件

| 测试目标 | 位置 |
|----------|------|
| `useDiaryDraft` hook | `src/hooks/__tests__/useDiaryDraft.test.ts` |
| `MoodSelector` 组件 | `src/components/__tests__/MoodSelector.test.tsx` |
| `ImageUrlInput` 组件 | `src/components/__tests__/ImageUrlInput.test.tsx` |
| 表单校验逻辑 | `src/components/__tests__/DiaryForm.validation.test.tsx` |

### 已有测试沿用

`src/lib/__tests__/actions.test.ts` 中 `createDiary` 相关测试已覆盖服务端校验和数据库写入，无需修改。

### 边界情况自测清单

- [ ] 正文刚好 10000 字符允许提交
- [ ] 正文 10001 字符客户端阻止、服务端也拒绝
- [ ] 快速连续点击保存按钮（按钮 loading 态防重）
- [ ] 刷新页面后草稿自动恢复
- [ ] 标题为空提交后，详情页显示默认标题
- [ ] 添加无效 URL（如"not-a-url"）不被接受
- [ ] 保存成功后 localStorage 草稿被清除
- [ ] `prefers-reduced-motion` 下无动画

## 不包含范围

- 天气字段（P2）
- 标签系统（P2）
- 图片本地上传（P1）
- 富文本编辑器（纯文本即可）
- 上一篇/下一篇翻页导航（Issue #7）

## 依赖

- `animal-island-ui`（Button、Input 等组件）
- `framer-motion`（项目已有，但心情选择器本次不使用动画）
- `dayjs`（日期格式化）
- 已有 Server Actions：`createDiary`、`getDiaryById`
- 已有 Schema：`CreateDiarySchema`
